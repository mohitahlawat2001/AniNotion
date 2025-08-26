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
  console.log("📧 Starting sendDailyLogs function:", {
    timestamp: new Date().toISOString(),
    date: date || "auto (yesterday)",
    label: label || "default",
    upstashUrl: upstashUrl ? "***PROVIDED***" : "***MISSING***",
    upstashToken: upstashToken ? "***PROVIDED***" : "***MISSING***",
    emailTo: emailTo || "***MISSING***",
    emailFrom: emailFrom || "***MISSING***"
  });

  if (!upstashUrl || !upstashToken) {
    console.error("❌ Upstash Redis configuration missing");
    throw new Error("Upstash Redis env not set");
  }
  
  if (!emailTo || !emailFrom) {
    console.error("❌ Email configuration missing");
    throw new Error("Email env not set");
  }
  
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY not set");
    throw new Error("RESEND_API_KEY not set");
  }

  console.log("✅ All required environment variables are present");

  console.log("✅ All required environment variables are present");

  const redis = new Redis({ url: upstashUrl, token: upstashToken });
  const resend = new Resend(resendApiKey);

  const targetDate = date || toDateStr(new Date(Date.now() - 24 * 3600 * 1000)); // yesterday UTC
  const appLabel = label || process.env.APP_NAME || "mern-app";
  const key = `logs:${appLabel}:${targetDate}`;

  console.log("🔍 Fetching logs from Redis:", {
    targetDate,
    appLabel,
    redisKey: key
  });

  const lines = (await redis.lrange(key, 0, -1)) || [];
  console.log("📊 Retrieved logs from Redis:", {
    totalLines: lines.length,
    sampleFirstLine: lines[0] ? lines[0].substring(0, 100) + "..." : "No logs found"
  });

  if (lines.length === 0) {
    console.log("⚠️ No logs found for date:", targetDate);
  }

  const total = lines.length;
  const levelCounts = { fatal: 0, error: 0, warn: 0, info: 0, debug: 0, trace: 0, other: 0 };
  const sampleErrors = [];

  console.log("🔬 Processing log lines for analysis...");

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

  console.log("📈 Log analysis complete:", {
    total,
    levelCounts,
    sampleErrorsCount: sampleErrors.length
  });

  const subject = `[${appLabel}] Daily logs ${targetDate} — total ${total}, errors ${levelCounts.error || 0}`;
  
  console.log("📝 Preparing email:", {
    subject,
    emailTo,
    emailFrom,
    attachmentSize: lines.join("\n").length + " bytes"
  });

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

  console.log("📧 Sending email via Resend:", {
    to: emailTo,
    from: emailFrom,
    subject: subject.substring(0, 50) + "...",
    hasAttachment: true,
    attachmentFilename: attachment.filename
  });

  try {
    // Prepare email payload
    const emailPayload = {
      from: emailFrom,
      to: emailTo,
      subject,
      html,
    };

    // Only add attachment if there are logs to attach
    if (lines.length > 0) {
      const ndjson = lines.join("\n");
      const attachment = {
        filename: `logs-${appLabel}-${targetDate}.ndjson`,
        content: Buffer.from(ndjson).toString("base64"),
        contentType: "application/x-ndjson",
      };
      emailPayload.attachments = [attachment];
      
      console.log("📎 Adding attachment:", {
        filename: attachment.filename,
        contentLength: ndjson.length,
        base64Length: attachment.content.length
      });
    } else {
      console.log("📎 No attachment added (no logs to attach)");
    }

    console.log("📧 Final email payload:", {
      to: emailPayload.to,
      from: emailPayload.from,
      subject: emailPayload.subject.substring(0, 50) + "...",
      hasAttachment: !!emailPayload.attachments,
      attachmentCount: emailPayload.attachments?.length || 0
    });

    const emailResult = await resend.emails.send(emailPayload);

    // Check if there was an error in the response
    if (emailResult.error) {
      console.error("💥 Resend API error:", {
        error: emailResult.error,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Resend API error: ${emailResult.error.error || emailResult.error.message}`);
    }

    console.log("✅ Email sent successfully:", {
      emailId: emailResult.data?.id || emailResult.id,
      timestamp: new Date().toISOString(),
      fullResult: emailResult
    });
  } catch (emailError) {
    console.error("💥 Failed to send email:", {
      error: emailError.message,
      stack: emailError.stack,
      timestamp: new Date().toISOString(),
      resendResponse: emailError.response?.data || emailError.response
    });
    throw emailError;
  }

  console.log("🗑️ Deleting Redis key:", key);
  await redis.del(key);

  const result = { sent: true, total, levelCounts, keyDeleted: key };
  console.log("🎉 sendDailyLogs completed successfully:", result);

  return result;
}

module.exports = { sendDailyLogs };
