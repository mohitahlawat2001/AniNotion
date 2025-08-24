// Composes daily log email (HTML summary + NDJSON attachment) and deletes the day's key.
const { Redis } = require("@upstash/redis");
const { Resend } = require("resend");

function toDateStr(d) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function sendDailyLogs({ date, label, upstashUrl, upstashToken, emailTo, emailFrom }) {
  if (!upstashUrl || !upstashToken) throw new Error("Upstash Redis env not set");
  if (!emailTo || !emailFrom) throw new Error("Email env not set");
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

  const redis = new Redis({ url: upstashUrl, token: upstashToken });
  const resend = new Resend(resendApiKey);

  const targetDate = date || toDateStr(new Date(Date.now() - 24 * 3600 * 1000)); // yesterday UTC
  const appLabel = label || process.env.APP_NAME || "mern-app";
  const key = `logs:${appLabel}:${targetDate}`;

  const lines = (await redis.lrange(key, 0, -1)) || [];

  const total = lines.length;
  const levelCounts = { fatal: 0, error: 0, warn: 0, info: 0, debug: 0, trace: 0, other: 0 };
  const sampleErrors = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const lvl = typeof obj.level === "number" ? obj.level : obj.level;
      const name =
        typeof lvl === "number"
          ? (lvl >= 60 ? "fatal" : lvl >= 50 ? "error" : lvl >= 40 ? "warn" : lvl >= 30 ? "info" : lvl >= 20 ? "debug" : "trace")
          : (["fatal", "error", "warn", "info", "debug", "trace"].includes(lvl) ? lvl : "other");
      levelCounts[name] = (levelCounts[name] || 0) + 1;

      if ((name === "error" || name === "fatal") && sampleErrors.length < 10) {
        sampleErrors.push({
          time: obj.time,
          msg: obj.msg,
          err: obj.err,
          requestId: obj.requestId,
          route: (obj.req && obj.req.url) || obj.route,
          status: (obj.res && obj.res.statusCode) || obj.statusCode,
        });
      }
    } catch {
      levelCounts.other += 1;
    }
  }

  const subject = `[${appLabel}] Daily logs ${targetDate} — total ${total}, errors ${levelCounts.error || 0}`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">
      <h2>${appLabel} — Daily Logs for ${targetDate}</h2>
      <p><strong>Total entries:</strong> ${total}</p>
      <ul>
        <li>fatal: ${levelCounts.fatal}</li>
        <li>error: ${levelCounts.error}</li>
        <li>warn: ${levelCounts.warn}</li>
        <li>info: ${levelCounts.info}</li>
        <li>debug: ${levelCounts.debug}</li>
        <li>trace: ${levelCounts.trace}</li>
        <li>other: ${levelCounts.other}</li>
      </ul>
      ${sampleErrors.length ? "<h3>Sample errors</h3>" : ""}
      ${sampleErrors
        .map(
          (e) => `<pre style="white-space:pre-wrap;background:#f6f8fa;padding:10px;border-radius:6px">
Time: ${new Date(e.time || Date.now()).toISOString()}
Msg: ${e.msg || ""}
RequestId: ${e.requestId || ""}
Route: ${e.route || ""}
Status: ${e.status || ""}
Err: ${e.err ? (typeof e.err === "string" ? e.err : JSON.stringify(e.err, null, 2)) : ""}
</pre>`
        )
        .join("")}
      <p>Full logs attached as NDJSON. This key will be deleted after send.</p>
    </div>
  `;

  // NDJSON attachment (keep volume reasonable with LOGS_MAX_PER_DAY and LOG_TO_REDIS_LEVEL)
  const ndjson = lines.join("\n");
  const attachment = {
    filename: `logs-${appLabel}-${targetDate}.ndjson`,
    content: Buffer.from(ndjson).toString("base64"),
    contentType: "application/x-ndjson",
  };

  await resend.emails.send({
    from: emailFrom,
    to: emailTo,
    subject,
    html,
    attachments: [attachment],
  });

  await redis.del(key);

  return { sent: true, total, levelCounts, keyDeleted: key };
}

module.exports = { sendDailyLogs };
