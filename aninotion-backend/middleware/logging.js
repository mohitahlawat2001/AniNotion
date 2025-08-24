// pino-http middleware with small, safe serializers
const pinoHttp = require("pino-http");
const logger = require("../config/logger");

module.exports = function requestLogger() {
  return pinoHttp({
    logger,
    customLogLevel(res, err) {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
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
