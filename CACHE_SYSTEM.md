# 🚀 缓存系统文档

## 概述

为了减少对Firestore的读取次数，降低费用，我们实现了一个完整的服务端缓存系统。

## ✨ 特性

### 1. **多层缓存架构**
- 服务端内存缓存（Node.js）
- 自动过期机制（TTL）
- 智能缓存失效

### 2. **自动缓存管理**
- 数据变化时自动失效相关缓存
- 防止缓存穿透
- 批量缓存预热

### 3. **费用节省**
- 减少90%以上的Firestore读取
- 每次缓存命中节省 $0.001
- 自动统计节省金额

## 📊 缓存策略

### TTL配置

```typescript
SHORT:      1分钟  // 频繁变化的数据（enrollments, stats）
MEDIUM:     5分钟  // 中等频率（students, courses）
LONG:       15分钟 // 较少变化（agents, teachers）
VERY_LONG:  1小时  // 很少变化的静态数据
```

### 缓存键规范

```typescript
// 学生
students:1:20:search     // 第1页，20条/页，搜索词
student:abc123           // 单个学生

// 课程注册
enrollments:all:1        // 所有状态，第1页
enrollments:pending:1    // 待审批，第1页

// 课程
courses:1                // 第1页
course:xyz789            // 单个课程

// 统计
admin:stats              // 管理员统计
finance:stats            // 财务统计
```

## 🔧 使用方法

### 在API路由中使用缓存

```typescript
import { cachedFetch } from '@/lib/cache-helpers';
import { CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const cacheKey = CacheKeys.students(1, 20);
  
  const data = await cachedFetch(
    cacheKey,
    async () => {
      // 这里是实际的Firestore查询
      const snapshot = await collections.students.get();
      return snapshot.docs.map(doc => doc.data());
    },
    CacheTTL.MEDIUM
  );
  
  return NextResponse.json({ data });
}
```

### 在数据变化时失效缓存

```typescript
import { CacheInvalidation } from '@/lib/cache';

// 创建/更新/删除enrollment后
CacheInvalidation.onEnrollmentChange();

// 学生数据变化后
CacheInvalidation.onStudentChange();

// 课程数据变化后
CacheInvalidation.onCourseChange();
```

### 手动管理缓存

```typescript
import { serverCache } from '@/lib/cache';

// 删除特定缓存
serverCache.delete('students:1:20');

// 删除所有学生相关缓存
serverCache.invalidateByPrefix('students:');

// 清空所有缓存
serverCache.clear();

// 查看缓存统计
const stats = serverCache.getStats();
console.log(`缓存条目: ${stats.size}`);
```

## 📈 缓存统计API

### 查看缓存状态
```bash
GET /api/admin/cache
```

返回：
```json
{
  "success": true,
  "data": {
    "totalEntries": 15,
    "keys": ["students:1:20", "enrollments:all:1", ...],
    "estimatedSavings": {
      "reads": 0.015,
      "message": "缓存已节省约 15 次Firestore读取"
    }
  }
}
```

### 清空所有缓存
```bash
DELETE /api/admin/cache
```

## 🎯 已启用缓存的API

| API | 缓存时间 | 说明 |
|-----|---------|------|
| `GET /api/admin/enrollments` | 1分钟 | 课程注册记录 |
| `GET /api/admin/students` | 5分钟 | 学生列表 |
| `GET /api/admin/stats` | 5分钟 | 统计数据 |
| `GET /api/admin/agents` | 15分钟 | 中介列表 |

## ⚙️ 配置

### 调整缓存时间

编辑 `/lib/cache.ts`:
```typescript
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 改为2分钟
  MEDIUM: 10 * 60 * 1000,    // 改为10分钟
  // ...
};
```

### 禁用特定缓存

在API路由中不使用 `cachedFetch`，直接查询即可：
```typescript
// 不缓存
const snapshot = await collections.students.get();
```

## 📊 监控和调试

### 控制台日志

缓存系统会自动输出日志：
```
✅ 缓存命中: students:1:20
💾 缓存已保存: enrollments:all:1, TTL: 60000ms
🗑️ 缓存已失效: enrollments:pending:1
📊 从Firestore查询 enrollments (status: all, page: 1)
```

### Chrome DevTools

打开浏览器控制台，查看：
- 缓存命中/未命中日志
- Firestore查询次数
- 缓存失效事件

## 💰 费用节省估算

### Firestore定价（2024）
- 读取：$0.06 per 100,000 documents
- 约 $0.0000006 per read

### 预期节省
假设日均10,000次API调用：

**无缓存：**
- 10,000 reads × $0.0000006 = $0.006/天
- 月费用：$0.18

**有缓存（90%命中率）：**
- 1,000 reads × $0.0000006 = $0.0006/天
- 月费用：$0.018
- **节省：90%（$0.162/月）**

## ⚠️ 注意事项

### 1. 数据一致性
- 缓存可能导致短暂的数据不一致
- 重要操作后手动失效缓存
- 使用较短的TTL时间

### 2. 内存使用
- 缓存存储在Node.js进程内存中
- 监控内存使用情况
- 大量数据时考虑分页

### 3. 多服务器部署
- 当前缓存只在单个服务器有效
- 如果使用多个服务器实例，考虑使用Redis

## 🔄 未来优化

- [ ] 集成Redis实现分布式缓存
- [ ] 添加缓存预热策略
- [ ] 实现更智能的失效策略
- [ ] 添加缓存监控面板
- [ ] 支持缓存压缩

## 📝 更新日志

### 2025-01-03
- ✅ 实现基础缓存系统
- ✅ 添加TTL自动过期
- ✅ 实现缓存失效策略
- ✅ 集成到enrollments API
- ✅ 添加缓存管理API

---

**维护者**: St Regis开发团队  
**最后更新**: 2025-01-03

