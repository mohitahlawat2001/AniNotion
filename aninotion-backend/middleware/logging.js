// pino-http middleware with small, safe serializers
const pinoHttp = require("pino-http");
const logger = require("../config/logger");

module.exports = function requestLogger() {
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
          userAgent: req.headers["user-agent"],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  });
};
