# Security & Performance Implementation Guide

## 📋 Overview
This document provides implementation details and usage instructions for all security and performance features added to the IMS SaaS application.

---

## 🔐 1. Host Validation

### Location
`server/middleware/security/hostValidation.js`

### Purpose
Prevents Host Header Injection attacks by validating the Host header against a whitelist.

### Allowed Hosts
- `localhost:*`
- `127.0.0.1:*`
- `192.168.x.x:*` (private networks)
- `10.x.x.x:*` (private networks)
- `imsmymunc.com`
- `*.imsmymunc.com` (all subdomains)
- Custom hosts via `ALLOWED_HOSTS` env variable

### Usage
```javascript
// Already applied globally in index.js
app.use(hostValidation);
```

### Configuration
Add to `.env`:
```
ALLOWED_HOSTS=custom.domain.com,another.domain.com
```

---

## 👥 2. Tenant-User Authorization

### Location
`server/middleware/security/tenantAuthorization.js`

### Purpose
Enforces tenant-scoped data access. Ensures users can only access their own tenant's data.

### Features
- ✅ Validates user belongs to requested tenant
- ✅ Super admin bypass for all tenants
- ✅ Multiple tenant source support (params, body, headers)
- ✅ Security logging of violations

### Usage in Routes
```javascript
const { tenantUserAuthorization, verifyTenantOwnership } = require("../middleware/security/tenantAuthorization");

// Apply to tenant-scoped routes
router.get('/:id', tenantUserAuthorization, controller.getById);

// Verify resource ownership before operations
router.put('/:id', tenantUserAuthorization, verifyTenantOwnership('tenantId'), controller.update);
```

### Tenant Context Access
After authorization, access tenant info via:
```javascript
const { tenantId, userId, userRole } = req.tenantContext;
```

### Supported Tenant Sources
1. **URL Parameter**: `GET /api/resource?tenantId=xxx`
2. **Request Body**: `POST /api/resource { tenantId: 'xxx' }`
3. **Header**: `X-Tenant-Id: xxx`
4. **From User**: `req.user.tenant`

---

## 💾 3. LRU Cache System

### Location
`server/utils/cache.js`

### Purpose
Improves performance by caching frequently accessed data with automatic TTL-based expiration.

### Pre-configured Cache Types
| Cache Type | Size | TTL | Use Case |
|-----------|------|-----|----------|
| product | 500 | 5 min | Product lookups |
| user | 200 | 10 min | User profile data |
| role | 50 | 15 min | Role permissions |
| tenant | 100 | 20 min | Tenant settings |
| settings | 50 | 30 min | System settings |
| invoice | 300 | 3 min | Frequently changing invoices |
| generic | 1000 | 1 hour | General purpose |

### Usage Examples

#### Basic Cache Operations
```javascript
const { caches } = require("../utils/cache");

// Get from cache
const user = caches.user.get('user:123');

// Set in cache
caches.user.set('user:123', userData);

// Set with custom TTL (5 minutes)
caches.product.set('product:456', productData, 5 * 60 * 1000);

// Check existence
if (caches.user.has('user:123')) {
  // Use cached data
}

// Delete specific key
caches.user.delete('user:123');

// Clear entire cache
caches.user.clear();
```

#### Middleware Usage (GET Request Caching)
```javascript
const { cacheMiddleware } = require("../utils/cache");

// Cache GET responses for 5 minutes
router.get('/products', cacheMiddleware('product', 5 * 60 * 1000), productController.getAll);

// Cache with default TTL
router.get('/users/:id', cacheMiddleware('user'), userController.getById);
```

#### Cache Statistics
```javascript
const { getCacheStats } = require("../utils/cache");

const stats = getCacheStats();
console.log(stats);
// Output:
// {
//   product: { hits: 150, misses: 45, evictions: 10, hitRate: '77%', size: 450, maxSize: 500 },
//   user: { hits: 200, misses: 50, evictions: 5, hitRate: '80%', size: 195, maxSize: 200 },
//   ...
// }
```

#### Invalidating Cache
```javascript
const { invalidateCache } = require("../utils/cache");

// Clear specific cache type
invalidateCache(null, 'product');

// Clear all caches
invalidateCache(null, 'all');
```

### Cache Strategy Recommendations
```javascript
// After creating/updating a resource
router.post('/products', async (req, res, next) => {
  // ... create product
  invalidateCache(null, 'product'); // Invalidate product cache
  res.json(product);
});

// For read-heavy endpoints
router.get('/products', cacheMiddleware('product'), getAllProducts);
```

---

## ⏱️ 4. Rate Limiting

### Enhanced Configuration
Location: `server/middleware/SaaS/rateLimiterConfig.js`

