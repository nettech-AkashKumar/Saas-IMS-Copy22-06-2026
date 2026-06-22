/**
 * Host Validation Middleware
 */
const { logger } = require("../../utils/logger");

const getAllowedHosts = () => [
  /^localhost(:\d+)?$/,
  /^127\.0\.0\.1(:\d+)?$/,
  /^[a-zA-Z0-9-]+\.localhost(:\d+)?$/,

  // root domain
  /^imsmymunc\.com(:\d+)?$/,

  // all subdomains
  /^[a-zA-Z0-9-]+\.imsmymunc\.com(:\d+)?$/,
];

const hostValidation = (req, res, next) => {
  try {
    const host =
      req.headers["x-forwarded-host"] ||
      req.get("host");

    if (process.env.NODE_ENV !== "production") {
      return next();
    }

    if (!host) return next();

    // normalize host
    const cleanHost = host.trim().toLowerCase();

    const isValid = getAllowedHosts().some((pattern) =>
      pattern.test(cleanHost)
    );

    if (!isValid) {
      logger.warn("Invalid host header", {
        host: cleanHost,
        ip: req.ip,
        path: req.path,
        ua: req.get("user-agent"),
      });

      return res.status(403).json({
        success: false,
        message: "Invalid host",
      });
    }

    next();
  } catch (err) {
    logger.error("Host validation error", {
      message: err.message,
    });
    next();
  }
};

module.exports = hostValidation;