// Composes daily log email (HTML summary + NDJSON attachment) and deletes the day's key.
const { Redis } = require("@upstash/redis");
const { Resend } = require("resend");
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");

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
    sampleFirstLine: (lines[0] && typeof lines[0] === 'string') ? lines[0].substring(0, 100) + "..." : "No logs found"
  });

  if (lines.length === 0) {
    console.log("⚠️ No logs found for date:", targetDate);
  }

  // Collect daily analytics
  const analytics = await collectDailyAnalytics(targetDate, redis);

  const total = lines.length;
  const levelCounts = { 
    fatal: 0, 
    critical: 0, 
    error: 0, 
    warning: 0,
    warn: 0, 
    notice: 0,
    info: 0, 
    debug: 0, 
    trace: 0, 
    silly: 0,
    other: 0 
  };
  const sampleErrors = [];
  const errorCategories = {
    authentication: 0,
    authorization: 0,
    validation: 0,
    database: 0,
    network: 0,
    filesystem: 0,
    external_api: 0,
    redis: 0,
    other: 0
  };
  const errorPatterns = {};
  const topErrorMessages = {};

  console.log("🔬 Processing log lines for analysis...");

  // Debug: Check first few lines
  console.log("🔍 Sample raw lines from Redis:", lines.slice(0, 3));

  for (const line of lines) {
    try {
      if (typeof line !== 'string') {
        console.warn("⚠️ Non-string line found:", typeof line, line);
        levelCounts.other += 1;
        continue;
      }
      const obj = JSON.parse(line);
      const lvl = typeof obj.level === "number" ? obj.level : obj.level;
      
      // Improved level classification with more granular mapping
      let name;
      if (typeof lvl === "number") {
        if (lvl >= 60) name = "fatal";
        else if (lvl >= 55) name = "critical";
        else if (lvl >= 50) name = "error";
        else if (lvl >= 45) name = "warning";
        else if (lvl >= 40) name = "warn";
        else if (lvl >= 35) name = "notice";
        else if (lvl >= 30) name = "info";
        else if (lvl >= 25) name = "debug";
        else if (lvl >= 20) name = "trace";
        else name = "silly";
      } else {
        // Handle string levels
        const levelStr = String(lvl).toLowerCase();
        if (["fatal", "critical", "error", "warning", "warn", "notice", "info", "debug", "trace", "silly"].includes(levelStr)) {
          name = levelStr;
        } else {
          name = "other";
        }
      }
      
      levelCounts[name] = (levelCounts[name] || 0) + 1;

      if ((name === "error" || name === "fatal" || name === "critical") && sampleErrors.length < 10) {
        // Categorize error
        let category = 'other';
        const errorMsg = (obj.msg || '').toLowerCase();
        const errorStack = (obj.err || obj.stack || '').toLowerCase();
        
        if (errorMsg.includes('auth') || errorMsg.includes('login') || errorMsg.includes('token') || errorMsg.includes('password')) {
          category = 'authentication';
        } else if (errorMsg.includes('forbidden') || errorMsg.includes('unauthorized') || errorMsg.includes('permission')) {
          category = 'authorization';
        } else if (errorMsg.includes('validation') || errorMsg.includes('required') || errorMsg.includes('invalid')) {
          category = 'validation';
        } else if (errorMsg.includes('mongo') || errorMsg.includes('database') || errorMsg.includes('mongoose')) {
          category = 'database';
        } else if (errorMsg.includes('network') || errorMsg.includes('connection') || errorMsg.includes('timeout')) {
          category = 'network';
        } else if (errorMsg.includes('file') || errorMsg.includes('fs') || errorMsg.includes('read') || errorMsg.includes('write')) {
          category = 'filesystem';
        } else if (errorMsg.includes('api') || errorMsg.includes('http') || errorMsg.includes('request')) {
          category = 'external_api';
        } else if (errorMsg.includes('redis') || errorMsg.includes('upstash')) {
          category = 'redis';
        }
        
        errorCategories[category]++;
        
        // Track error patterns (simplified message patterns)
        const pattern = errorMsg.split(' ').slice(0, 3).join(' ');
        errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
        
        // Track top error messages
        const fullMsg = obj.msg || 'Unknown error';
        topErrorMessages[fullMsg] = (topErrorMessages[fullMsg] || 0) + 1;
        
        sampleErrors.push({
          time: obj.time,
          msg: obj.msg,
          err: obj.err,
          requestId: obj.requestId,
          route: (obj.req && obj.req.url) || obj.route,
          status: (obj.res && obj.res.statusCode) || obj.statusCode,
          category,
          stack: obj.stack
        });
      }
    } catch (parseError) {
      console.warn("⚠️ Failed to parse log line:", parseError.message, "Line:", line);
      levelCounts.other += 1;
    }
  }

  console.log("📈 Log analysis complete:", {
    total,
    levelCounts,
    sampleErrorsCount: sampleErrors.length,
    errorCategories,
    topErrorPatterns: Object.entries(errorPatterns).sort(([,a], [,b]) => b - a).slice(0, 5)
  });

  // Process lines to create validLines array first
  const validLines = [];
  for (const line of lines) {
    if (typeof line === 'string' && line.trim()) {
      try {
        // Validate it's parseable JSON
        JSON.parse(line);
        validLines.push(line);
      } catch (e) {
        console.warn("⚠️ Invalid JSON line skipped:", line.substring(0, 100));
      }
    } else {
      console.warn("⚠️ Non-string or empty line skipped:", typeof line, line);
    }
  }

  const subject = `[${appLabel}] Daily logs & analytics ${targetDate} — logs: ${validLines.length}, errors: ${levelCounts.error || 0}`;
  
  console.log("📝 Preparing email:", {
    subject,
    emailTo,
    emailFrom,
    totalLines: lines.length,
    validLines: validLines.length,
    attachmentSize: validLines.length > 0 ? validLines.join("\n").length + " bytes" : "No attachment"
  });

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif">
      <h2>${appLabel} — Daily Logs & Analytics for ${targetDate}</h2>
      <p><strong>Total entries:</strong> ${total} (${validLines.length} valid)</p>
      <ul>
        <li>fatal: ${levelCounts.fatal}</li>
        <li>critical: ${levelCounts.critical}</li>
        <li>error: ${levelCounts.error}</li>
        <li>warning: ${levelCounts.warning}</li>
        <li>warn: ${levelCounts.warn}</li>
        <li>notice: ${levelCounts.notice}</li>
        <li>info: ${levelCounts.info}</li>
        <li>debug: ${levelCounts.debug}</li>
        <li>trace: ${levelCounts.trace}</li>
        <li>silly: ${levelCounts.silly}</li>
        <li>other: ${levelCounts.other}</li>
      </ul>
      
      ${analytics ? `
      <h3>📊 Comprehensive Daily Analytics</h3>
      
      <h4>👥 User Analytics</h4>
      <ul>
        <li><strong>New user registrations today:</strong> ${analytics.newUsersToday}</li>
        <li><strong>Total users (all time):</strong> ${analytics.totalUsers}</li>
        <li><strong>Active users today:</strong> ${analytics.activeUsersToday}</li>
        <li><strong>User roles:</strong> ${Object.entries(analytics.userRoleDistribution).map(([role, count]) => `${role}: ${count}`).join(', ')}</li>
      </ul>
      
      <h4>📝 Post Analytics</h4>
      <ul>
        <li><strong>Total posts:</strong> ${analytics.totalPosts} (${analytics.publishedPosts} published, ${analytics.draftPosts} drafts)</li>
        <li><strong>New posts today:</strong> ${analytics.newPostsToday}</li>
        <li><strong>Posts published today:</strong> ${analytics.postsPublishedToday}</li>
        <li><strong>Posts by category:</strong> ${Object.entries(analytics.postsByCategory).map(([cat, count]) => `${cat}: ${count}`).join(', ')}</li>
      </ul>
      
      <h4>❤️ Engagement Analytics</h4>
      <ul>
        <li><strong>Unique visitors today:</strong> ${analytics.totalVisitorsToday}</li>
        <li><strong>Posts viewed today:</strong> ${analytics.postsViewedToday}</li>
        <li><strong>Total post views today:</strong> ${analytics.totalPostViewsToday}</li>
        <li><strong>Total views (all time):</strong> ${analytics.totalViewsAllTime}</li>
        <li><strong>Total likes (all time):</strong> ${analytics.totalLikesAllTime}</li>
        <li><strong>Posts with likes today:</strong> ${analytics.postsLikedToday}</li>
      </ul>
      
      <h4>🔌 API Usage Analytics</h4>
      <ul>
        <li><strong>Total API requests:</strong> ${analytics.apiRequests}</li>
        <li><strong>Auth requests:</strong> ${analytics.authRequests}</li>
        <li><strong>Post requests:</strong> ${analytics.postRequests}</li>
        <li><strong>Error responses:</strong> ${analytics.errorRequests}</li>
        <li><strong>Average response time:</strong> ${analytics.avgResponseTime}ms</li>
        <li><strong>Top endpoints:</strong> ${analytics.topEndpoints.map(([endpoint, count]) => `${endpoint} (${count})`).join(', ')}</li>
        <li><strong>Top user agents:</strong> ${analytics.topUserAgents.slice(0, 3).map(([ua, count]) => `${ua.substring(0, 50)}... (${count})`).join('; ')}</li>
      </ul>
      
      <h4>🔐 Authentication Analytics</h4>
      <ul>
        <li><strong>Login attempts:</strong> ${analytics.loginAttempts}</li>
        <li><strong>OAuth attempts:</strong> ${analytics.oauthAttempts}</li>
      </ul>
      
      <h4>⚡ System Performance</h4>
      <ul>
        <li><strong>Redis memory used:</strong> ${analytics.redisMemoryUsed ? `${Math.round(analytics.redisMemoryUsed / 1024 / 1024)}MB` : 'N/A'}</li>
        <li><strong>Redis connections:</strong> ${analytics.redisConnections || 'N/A'}</li>
      </ul>
      ` : '<p>⚠️ Analytics data not available</p>'}
      
      ${sampleErrors.length ? `
      <h3>🚨 Error Analysis</h3>
      <h4>Error Categories</h4>
      <ul>
        <li><strong>Authentication:</strong> ${errorCategories.authentication}</li>
        <li><strong>Authorization:</strong> ${errorCategories.authorization}</li>
        <li><strong>Validation:</strong> ${errorCategories.validation}</li>
        <li><strong>Database:</strong> ${errorCategories.database}</li>
        <li><strong>Network:</strong> ${errorCategories.network}</li>
        <li><strong>Filesystem:</strong> ${errorCategories.filesystem}</li>
        <li><strong>External API:</strong> ${errorCategories.external_api}</li>
        <li><strong>Redis:</strong> ${errorCategories.redis}</li>
        <li><strong>Other:</strong> ${errorCategories.other}</li>
      </ul>
      
      <h4>Top Error Patterns</h4>
      <ul>
        ${Object.entries(errorPatterns)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([pattern, count]) => `<li><strong>${pattern}:</strong> ${count} occurrences</li>`)
          .join('')}
      </ul>
      
      <h4>Sample Errors</h4>
      ` : ''}
      ${sampleErrors
        .map(
          (e) => `<pre style="white-space:pre-wrap;background:#f6f8fa;padding:10px;border-radius:6px;margin-bottom:10px">
Time: ${new Date(e.time || Date.now()).toISOString()}
Category: ${e.category}
Msg: ${e.msg || ""}
RequestId: ${e.requestId || ""}
Route: ${e.route || ""}
Status: ${e.status || ""}
Stack: ${e.stack ? e.stack.substring(0, 500) + "..." : ""}
</pre>`
        )
        .join("")}
      <p>Full logs attached as NDJSON. This key will be deleted after send.</p>
    </div>
  `;

  // NDJSON attachment (keep volume reasonable with LOGS_MAX_PER_DAY and LOG_TO_REDIS_LEVEL)
  console.log("📄 Creating NDJSON attachment...");
  
  const ndjson = validLines.join("\n");
  console.log("✅ NDJSON created:", {
    totalLines: lines.length,
    validLines: validLines.length,
    ndjsonLength: ndjson.length,
    sampleLine: validLines[0]?.substring(0, 100) + "..." || "No valid lines"
  });
  
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
    if (validLines.length > 0) {
      const ndjson = validLines.join("\n");
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
      console.log("📎 No valid logs to attach");
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

async function collectDailyAnalytics(targetDate, redis) {
  console.log("📊 Collecting comprehensive daily analytics for:", targetDate);
  
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        console.warn("⚠️ MONGODB_URI not set, skipping analytics");
        return null;
      }
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to MongoDB for analytics");
    }

    // 1. User Analytics
    const startOfDay = new Date(targetDate + "T00:00:00.000Z");
    const endOfDay = new Date(targetDate + "T23:59:59.999Z");
    
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    const totalUsers = await User.countDocuments();
    
    // Active users today (users who performed any action)
    const activeUsersToday = await User.countDocuments({
      updatedAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    // User role distribution
    const userRoleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    // 2. Post Analytics
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });
    
    const newPostsToday = await Post.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    const postsPublishedToday = await Post.countDocuments({
      publishedAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    // Posts by category
    const postsByCategory = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { categoryName: '$category.name', count: 1 } }
    ]);
    
    // 3. Engagement Analytics (from Redis)
    const viewedKeys = await redis.keys("post:viewed:*:session_*");
    const todaySessions = new Set();
    let totalPostViewsToday = 0;
    
    for (const key of viewedKeys) {
      try {
        const parts = key.split(":");
        if (parts.length >= 4) {
          const sessionId = parts[3];
          todaySessions.add(sessionId);
          // Count views for this session
          const viewData = await redis.get(key);
          if (viewData) {
            totalPostViewsToday += parseInt(viewData) || 0;
          }
        }
      } catch (e) {
        console.warn("⚠️ Error processing view key:", key, e.message);
      }
    }
    
    const totalVisitorsToday = todaySessions.size;
    
    // Posts with views today
    const viewKeys = await redis.keys("post:views:*");
    let postsViewedToday = 0;
    let totalViewsAllTime = 0;
    
    for (const key of viewKeys) {
      try {
        const viewCount = await redis.get(key);
        const count = parseInt(viewCount) || 0;
        totalViewsAllTime += count;
        if (count > 0) {
          postsViewedToday++;
        }
      } catch (e) {
        console.warn("⚠️ Error processing view count key:", key, e.message);
      }
    }
    
    // Like analytics
    const likeKeys = await redis.keys("post:likes:*");
    let totalLikesAllTime = 0;
    let postsLikedToday = 0;
    
    for (const key of likeKeys) {
      try {
        const likeData = await redis.smembers(key);
        totalLikesAllTime += likeData.length;
        // Check if any likes were added today (rough approximation)
        if (likeData.length > 0) {
          postsLikedToday++;
        }
      } catch (e) {
        console.warn("⚠️ Error processing like key:", key, e.message);
      }
    }
    
    // 4. API Usage Analytics (from logs)
    // We'll analyze logs for API endpoint usage
    const logsKey = `logs:mern-app:${targetDate}`;
    const logLines = (await redis.lrange(logsKey, 0, -1)) || [];
    
    let apiRequests = 0;
    let authRequests = 0;
    let postRequests = 0;
    let errorRequests = 0;
    let avgResponseTime = 0;
    let responseTimeCount = 0;
    
    const endpointStats = {};
    const userAgentStats = {};
    const ipStats = {};
    
    for (const line of logLines) {
      try {
        const obj = JSON.parse(line);
        
        // API request tracking
        if (obj.req && obj.req.url) {
          apiRequests++;
          const endpoint = obj.req.url.split('?')[0]; // Remove query params
          endpointStats[endpoint] = (endpointStats[endpoint] || 0) + 1;
          
          // Categorize by type
          if (endpoint.includes('/auth/')) authRequests++;
          if (endpoint.includes('/posts/')) postRequests++;
        }
        
        // Error tracking
        if (obj.level >= 50) { // error level and above
          errorRequests++;
        }
        
        // Response time tracking
        if (obj.responseTime || obj.duration) {
          const duration = obj.responseTime || obj.duration;
          if (typeof duration === 'number') {
            avgResponseTime += duration;
            responseTimeCount++;
          }
        }
        
        // User agent tracking
        if (obj.req && obj.req.headers && obj.req.headers['user-agent']) {
          const ua = obj.req.headers['user-agent'];
          userAgentStats[ua] = (userAgentStats[ua] || 0) + 1;
        }
        
        // IP tracking
        if (obj.req && obj.req.ip) {
          ipStats[obj.req.ip] = (ipStats[obj.req.ip] || 0) + 1;
        }
        
      } catch (e) {
        // Skip invalid log lines
      }
    }
    
    if (responseTimeCount > 0) {
      avgResponseTime = Math.round(avgResponseTime / responseTimeCount);
    }
    
    // Top endpoints
    const topEndpoints = Object.entries(endpointStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    // Top user agents
    const topUserAgents = Object.entries(userAgentStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Top IPs
    const topIPs = Object.entries(ipStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    // 5. Authentication Analytics
    const loginAttempts = logLines.filter(line => {
      try {
        const obj = JSON.parse(line);
        return obj.req && obj.req.url && obj.req.url.includes('/auth/login');
      } catch { return false; }
    }).length;
    
    const oauthAttempts = logLines.filter(line => {
      try {
        const obj = JSON.parse(line);
        return obj.req && obj.req.url && obj.req.url.includes('/auth/google');
      } catch { return false; }
    }).length;
    
    // 6. System Performance
    const redisInfo = await redis.info();
    const redisMemory = redisInfo.match(/used_memory:(\d+)/)?.[1];
    const redisConnections = redisInfo.match(/connected_clients:(\d+)/)?.[1];
    
    // Compile comprehensive analytics
    const analytics = {
      // User Analytics
      newUsersToday,
      totalUsers,
      activeUsersToday,
      userRoleDistribution: userRoleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      
      // Post Analytics
      totalPosts,
      publishedPosts,
      draftPosts,
      newPostsToday,
      postsPublishedToday,
      postsByCategory: postsByCategory.reduce((acc, stat) => {
        acc[stat.categoryName || 'Uncategorized'] = stat.count;
        return acc;
      }, {}),
      
      // Engagement Analytics
      totalVisitorsToday,
      postsViewedToday,
      totalPostViewsToday,
      totalViewsAllTime,
      totalLikesAllTime,
      postsLikedToday,
      
      // API Usage Analytics
      apiRequests,
      authRequests,
      postRequests,
      errorRequests,
      avgResponseTime,
      topEndpoints,
      topUserAgents,
      topIPs,
      
      // Authentication Analytics
      loginAttempts,
      oauthAttempts,
      
      // System Performance
      redisMemoryUsed: redisMemory ? parseInt(redisMemory) : null,
      redisConnections: redisConnections ? parseInt(redisConnections) : null,
      
      date: targetDate
    };
    
    console.log("✅ Comprehensive daily analytics collected:", {
      users: { new: newUsersToday, total: totalUsers, active: activeUsersToday },
      posts: { total: totalPosts, new: newPostsToday, published: postsPublishedToday },
      engagement: { visitors: totalVisitorsToday, views: totalPostViewsToday, likes: totalLikesAllTime },
      api: { requests: apiRequests, errors: errorRequests, avgResponseTime },
      system: { redisMemory, redisConnections }
    });
    
    return analytics;
    
  } catch (error) {
    console.error("❌ Error collecting comprehensive daily analytics:", error);
    return null;
  }
}

module.exports = { sendDailyLogs, collectDailyAnalytics };
