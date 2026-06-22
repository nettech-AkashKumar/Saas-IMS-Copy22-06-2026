/**
 * LRU Cache Implementation
 * Least Recently Used cache with TTL support
 * Used for caching frequently accessed data
 */

class LRUCache {
  /**
   * Initialize LRU Cache
   * @param {Number} maxSize - Maximum number of entries
   * @param {Number} ttl - Time to live in milliseconds (0 = no expiry)
   */
  constructor(maxSize = 100, ttl = 0) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Get value from cache
   * @param {String} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.cache.get(key);

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Mark as recently used by moving to end
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {String} key - Cache key
   * @param {*} value - Value to cache
   * @param {Number} customTtl - Optional custom TTL for this entry
   */
  set(key, value, customTtl = null) {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    const ttl = customTtl !== null ? customTtl : this.ttl;
    const entry = {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
      createdAt: Date.now()
    };

    this.cache.set(key, entry);

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Check if key exists and is not expired
   * @param {String} key - Cache key
   * @returns {Boolean}
   */
  has(key) {
    if (!this.cache.has(key)) return false;

    const entry = this.cache.get(key);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key
   * @param {String} key - Cache key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {Number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      total,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
}

/**
 * Global cache instances for different domains
 */
const caches = {
  product: new LRUCache(500, 5 * 60 * 1000),        // 5 min
  user: new LRUCache(200, 10 * 60 * 1000),          // 10 min
  role: new LRUCache(50, 15 * 60 * 1000),           // 15 min
  tenant: new LRUCache(100, 20 * 60 * 1000),        // 20 min
  settings: new LRUCache(50, 30 * 60 * 1000),       // 30 min
  invoice: new LRUCache(300, 3 * 60 * 1000),        // 3 min (frequently changes)
  generic: new LRUCache(1000, 60 * 60 * 1000)       // 1 hour (generic cache)
};

/**
 * Middleware to cache GET requests
 * @param {String} cacheType - Type of cache to use
 * @param {Number} ttl - Optional custom TTL
 */
const cacheMiddleware = (cacheType = 'generic', ttl = null) => {
  const cache = caches[cacheType] || caches.generic;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.user?._id || 'anon'}:${req.originalUrl}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(cacheKey, data, ttl);
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Invalidate cache for a pattern or key
 * @param {String} pattern - Key pattern or exact key
 * @param {String} cacheType - Type of cache
 */
const invalidateCache = (pattern, cacheType = 'generic') => {
  const cache = caches[cacheType] || caches.generic;

  if (cacheType === 'all') {
    Object.values(caches).forEach(c => c.clear());
  } else {
    // For now, clear specific cache type
    // In production, implement pattern matching
    cache.clear();
  }
};

module.exports = {
  LRUCache,
  caches,
  cacheMiddleware,
  invalidateCache,
  getCacheStats: () => {
    const stats = {};
    Object.entries(caches).forEach(([name, cache]) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }
};
