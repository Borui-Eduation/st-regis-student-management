/**
 * 服务端缓存系统
 * 减少对Firestore的读取，节省费用
 * 
 * 缓存策略：
 * 1. 使用内存缓存存储常用数据
 * 2. 设置TTL（生存时间）自动过期
 * 3. 支持手动失效缓存
 * 4. 监听数据变化，自动更新缓存
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 毫秒
}

class ServerCache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 默认5分钟
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 获取缓存数据
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ 缓存命中: ${key}`);
    return entry.data as T;
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    
    this.cache.set(key, entry);
    console.log(`💾 缓存已保存: ${key}, TTL: ${entry.ttl}ms`);
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ 缓存已删除: ${key}`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 所有缓存已清空');
  }

  /**
   * 使指定前缀的所有缓存失效
   */
  invalidateByPrefix(prefix: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        console.log(`🗑️ 缓存已失效: ${key}`);
      }
    });
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 创建全局缓存实例
export const serverCache = new ServerCache();

/**
 * 缓存键生成器
 */
export const CacheKeys = {
  // 学生相关
  students: (page: number, pageSize: number, search: string = '') => 
    `students:${page}:${pageSize}:${search}`,
  studentsByStatus: (status: string) => 
    `students:status:${status}`,
  studentById: (id: string) => 
    `student:${id}`,
  
  // 课程注册相关
  enrollments: (status: string = 'all', page: number = 1) => 
    `enrollments:${status}:${page}`,
  enrollmentById: (id: string) => 
    `enrollment:${id}`,
  pendingEnrollments: () => 
    'enrollments:pending',
  
  // 课程相关
  courses: (page: number = 1) => 
    `courses:${page}`,
  courseById: (id: string) => 
    `course:${id}`,
  
  // 统计相关
  stats: () => 
    'admin:stats',
  financeStats: () => 
    'finance:stats',
  
  // 中介相关
  agents: (page: number = 1) => 
    `agents:${page}`,
  agentById: (id: string) => 
    `agent:${id}`,
};

/**
 * 缓存失效策略
 */
export const CacheInvalidation = {
  // 当学生数据变化时
  onStudentChange: () => {
    serverCache.invalidateByPrefix('students:');
    serverCache.invalidateByPrefix('student:');
    serverCache.delete(CacheKeys.stats());
  },
  
  // 当课程注册变化时
  onEnrollmentChange: () => {
    serverCache.invalidateByPrefix('enrollments:');
    serverCache.invalidateByPrefix('enrollment:');
    serverCache.delete(CacheKeys.stats());
    serverCache.delete(CacheKeys.financeStats());
  },
  
  // 当课程变化时
  onCourseChange: () => {
    serverCache.invalidateByPrefix('courses:');
    serverCache.invalidateByPrefix('course:');
  },
  
  // 当中介变化时
  onAgentChange: () => {
    serverCache.invalidateByPrefix('agents:');
    serverCache.invalidateByPrefix('agent:');
  },
  
  // 当财务数据变化时
  onFinanceChange: () => {
    serverCache.delete(CacheKeys.financeStats());
    serverCache.delete(CacheKeys.stats());
  },
};

/**
 * 缓存TTL配置（毫秒）
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,        // 1分钟 - 频繁变化的数据
  MEDIUM: 5 * 60 * 1000,       // 5分钟 - 中等频率变化
  LONG: 15 * 60 * 1000,        // 15分钟 - 较少变化
  VERY_LONG: 60 * 60 * 1000,   // 1小时 - 很少变化的数据
};

/**
 * Cache options interface
 */
export interface CacheOptions {
  l1Ttl: number;  // L1内存缓存TTL（毫秒）
  l2Ttl: number;  // L2 Redis缓存TTL（毫秒）
  description?: string;
}

/**
 * 🚀 缓存策略分类
 * 
 * 根据数据特性选择合适的缓存策略，最大化缓存效率
 * 基于用户建议优化的分类策略
 */
export const CACHE_STRATEGY: Record<string, CacheOptions> = {
  /**
   * 基础档案数据 - 很少变化
   * 适用于: students, agents, teachers, courses（单个记录）
   * 
   * 特点：
   * - 读取频率高
   * - 变化频率低
   * - 需要长期缓存
   * 
   * 示例：GET /api/students/:id, GET /api/courses/:id
   */
  profiles: {
    l1Ttl: 15 * 60 * 1000,     // 15分钟内存缓存（毫秒）
    l2Ttl: 60 * 60 * 1000,     // 1小时Redis缓存（毫秒）
    description: '基础档案：students, agents, teachers, courses（单个记录）',
  },

  /**
   * 查询列表数据 - 中等变化
   * 适用于: enrollments, payments（列表查询）
   * 
   * 特点：
   * - 读取频率高
   * - 变化频率中等
   * - 需要短期缓存
   * 
   * 示例：GET /api/admin/enrollments
   */
  lists: {
    l1Ttl: 60 * 1000,        // 1分钟内存缓存（毫秒）
    l2Ttl: 5 * 60 * 1000,    // 5分钟Redis缓存（毫秒）
    description: '查询列表：enrollments, payments（列表）',
  },

  /**
   * 统计数据 - 慢变化
   * 适用于: dashboard stats, finance stats
   * 
   * 特点：
   * - 读取频率高
   * - 变化频率慢
   * - 可以接受一定延迟
   * 
   * 示例：GET /api/admin/stats, GET /api/admin/finance/stats
   */
  stats: {
    l1Ttl: 5 * 60 * 1000,     // 5分钟内存缓存（毫秒）
    l2Ttl: 15 * 60 * 1000,    // 15分钟Redis缓存（毫秒）
    description: '统计数据：dashboard stats, finance stats',
  },

  /**
   * 配置数据 - 几乎不变
   * 适用于: status maps, constants, settings
   * 
   * 特点：
   * - 读取频率高
   * - 几乎不变化
   * - 可以长期缓存
   * 
   * 示例：GET /api/config/status-map
   */
  config: {
    l1Ttl: 60 * 60 * 1000,    // 1小时内存缓存（毫秒）
    l2Ttl: 60 * 60 * 1000,    // 1小时Redis缓存（毫秒）
    description: '配置数据：status maps, constants',
  },

  /**
   * 实时数据 - 不缓存
   * 适用于: 特定用户数据，低频访问数据
   * 
   * 特点：
   * - 必须实时
   * - 访问频率低
   * - 不需要缓存
   * 
   * 示例：GET /api/students/:id/enrollments（个人数据）
   */
  realtime: {
    l1Ttl: 0,        // 不缓存
    l2Ttl: 0,        // 不缓存
    description: '实时数据：不缓存',
  },
} as const;

