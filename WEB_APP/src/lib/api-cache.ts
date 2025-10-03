/**
 * API Response Cache Utility
 * Simple in-memory cache for API responses to improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 1000; // 1 minute default

  /**
   * Get cached data
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache data
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Delete cached data
   * @param key Cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }
}

// Create singleton instance
export const apiCache = new ApiCache();

// Auto-cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 30 * 1000,        // 30 seconds
  MEDIUM: 60 * 1000,       // 1 minute
  LONG: 5 * 60 * 1000,     // 5 minutes
  EXTRA_LONG: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

/**
 * Cached fetch wrapper
 * @param key Cache key
 * @param fetcher Function that fetches data
 * @param ttl Cache TTL in milliseconds
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  apiCache.set(key, data, ttl);
  
  return data;
}

/**
 * Invalidate cache by pattern
 * @param pattern RegExp or string pattern to match keys
 */
export function invalidateCache(pattern: string | RegExp): number {
  let count = 0;
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  for (const key of apiCache['cache'].keys()) {
    if (regex.test(key)) {
      apiCache.delete(key);
      count++;
    }
  }

  return count;
}


