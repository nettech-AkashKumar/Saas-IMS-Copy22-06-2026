/**
 * Security Headers Middleware
 * Implements OWASP security headers to prevent common attacks
 */

const { logger } = require("../../utils/logger");

// Safe logger wrapper (prevents "logger.warn is not a function")
const safeLog = {
  security: logger?.security?.bind(logger) || console.warn,
  warn: logger?.warn?.bind(logger) || console.warn,
  debug: logger?.debug?.bind(logger) || console.log,
  error: logger?.error?.bind(logger) || console.error,
};

/**
 * Content Security Policy (CSP) - Prevents XSS attacks
 */
const cspHeader = {
  "default-src": ["'self'"],

  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
  ],

  "style-src": [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
  ],

  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
  ],

  "img-src": [
    "'self'",
    "data:",
    "https:",
  ],

  "connect-src": [
    "'self'",
    "https:",
    "http://localhost:*",
    "ws:",
    "wss:",
  ],

  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

/**
 * Build CSP header string
 */
const buildCSPHeader = () => {
  return Object.entries(cspHeader)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  try {
    // Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // XSS protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer policy
    res.setHeader(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    // Disable browser APIs
    res.setHeader(
      "Permissions-Policy",
      [
        "accelerometer=()",
        "camera=()",
        "geolocation=()",
        "gyroscope=()",
        "magnetometer=()",
        "microphone=()",
        "payment=()",
        "usb=()",
      ].join(", ")
    );

    // CSP
    res.setHeader(
      "Content-Security-Policy",
      buildCSPHeader()
    );

    // HSTS in production only
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }

    // Hide server details
    res.removeHeader("X-Powered-By");
    res.setHeader("Server", "IMS Server");

    next();
  } catch (err) {
    safeLog.error("Security header error", {
      message: err.message,
      stack: err.stack,
    });
    next();
  }
};

/**
 * Input validation middleware
 */
const inputValidation = (req, res, next) => {
  try {
    const validateInput = (obj) => {
      if (!obj || typeof obj !== "object") return;

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          // SQL Injection detection
          if (
            /['";\\]/g.test(value) &&
            /^(\w+\s*(=|LIKE|IN|WHERE|OR|AND|SELECT|INSERT|UPDATE|DELETE))/i.test(
              value
            )
          ) {
            safeLog.security(
              "Potential SQL injection detected",
              {
                field: key,
                value: value.substring(0, 100),
                ip: req.ip,
                path: req.path,
              }
            );
          }

          // XSS detection
          if (
            /<script|javascript:|onerror|onload|<iframe|<object/i.test(
              value
            )
          ) {
            safeLog.security(
              "Potential XSS attack detected",
              {
                field: key,
                value: value.substring(0, 100),
                ip: req.ip,
                path: req.path,
              }
            );
          }
        } else if (
          typeof value === "object" &&
          value !== null
        ) {
          validateInput(value);
        }
      }
    };

    validateInput(req.body);
    validateInput(req.query);
    validateInput(req.params);

    next();
  } catch (err) {
    safeLog.error("Input validation error", {
      message: err.message,
      stack: err.stack,
    });
    next();
  }
};

/**
 * Prevent HTTP parameter pollution
 */
const parameterPollutionCheck = (req, res, next) => {
  try {
    const queryKeys = Object.keys(req.query);

    const duplicates =
      queryKeys.length !== new Set(queryKeys).size;

    if (duplicates) {
      safeLog.warn(
        "Possible HTTP parameter pollution detected",
        {
          query: req.query,
          ip: req.ip,
          path: req.path,
        }
      );
    }

    next();
  } catch (err) {
    safeLog.error(
      "Parameter pollution check error",
      {
        message: err.message,
        stack: err.stack,
      }
    );
    next();
  }
};

/**
 * CORS security checks
 */
const corsSecurityCheck = (req, res, next) => {
  try {
    const origin = req.get("origin");
    const referrer = req.get("referer");

    if (
      origin &&
      referrer &&
      !referrer.includes(origin)
    ) {
      safeLog.debug(
        "Cross-origin request detected",
        {
          origin,
          referrer,
          method: req.method,
          path: req.path,
        }
      );
    }

    next();
  } catch (err) {
    safeLog.error(
      "CORS security check error",
      {
        message: err.message,
        stack: err.stack,
      }
    );
    next();
  }
};

module.exports = {
  securityHeaders,
  inputValidation,
  parameterPollutionCheck,
  corsSecurityCheck,
  buildCSPHeader,
};