### Rate Limiter Types

#### Global Limiter
```javascript
- Limit: 3000 requests/15 minutes
- Applied: Globally to all endpoints
- Override: RATE_LIMIT_GLOBAL_MAX env
```

#### Authentication Limiters
```javascript
authLimiter
- Limit: 120 attempts/15 minutes
- Applied: POST /api/auth/login
- Prevents: Brute force login attacks

otpLimiter (built-in)
- Limit: 8 requests/1 minute
- Applied: OTP generation endpoints
```

#### Sensitive Operation Limiters
```javascript
passwordResetLimiter
- Limit: 5 attempts/hour
- Applied: POST /api/forgot/reset

emailVerificationLimiter
- Limit: 10 attempts/hour
- Applied: Email verification endpoints

accountCreationLimiter
- Limit: 5 attempts/hour
- Applied: Company registration
```

#### Data Operation Limiters
```javascript
fileUploadLimiter
- Limit: 100 uploads/hour

bulkImportLimiter
- Limit: 10 imports/day

dataExportLimiter
- Limit: 10 exports/hour
```

### Applying Rate Limiters to Routes
```javascript
const { 
  passwordResetLimiter, 
  fileUploadLimiter,
  searchLimiter 
} = require("../middleware/SaaS/rateLimiterConfig");

// Single limiter
router.post('/password-reset', passwordResetLimiter, controller.resetPassword);

// Multiple limiters
router.post('/import', accountCreationLimiter, fileUploadLimiter, controller.import);

// Limiter on route group
app.use('/api/products', searchLimiter, productRoutes);
```

### Environment Configuration
```env
# .env
RATE_LIMIT_GLOBAL_MAX=3000
RATE_LIMIT_AUTH_MAX=120
RATE_LIMIT_OTP_MAX=8
TRUST_PROXY=1  # Important for accurate IP detection behind proxy
```

### Rate Limit Response
```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMITED",
  "retryAfterSeconds": 60
}
```

---

## 📝 5. Logging System

### Location
`server/utils/logger.js`

### Features
- ✅ Multiple log levels (ERROR, WARN, INFO, DEBUG, TRACE)
- ✅ File-based logging with automatic rotation
- ✅ Separate security event log
- ✅ Color-coded console output
- ✅ Request/response tracking
- ✅ Performance monitoring

### Log Files
- `logs/error.log` - Error-level events only
- `logs/combined.log` - All events
- `logs/security.log` - Security events

### Usage Examples

#### Basic Logging
```javascript
const { logger } = require("../utils/logger");

logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.warn('High memory usage', { usage: '85%' });
logger.error('Database connection failed', { error: err.message });
logger.debug('Cache hit', { key: 'user:123' });
logger.trace('Function execution', { duration: '150ms' });
```

#### Security Logging
```javascript
logger.security('Unauthorized access attempt', {
  userId: '456',
  resource: '/api/admin',
  ip: '192.168.1.100'
});
```

#### Request Logging Middleware
```javascript
// Already applied globally in index.js
const { requestLogger } = require("../utils/logger");
app.use(requestLogger);

// Logs: method, path, status, duration, IP, user
```

#### Error Logging Middleware
```javascript
// Apply at end of middleware stack
const { errorLogger } = require("../utils/logger");
app.use(errorLogger);
```

### Configuration

#### Log Level
```env
# .env
LOG_LEVEL=INFO  # ERROR, WARN, INFO, DEBUG, TRACE
```

#### Custom Logger Instance
```javascript
const { Logger } = require("../utils/logger");

const customLogger = new Logger({
  level: 'DEBUG',
  logDir: '/var/log/ims',
  maxFileSize: 50 * 1024 * 1024,  // 50MB
  maxFiles: 20,
  context: 'CUSTOM_MODULE'
});

customLogger.info('Custom message');
```

### Log Format
```json
{
  "timestamp": "2026-05-05T10:30:45.123Z",
  "level": "INFO",
  "context": "IMS-SaaS",
  "message": "User logged in",
  "data": {
    "userId": "123",
    "ip": "192.168.1.1"
  },
  "pid": 12345
}
```

---

## 🛡️ 6. Security Headers & Protections

### Location
`server/middleware/security/securityHeaders.js`

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Enable XSS protection |
| Content-Security-Policy | [restrictive] | Prevent XSS/injection |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Permissions-Policy | [disabled] | Disable unused APIs |
| Strict-Transport-Security | [max-age=1yr] | Force HTTPS (prod only) |

### Protection Mechanisms

#### 1. XSS Protection
```javascript
// Detects and logs XSS patterns
const patterns = /<script|javascript:|onerror|onload|<iframe|<object/i;
```

