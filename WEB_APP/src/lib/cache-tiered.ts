/**
 * 两层缓存系统
 * L1: 内存缓存（快速，短TTL）
 * L2: Redis缓存（持久，长TTL）
 * 
 * 优势：
 * - 内存缓存提供超快速度
 * - Redis缓存提供跨实例共享
 * - 最大化性能和命中率
 */

import { serverCache } from './cache';
import { redisCache, RedisConfig } from './cache-redis';
import { CacheTTL } from './cache';

/**
 * 两层缓存获取
 * @param key 缓存键
 * @param fetchFn 数据获取函数
 * @param options 缓存选项
 */
export async function tieredCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    l1Ttl?: number; // L1缓存时间（默认1分钟）
    l2Ttl?: number; // L2缓存时间（默认5分钟）
  }
): Promise<T> {
  const l1Ttl = options?.l1Ttl || CacheTTL.SHORT;
  const l2Ttl = options?.l2Ttl || CacheTTL.MEDIUM;

  // L1: 检查内存缓存
  const l1Cached = serverCache.get<T>(key);
  if (l1Cached !== null) {
    console.log(`⚡ L1缓存命中: ${key}`);
    return l1Cached;
  }

  // L2: 检查Redis缓存（如果已配置）
  if (RedisConfig.isConfigured()) {
    try {
      const l2Cached = await redisCache.get<T>(key);
      if (l2Cached !== null) {
        console.log(`🚀 L2缓存命中: ${key}`);
        // 回填L1缓存
        serverCache.set(key, l2Cached, l1Ttl);
        return l2Cached;
      }
    } catch (error) {
      console.error(`⚠️ Redis访问失败，降级到直接查询: ${key}`, error);
    }
  }

  // 缓存未命中，执行查询
  console.log(`💾 缓存未命中，查询数据源: ${key}`);
  const data = await fetchFn();

  // 写入L1缓存
  serverCache.set(key, data, l1Ttl);

  // 写入L2缓存（如果已配置）
  if (RedisConfig.isConfigured()) {
    try {
      await redisCache.set(key, data, l2Ttl);
    } catch (error) {
      console.error(`⚠️ Redis写入失败: ${key}`, error);
    }
  }

  return data;
}

/**
 * 失效两层缓存
 */
export async function invalidateTieredCache(key: string): Promise<void> {
  // 失效L1
  serverCache.delete(key);

  // 失效L2
  if (RedisConfig.isConfigured()) {
    try {
      await redisCache.delete(key);
    } catch (error) {
      console.error(`⚠️ Redis删除失败: ${key}`, error);
    }
  }
}

/**
 * 批量失效缓存（通过前缀）
 */
export async function invalidateTieredCacheByPrefix(prefix: string): Promise<void> {
  // 失效L1
  serverCache.invalidateByPrefix(prefix);

  // 失效L2
  if (RedisConfig.isConfigured()) {
    try {
      await redisCache.deleteByPattern(prefix);
    } catch (error) {
      console.error(`⚠️ Redis批量删除失败: ${prefix}`, error);
    }
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllTieredCache(): Promise<void> {
  // 清空L1
  serverCache.clear();

  // 清空L2
  if (RedisConfig.isConfigured()) {
    try {
      await redisCache.clear();
    } catch (error) {
      console.error('⚠️ Redis清空失败', error);
    }
  }
}

/**
 * 🚀 写入两层缓存
 * 
 * 用于数据写入后立即更新缓存，避免首次访问的查询延迟
 * 
 * @param key 缓存键
 * @param value 要缓存的数据
 * @param options 缓存选项
 * 
 * 示例用法：
 * ```typescript
 * // 创建新学生后立即设置缓存
 * const newStudent = await collections.students.add(data);
 * await setTieredCache(
 *   `student:${newStudent.id}`,
 *   { id: newStudent.id, ...data },
 *   CACHE_STRATEGY.profiles
 * );
 * ```
 */
export async function setTieredCache<T>(
  key: string,
  value: T,
  options?: {
    l1Ttl?: number; // L1缓存时间（秒）
    l2Ttl?: number; // L2缓存时间（秒）
  }
): Promise<void> {
  const l1Ttl = options?.l1Ttl || CacheTTL.SHORT;
  const l2Ttl = options?.l2Ttl || CacheTTL.MEDIUM;

  // 写入L1缓存
  serverCache.set(key, value, l1Ttl);
  console.log(`✅ L1缓存已设置: ${key} (TTL: ${l1Ttl}s)`);

  // 写入L2缓存（如果已配置）
  if (RedisConfig.isConfigured()) {
    try {
      await redisCache.set(key, value, l2Ttl);
      console.log(`✅ L2缓存已设置: ${key} (TTL: ${l2Ttl}s)`);
    } catch (error) {
      console.error(`⚠️ Redis写入失败: ${key}`, error);
    }
  }
}

/**
 * 获取缓存统计
 */
export async function getTieredCacheStats() {
  const l1Stats = serverCache.getStats();

  return {
    l1: {
      name: 'Memory Cache',
      size: l1Stats.size,
      keys: l1Stats.keys,
      status: 'active',
    },
    l2: {
      name: 'Redis (Vercel KV)',
      configured: RedisConfig.isConfigured(),
      status: RedisConfig.isConfigured() ? 'active' : 'disabled',
    },
  };
}

