const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const WINDOW_15_MIN = 15 * 60 * 1000;
const WINDOW_1_MIN = 60 * 1000;

const buildKey = (req) => {
  const authHeader = req.headers.authorization || "";
  const host = req.headers.host || "";
  const ipPart = ipKeyGenerator(req.ip || "");
  // Stable key across proxy/load balancer by combining ip + host + auth token prefix
  return `${ipPart}:${host}:${authHeader.slice(0, 32)}`;
};

const limiterHandler = (defaultMessage) => (req, res) => {
  const retryAfter = Number(res.getHeader("Retry-After") || 60);
  res.status(429).json({
    error: defaultMessage,
    code: "RATE_LIMITED",
    retryAfterSeconds: retryAfter,
  });
};

// Universal API limiter for authenticated app usage
const globalLimiter = rateLimit({
  windowMs: WINDOW_15_MIN,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 3000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: limiterHandler("Too many requests, please try again later."),
});

// Auth/login limiter (stricter than global)
const authLimiter = rateLimit({
  windowMs: WINDOW_15_MIN,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: limiterHandler("Too many login attempts. Please try again in a few minutes."),
});

// Separate stricter limiter for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: WINDOW_1_MIN,
  max: Number(process.env.RATE_LIMIT_OTP_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: limiterHandler("Too many OTP requests. Please wait a minute before trying again."),
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
};