#### 2. SQL Injection Detection
```javascript
// Detects suspicious SQL patterns
const sqlPattern = /^(\w+\s*(=|LIKE|IN|WHERE|OR|AND|SELECT))/i;
```

#### 3. Parameter Pollution Check
```javascript
// Detects HTTP parameter pollution attempts
const duplicates = queryKeys.length !== new Set(queryKeys).size;
```

#### 4. CORS Security Checks
```javascript
// Logs suspicious cross-origin requests
if (origin && referrer && !referrer.includes(origin)) {
  // Log as suspicious
}
```

### Security Headers Response Example
```
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), ...
```

---

## 🔍 7. Security Audit

### Location
`server/config/SECURITY_AUDIT.js`

### View Audit Status
```javascript
const SECURITY_AUDIT = require("../config/SECURITY_AUDIT");
console.log(SECURITY_AUDIT.categories);
console.log(SECURITY_AUDIT.recommendations);
```

### Key Recommendations
- ✅ **Implemented**: Token verification, password hashing, rate limiting, security headers
- ⏳ **Short-term**: Token expiration, refresh tokens, schema validation
- ⏳ **Medium-term**: Sensitive data masking, GDPR features, WAF
- ⏳ **Long-term**: Penetration testing, 2FA support

---

## 📊 8. Integration Summary

### Files Added
```
server/
├── middleware/
│   ├── security/
│   │   ├── hostValidation.js
│   │   ├── tenantAuthorization.js
│   │   └── securityHeaders.js
│   └── SaaS/
│       └── rateLimiterConfig.js
├── utils/
│   ├── cache.js
│   └── logger.js
└── config/
    └── SECURITY_AUDIT.js
```

### Middleware Application Order
```javascript
1. hostValidation          // Prevent host injection
2. requestLogger           // Log all requests
3. securityHeaders         // Apply security headers
4. inputValidation         // Detect injections
5. parameterPollutionCheck // Detect parameter pollution
6. corsSecurityCheck       // Check cross-origin
7. globalLimiter           // Rate limit all requests
8. Express.json()          // Parse JSON
9. globalTenantMiddleware  // Tenant resolution
```

---

## 🚀 9. Best Practices

### For Developers
1. ✅ Always use `getAutoModels(req)` for tenant-scoped data
2. ✅ Log security-relevant events using `logger.security()`
3. ✅ Cache frequently accessed, slow-to-fetch data
4. ✅ Apply appropriate rate limiters to sensitive endpoints
5. ✅ Validate input on both client and server

### For Operations
1. ✅ Monitor `logs/security.log` for attacks
2. ✅ Regularly review `logs/error.log` for issues
3. ✅ Keep dependencies updated: `npm audit fix`
4. ✅ Set appropriate `LOG_LEVEL` based on environment
5. ✅ Configure `ALLOWED_HOSTS` for your domain

### For DevOps
1. ✅ Use environment variables for secrets (never hardcode)
2. ✅ Enable HTTPS/SSL certificates in production
3. ✅ Set `NODE_ENV=production` in production
4. ✅ Configure log rotation externally for large deployments
5. ✅ Monitor rate limit hit rates from logs

---

## 📋 Environment Variables Reference

```env
# Logging
LOG_LEVEL=INFO

# Security
ALLOWED_HOSTS=custom.domain.com

# Rate Limiting
RATE_LIMIT_GLOBAL_MAX=3000
RATE_LIMIT_AUTH_MAX=120
RATE_LIMIT_OTP_MAX=8
TRUST_PROXY=1

# Application
NODE_ENV=development
JWT_SECRET=your-secret-key-here
PORT=5000
```

---

## ✅ Testing Checklist

- [ ] Host validation blocks invalid hosts
- [ ] Rate limiters return 429 when exceeded
- [ ] Security headers present in responses
- [ ] Tenant authorization prevents cross-tenant access
- [ ] Caching improves response times for GET requests
- [ ] Logging captures all events correctly
- [ ] XSS/SQL injection attempts are logged
- [ ] Password reset limited to 5/hour
- [ ] OTP limited to 8/minute
- [ ] Error logs contain stack traces

---

## 🆘 Troubleshooting

### Rate Limit Not Working
```
Solution: Check TRUST_PROXY=1 is set for correct IP detection behind proxy
```

### Host Validation Blocking Valid Requests
```
Solution: Add domain to ALLOWED_HOSTS env variable
```

### Cache Not Improving Performance
```
Solution: Verify cacheMiddleware is applied before controller
```

### Missing Security Headers
```
Solution: Ensure securityHeaders middleware is applied early in middleware stack
```

---

**Last Updated**: 2026-05-05  
**Version**: 2.0  
**Maintained By**: IMS Development Team
