# Security Features Quick Reference for Developers

## 🚀 Quick Start Examples

### 1. Logging
```javascript
const { logger } = require("../utils/logger");

// Basic logging
logger.info('Operation successful', { operationId: '123' });
logger.error('Database error', { error: err.message });
logger.security('Suspicious activity', { userId: '456', ip: '192.168.1.1' });
```

### 2. Caching GET Responses
```javascript
const { cacheMiddleware } = require("../utils/cache");

// Cache for 5 minutes
router.get('/users/:id', cacheMiddleware('user', 5*60*1000), userController.getById);

// Cache with default TTL
router.get('/roles', cacheMiddleware('role'), roleController.getAll);
```

### 3. Caching Manual Operations
```javascript
const { caches, invalidateCache } = require("../utils/cache");

// In your controller
const user = await User.findById(id);
caches.user.set(`user:${id}`, user);

// Later, when updating
await User.updateOne({ _id: id }, updateData);
invalidateCache(null, 'user'); // Clear all user cache
```

### 4. Tenant Authorization
```javascript
const { tenantUserAuthorization, verifyTenantOwnership } = require("../middleware/security/tenantAuthorization");

// Protect entire route
router.get('/:id', tenantUserAuthorization, controller.getById);

// Verify before update
router.put('/:id', 
  tenantUserAuthorization, 
  verifyTenantOwnership('tenantId'), 
  controller.update
);
```

### 5. Rate Limiting
```javascript
const { passwordResetLimiter, fileUploadLimiter } = require("../middleware/SaaS/rateLimiterConfig");

// Single limiter
router.post('/reset-password', passwordResetLimiter, controller.reset);

// Multiple limiters
router.post('/import-data', accountCreationLimiter, fileUploadLimiter, controller.import);

// Apply to entire route group
app.use('/api/exports', dataExportLimiter, exportRoutes);
```

### 6. Using Tenant Context
```javascript
// After tenantUserAuthorization middleware
const { tenantId, userId, userRole } = req.tenantContext;

// Query tenant-scoped data
const data = await Model.find({ tenantId });
```

---

## ⚡ Common Patterns

### Pattern 1: Protected Route with Caching
```javascript
const { cacheMiddleware } = require("../utils/cache");
const { tenantUserAuthorization } = require("../middleware/security/tenantAuthorization");
const { logger } = require("../utils/logger");

router.get('/:id',
  tenantUserAuthorization,
  cacheMiddleware('product'),
  async (req, res) => {
    try {
      const { tenantId } = req.tenantContext;
      const product = await Product.findOne({ _id: req.params.id, tenantId });
      logger.info('Product retrieved', { productId: req.params.id });
      res.json(product);
    } catch (error) {
      logger.error('Product fetch error', { error: error.message });
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  }
);
```

### Pattern 2: Rate-Limited Sensitive Operation
```javascript
const { emailLimiter } = require("../middleware/SaaS/rateLimiterConfig");
const { logger } = require("../utils/logger");

router.post('/send-email',
  emailLimiter,
  tenantUserAuthorization,
  async (req, res) => {
    try {
      // Send email
      logger.info('Email sent', { recipient: req.body.email });
      res.json({ success: true });
    } catch (error) {
      logger.error('Email sending failed', { error: error.message });
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
);
```

### Pattern 3: Cache Invalidation on Update
```javascript
const { invalidateCache } = require("../utils/cache");
const { logger } = require("../utils/logger");

router.put('/:id', tenantUserAuthorization, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body);
    
    // Invalidate cache
    invalidateCache(null, 'product');
    
    logger.info('Product updated', { productId: req.params.id });
    res.json(updated);
  } catch (error) {
    logger.error('Product update failed', { error: error.message });
    res.status(500).json({ error: 'Update failed' });
  }
});
```

### Pattern 4: Search with Rate Limiting and Caching
```javascript
const { searchLimiter } = require("../middleware/SaaS/rateLimiterConfig");
const { cacheMiddleware } = require("../utils/cache");

router.get('/search',
  searchLimiter,
  cacheMiddleware('product', 2*60*1000),  // 2 min cache
  async (req, res) => {
    // Search implementation
  }
);
```

---

## 📊 Cache Strategy Recommendations

### High-Frequency Reads (Cache Aggressively)
```javascript
// Product catalog, user profiles, role permissions
cacheMiddleware('product', 10*60*1000)  // 10 min
cacheMiddleware('user', 15*60*1000)     // 15 min
cacheMiddleware('role', 20*60*1000)     // 20 min
```

### Frequently Updated Data (Cache Minimally)
```javascript
// Invoices, orders, stock levels
cacheMiddleware('invoice', 1*60*1000)   // 1 min
cacheMiddleware('generic', 2*60*1000)   // 2 min
```

### Write Operations (Always Invalidate)
```javascript
await Model.updateOne({ _id: id }, data);
invalidateCache(null, 'generic');  // or specific cache type
```

---

## 🔒 Security Best Practices

### DO ✅
- ✅ Log security-relevant events: `logger.security()`
- ✅ Validate tenant ownership before operations
- ✅ Use `cacheMiddleware` for GET endpoints
- ✅ Apply rate limiters to sensitive endpoints
- ✅ Cache frequently accessed read-heavy queries
- ✅ Invalidate cache after write operations
- ✅ Use environment variables for configuration

### DON'T ❌
- ❌ Log sensitive data (passwords, tokens)
- ❌ Skip tenant authorization checks
- ❌ Cache user-specific sensitive data
- ❌ Hardcode rate limit thresholds
- ❌ Skip input validation on create/update
- ❌ Trust Host header without validation
- ❌ Cache authentication-dependent data globally

---

## 📈 Performance Impact

### Expected Improvements
- GET requests: 40-60% faster with caching
- Reduced database queries: 30-50% reduction
- Improved scalability: Handle 2-3x more concurrent users
- Reduced CPU usage: 20-30% reduction with caching

### Monitoring
```javascript
const { getCacheStats } = require("../utils/cache");

// Add to admin dashboard
app.get('/admin/cache-stats', (req, res) => {
  res.json(getCacheStats());
});
```

---

## 🆘 Troubleshooting

### Issue: Rate limit always triggers
**Solution**: Check `TRUST_PROXY=1` in .env for correct IP detection

### Issue: Cache not improving performance
**Solution**: Verify cacheMiddleware is placed BEFORE controller, check cache hit rate in stats

### Issue: Host validation blocking valid requests
**Solution**: Add domain to `ALLOWED_HOSTS` environment variable

### Issue: Tenant authorization errors
**Solution**: Ensure `req.user.tenant` is set by auth middleware, check tenantId is included in requests

---

## 📝 Logging Levels

| Level | When to Use | Example |
|-------|------------|---------|
| ERROR | Serious issues | Database connection failed |
| WARN | Potential problems | High memory usage |
| INFO | Important events | User logged in, Data exported |
| DEBUG | Development info | Cache hit, Query execution |
| TRACE | Detailed debugging | Function entry/exit |

---

## 🧪 Testing Your Implementation

```javascript
// Test rate limiting
for (let i = 0; i < 10; i++) {
  await fetch('/api/auth/login', { method: 'POST' });
}
// Expect 429 status after limit exceeded

// Test caching
const res1 = await fetch('/api/products/1');
const res2 = await fetch('/api/products/1');
// res2 should have X-Cache: HIT header

// Test logging
logger.info('Test event', { data: 'value' });
// Check logs/combined.log for entry
```

---

**Version**: 1.0  
**Last Updated**: 2026-05-05
