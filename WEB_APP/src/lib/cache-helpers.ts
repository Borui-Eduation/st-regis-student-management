/**
 * 缓存辅助函数
 * 提供高级缓存操作和包装器
 */

import { serverCache, CacheKeys, CacheTTL } from './cache';

/**
 * 带缓存的数据获取函数
 * @param cacheKey 缓存键
 * @param fetchFn 获取数据的函数
 * @param ttl 缓存时间（毫秒）
 */
export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 尝试从缓存获取
  const cached = serverCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行查询
  console.log(`⚠️ 缓存未命中，查询Firestore: ${cacheKey}`);
  const data = await fetchFn();
  
  // 保存到缓存
  serverCache.set(cacheKey, data, ttl);
  
  return data;
}

/**
 * 批量获取并缓存
 */
export async function cachedBatchFetch<T>(
  items: Array<{ key: string; fetchFn: () => Promise<T>; ttl?: number }>
): Promise<T[]> {
  const results = await Promise.all(
    items.map(item => cachedFetch(item.key, item.fetchFn, item.ttl))
  );
  return results;
}

/**
 * 条件性缓存 - 只缓存符合条件的数据
 */
export async function conditionalCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  shouldCache: (data: T) => boolean,
  ttl?: number
): Promise<T> {
  const cached = serverCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  
  if (shouldCache(data)) {
    serverCache.set(cacheKey, data, ttl);
  }
  
  return data;
}

/**
 * 缓存穿透保护 - 防止空结果导致频繁查询
 */
const nullResultCache = new Map<string, number>();
const NULL_CACHE_TTL = 30 * 1000; // 30秒

export async function cachedFetchWithNullProtection<T>(
  cacheKey: string,
  fetchFn: () => Promise<T | null>,
  ttl?: number
): Promise<T | null> {
  // 检查是否在空结果缓存中
  const nullCacheTime = nullResultCache.get(cacheKey);
  if (nullCacheTime && Date.now() - nullCacheTime < NULL_CACHE_TTL) {
    console.log(`🛡️ 空结果缓存保护: ${cacheKey}`);
    return null;
  }

  // 正常缓存流程
  const cached = serverCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  
  if (data === null) {
    // 记录空结果
    nullResultCache.set(cacheKey, Date.now());
  } else {
    // 缓存有效数据
    serverCache.set(cacheKey, data, ttl);
    // 清除空结果缓存
    nullResultCache.delete(cacheKey);
  }
  
  return data;
}

/**
 * 预热缓存 - 提前加载常用数据
 */
export async function warmupCache() {
  console.log('🔥 开始预热缓存...');
  
  try {
    // 预热统计数据
    await cachedFetch(
      CacheKeys.stats(),
      async () => {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        return data.data;
      },
      CacheTTL.MEDIUM
    );

    // 预热第一页学生数据
    await cachedFetch(
      CacheKeys.students(1, 20),
      async () => {
        const response = await fetch('/api/admin/students?page=1&pageSize=20');
        const data = await response.json();
        return data.data;
      },
      CacheTTL.MEDIUM
    );

    // 预热待审批课程
    await cachedFetch(
      CacheKeys.pendingEnrollments(),
      async () => {
        const response = await fetch('/api/admin/enrollments?status=pending');
        const data = await response.json();
        return data.data;
      },
      CacheTTL.SHORT
    );

    console.log('✅ 缓存预热完成');
  } catch (error) {
    console.error('❌ 缓存预热失败:', error);
  }
}

/**
 * 定期清理过期缓存
 */
export function startCacheCleanup(intervalMs: number = 10 * 60 * 1000) {
  setInterval(() => {
    console.log('🧹 执行缓存清理...');
    const stats = serverCache.getStats();
    console.log(`当前缓存条目: ${stats.size}`);
    
    // 这里可以添加更多清理逻辑
  }, intervalMs);
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  const stats = serverCache.getStats();
  return {
    totalEntries: stats.size,
    keys: stats.keys,
    estimatedSavings: {
      reads: stats.size * 0.001, // 假设每次读取0.001美元
      message: `缓存已节省约 ${stats.size} 次Firestore读取`,
    },
  };
}

