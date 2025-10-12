// Performance monitoring middleware
const responseTime = require('response-time');
const pinoHttp = require('pino-http');
const logger = require('../config/logger');

module.exports = {
  requestLogger: function requestLogger() {
    return pinoHttp({
      logger,
      customLogLevel: function(req, res, err) {
        if (res.statusCode >= 500 || err) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        if (res.statusCode >= 300) {
          return "info";
        }
        return "info"; // 2xx responses
      },
      customSuccessMessage: function(req, res) {
        if (res.statusCode === 404) {
          return "Route not found";
        }
        if (res.statusCode >= 400) {
          return "Request failed";
        }
        return "Request completed successfully";
      },
      customErrorMessage: function(req, res, err) {
        return `Request failed: ${err.message}`;
      },
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
            originalUrl: req.originalUrl,
            path: req.path,
            query: req.query,
            params: req.params,
            userAgent: req.headers["user-agent"],
            contentType: req.headers["content-type"],
            contentLength: req.headers["content-length"],
            referer: req.headers["referer"],
            ip: req.ip,
            ips: req.ips,
            userId: req.user?._id,
            userRole: req.user?.role,
            userEmail: req.user?.email,
            sessionId: req.headers["x-session-id"] || req.query.sessionId,
            // Add geo information if available (would need geoip middleware)
            geo: req.geo || null,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
            headers: res.headers || {}
          };
        },
      },
      customProps: function(req, res) {
        return {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          userAgent: req.headers["user-agent"],
          ip: req.ip,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: res.responseTime,
          userId: req.user?._id,
          sessionId: req.headers["x-session-id"] || req.query.sessionId,
        };
      },
    });
  },

  performanceMonitor: function performanceMonitor() {
    return responseTime((req, res, time) => {
      // Log performance metrics for slow requests
      if (time > 1000) { // Log requests taking more than 1 second
        logger.warn("🐌 Slow request detected", {
          method: req.method,
          url: req.url,
          responseTime: Math.round(time),
          statusCode: res.statusCode,
          userId: req.user?._id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          timestamp: new Date().toISOString()
        });
      }

      // Store response time in res object for other middleware
      res.responseTime = Math.round(time);
    });
  }
};
