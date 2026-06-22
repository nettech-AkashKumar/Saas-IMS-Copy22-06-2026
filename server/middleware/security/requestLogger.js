/**
 * Request Logger Middleware
 * Logs all incoming requests for monitoring and debugging
 */

const { logger } = require("../../utils/logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Capture response finish to log response details
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    
    logger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id || req.admin?._id || "anonymous",
      tenantId: req.tenant?._id || "N/A"
    });

    // Log errors
    if (res.statusCode >= 400) {
      logger.warn("HTTP Error Response", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });

  next();
};

module.exports = requestLogger;
