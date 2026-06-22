/**
 * Enhanced Rate Limiter Configuration
 * Provides endpoint-specific rate limiting with various strictness levels
 */

const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { logger } = require("../../utils/logger");

// ============================================================================
// TIME WINDOWS
// ============================================================================
const WINDOWS = {
  ONE_MIN: 1 * 60 * 1000,
  FIVE_MIN: 5 * 60 * 1000,
  FIFTEEN_MIN: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000
};

// ============================================================================
// KEY GENERATOR
// ============================================================================
const buildKey = (req) => {
  const authHeader = req.headers.authorization || "";
  const host = req.headers.host || "";
  const ipPart = ipKeyGenerator(req.ip || "");
  return `${ipPart}:${host}:${authHeader.slice(0, 32)}`;
};

// ============================================================================
// RESPONSE HANDLER
// ============================================================================
const createHandler = (message) => (req, res) => {
  const retryAfter = Number(res.getHeader("Retry-After") || 60);
  logger.warn('Rate limit exceeded', {
    message,
    ip: req.ip,
    path: req.path,
    method: req.method,
    retryAfter
  });
  res.status(429).json({
    success: false,
    error: message,
    code: "RATE_LIMITED",
    retryAfterSeconds: retryAfter
  });
};

// ============================================================================
// GLOBAL LIMITERS
// ============================================================================

// General API access limiter
const globalLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 3000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many requests. Please try again later.")
});

// ============================================================================
// AUTHENTICATION LIMITERS
// ============================================================================

// Login attempts limiter (strict)
const authLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many login attempts. Please try again in a few minutes.")
});

// OTP generation (very strict)
const otpLimiter = rateLimit({
  windowMs: WINDOWS.ONE_MIN,
  max: Number(process.env.RATE_LIMIT_OTP_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many OTP requests. Please try again later.")
});

// ============================================================================
// SENSITIVE OPERATION LIMITERS
// ============================================================================

// Password reset limiter (very strict)
const passwordResetLimiter = rateLimit({
  windowMs: WINDOWS.ONE_HOUR,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many password reset attempts. Please try again after 1 hour.")
});

// Email verification limiter (strict)
const emailVerificationLimiter = rateLimit({
  windowMs: WINDOWS.ONE_HOUR,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many email verification attempts. Please try again later.")
});

// Account creation limiter (strict)
const accountCreationLimiter = rateLimit({
  windowMs: WINDOWS.ONE_HOUR,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many account creation attempts. Please try again later.")
});

// ============================================================================
// UPLOAD LIMITERS
// ============================================================================

// File upload limiter (moderate)
const fileUploadLimiter = rateLimit({
  windowMs: WINDOWS.ONE_HOUR,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Upload limit exceeded. Maximum 100 uploads per hour.")
});

// Bulk import limiter (strict)
const bulkImportLimiter = rateLimit({
  windowMs: WINDOWS.ONE_DAY,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Bulk import limit exceeded. Maximum 10 imports per day.")
});

// ============================================================================
// DATA EXPORT LIMITERS
// ============================================================================

// Report generation limiter (moderate)
const reportLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many report generation requests. Please wait before generating another.")
});

// Data export limiter (strict)
const dataExportLimiter = rateLimit({
  windowMs: WINDOWS.ONE_HOUR,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Data export limit exceeded. Maximum 10 exports per hour.")
});

// ============================================================================
// API READ LIMITERS
// ============================================================================

// Search/list operations limiter (moderate)
const searchLimiter = rateLimit({
  windowMs: WINDOWS.ONE_MIN,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many search requests. Please slow down.")
});

// ============================================================================
// ADMIN-SPECIFIC LIMITERS
// ============================================================================

// Admin operations limiter (moderate, for batch operations)
const adminOperationLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Too many admin operations. Please wait before performing more.")
});

// ============================================================================
// NOTIFICATION LIMITERS
// ============================================================================

// Email sending limiter (moderate)
const emailLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("Email sending limit exceeded. Please try again later.")
});

// SMS sending limiter (strict)
const smsLimiter = rateLimit({
  windowMs: WINDOWS.FIFTEEN_MIN,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKey,
  skip: (req) => req.method === "OPTIONS",
  handler: createHandler("SMS sending limit exceeded. Please try again later.")
});

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  // Time windows
  WINDOWS,

  // Global limiters
  globalLimiter,

  // Authentication limiters
  authLimiter,
  otpLimiter,

  // Sensitive operation limiters
  passwordResetLimiter,
  emailVerificationLimiter,
  accountCreationLimiter,

  // Upload limiters
  fileUploadLimiter,
  bulkImportLimiter,

  // Data export limiters
  reportLimiter,
  dataExportLimiter,

  // API read limiters
  searchLimiter,

  // Admin limiters
  adminOperationLimiter,

  // Notification limiters
  emailLimiter,
  smsLimiter
};
