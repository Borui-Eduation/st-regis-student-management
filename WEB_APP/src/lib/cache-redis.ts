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
   * 获取缓存数据
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await kv.get<T>(key);
      if (value !== null) {
        console.log(`✅ Redis缓存命中: ${key}`);
      }
      return value;
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
      if (ttl) {
        // 设置带过期时间的缓存
        await kv.setex(key, Math.floor(ttl / 1000), JSON.stringify(value));
        console.log(`💾 Redis缓存已保存: ${key}, TTL: ${ttl}ms`);
      } else {
        // 永久缓存
        await kv.set(key, JSON.stringify(value));
        console.log(`💾 Redis缓存已保存: ${key} (永久)`);
      }
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
    } catch (error) {
      console.error(`❌ Redis删除失败: ${key}`, error);
    }
  }

  /**
   * 批量删除（通过模式匹配）
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      // Vercel KV不支持SCAN，需要手动管理键列表
      // 使用特殊键存储所有相关键
      const keysSetKey = `_keys:${pattern}`;
      const keys = await kv.smembers<string>(keysSetKey);
      
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(k => kv.del(k)));
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

