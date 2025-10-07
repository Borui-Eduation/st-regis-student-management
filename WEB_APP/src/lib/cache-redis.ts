/**
 * Redis缓存实现（Vercel KV）
 * 提供持久化、多实例共享的缓存
 */

import { kv } from '@vercel/kv';

/**
 * Redis缓存类
 */
export class RedisCache {
  /**
   * 将键索引到可按前缀失效的集合中
   * 例如 key = "students:1:20:query" 将被索引到：
   *   _keys:students:
   *   _keys:students:1:
   *   _keys:students:1:20:
   *   _keys:students:1:20:query
   */
  private async indexKey(key: string): Promise<void> {
    const prefixes = this.computePrefixes(key);
    await Promise.all(prefixes.map(prefix => kv.sadd(`_keys:${prefix}`, key)));
  }

  /**
   * 从前缀集合中移除某个键
   */
  private async deindexKey(key: string): Promise<void> {
    const prefixes = this.computePrefixes(key);
    await Promise.all(prefixes.map(prefix => kv.srem(`_keys:${prefix}`, key)));
  }

  /**
   * 计算所有层级前缀（包含完整键作为最后一个前缀）
   */
  private computePrefixes(key: string): string[] {
    const parts = key.split(':');
    if (parts.length === 1) {
      return [`${key}`];
    }
    const prefixes: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const slice = parts.slice(0, i + 1).join(':');
      const ensureColon = i < parts.length - 1 ? ':' : '';
      prefixes.push(`${slice}${ensureColon}`);
    }
    return prefixes;
  }
  /**
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await kv.get<unknown>(key);
      if (raw !== null) {
        console.log(`✅ Redis缓存命中: ${key}`);
      }
      // 兼容两种存储形态：
      // 1) 直接对象（kv.set存储JSON）
      // 2) 字符串（历史版本使用JSON.stringify + setex）
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch {
          // 不是JSON字符串，则按字符串返回
          return raw as unknown as T;
        }
      }
      return raw as T | null;
    } catch (error) {
      console.error(`❌ Redis获取失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间（毫秒）
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl && ttl > 0) {
        // 使用 kv.set 并设置过期时间（单位：秒）
        const ttlInSeconds = Math.max(1, Math.floor(ttl / 1000));
        await kv.set(key, value as any, { ex: ttlInSeconds });
        console.log(`💾 Redis缓存已保存: ${key}, TTL: ${ttlInSeconds}秒 (${ttl}ms)`);
      } else {
        await kv.set(key, value as any);
        console.log(`💾 Redis缓存已保存: ${key} (永久)`);
      }
      // 维护前缀索引，便于按前缀失效
      await this.indexKey(key);
    } catch (error) {
      console.error(`❌ Redis保存失败: ${key}`, error);
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      await kv.del(key);
      console.log(`🗑️ Redis缓存已删除: ${key}`);
      // 从索引中移除
      await this.deindexKey(key);
    } catch (error) {
      console.error(`❌ Redis删除失败: ${key}`, error);
    }
  }

  /**
   * 批量删除（通过模式匹配）
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keysSetKey = `_keys:${pattern}`;
      let keys = await kv.smembers<string>(keysSetKey);
      // 如果索引还未建立，尝试通过 keys(prefix*) 回退删除
      if (!keys || keys.length === 0) {
        try {
          const prefix = pattern.endsWith('*') ? pattern : `${pattern}*`;
          // @ts-ignore - keys API 可用但类型定义可能缺失
          keys = (await (kv as any).keys(prefix)) as string[];
        } catch {
          keys = [];
        }
      }

      if (keys && keys.length > 0) {
        await Promise.all(keys.map(k => kv.del(k)));
        // 清理索引集合
        await kv.del(keysSetKey);
        console.log(`🗑️ Redis批量删除: ${pattern} (${keys.length}个键)`);
      }
    } catch (error) {
      console.error(`❌ Redis批量删除失败: ${pattern}`, error);
    }
  }

  /**
   * 清空所有缓存（仅用于开发/调试）
   */
  async clear(): Promise<void> {
    try {
      await kv.flushdb();
      console.log('🧹 Redis所有缓存已清空');
    } catch (error) {
      console.error('❌ Redis清空失败', error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await kv.exists(key);
      return value === 1;
    } catch (error) {
      console.error(`❌ Redis检查存在失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存剩余过期时间（秒）
   */
  async ttl(key: string): Promise<number> {
    try {
      const ttl = await kv.ttl(key);
      return ttl;
    } catch (error) {
      console.error(`❌ Redis获取TTL失败: ${key}`, error);
      return -1;
    }
  }
}

// 创建全局Redis缓存实例
export const redisCache = new RedisCache();

/**
 * Redis缓存配置
 */
export const RedisConfig = {
  enabled: process.env.KV_REST_API_URL !== undefined,
  
  // 检查是否配置了Vercel KV
  isConfigured(): boolean {
    return this.enabled && process.env.KV_REST_API_TOKEN !== undefined;
  },
};

