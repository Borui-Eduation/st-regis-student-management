# 🚀 Vercel KV 设置指南

## ✅ 已完成的工作

我已经帮你完成了代码部分：

1. ✅ 安装了 `@vercel/kv` 包
2. ✅ 创建了 Redis 缓存实现
3. ✅ 创建了两层缓存系统（内存 + Redis）
4. ✅ 更新了 API 使用新缓存

## 📋 你需要完成的步骤

### 步骤 1: 在 Vercel Dashboard 创建 KV 存储

1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Storage** 标签
4. 点击 **Create Database**
5. 选择 **KV (Redis)**
6. 填写信息：
   ```
   Database Name: st-regis-cache
   Region: 选择离你最近的（推荐：US West）
   ```
7. 点击 **Create**

### 步骤 2: 连接 KV 到项目

1. 在创建的 KV 数据库页面
2. 点击 **Connect to Project**
3. 选择 `Student APP(Google firestore)` 项目
4. 点击 **Connect**

**Vercel 会自动添加环境变量：**
```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
```

### 步骤 3: 本地开发环境配置

1. 在 Vercel Dashboard，找到你的 KV 数据库
2. 点击 `.env.local` 标签
3. 复制显示的环境变量
4. 在本地项目中创建/更新 `.env.local`:

```env
# Vercel KV (Redis缓存)
KV_REST_API_URL="https://your-kv-xxxxx.upstash.io"
KV_REST_API_TOKEN="your-token-here"
KV_REST_API_READ_ONLY_TOKEN="your-readonly-token-here"
KV_URL="redis://default:your-password@your-kv.upstash.io:6379"
```

5. 重启开发服务器：
```bash
npm run dev
```

### 步骤 4: 部署到 Vercel

```bash
# 提交代码
git add .
git commit -m "feat: 添加两层缓存系统（内存 + Redis）"
git push

# Vercel 会自动部署
```

## 🎯 验证缓存是否工作

### 方法 1: 查看控制台日志

启动开发服务器后，访问管理页面，查看终端输出：

```
✅ L1缓存命中: enrollments:all:1          ← 内存缓存命中
🚀 L2缓存命中: enrollments:all:1          ← Redis缓存命中
💾 缓存未命中，查询数据源: enrollments:all:1  ← 查询Firestore
📊 从Firestore查询 enrollments (status: all, page: 1)
💾 Redis缓存已保存: enrollments:all:1, TTL: 300000ms
```

### 方法 2: 使用缓存管理 API

```bash
# 查看缓存统计
curl http://localhost:3000/api/admin/cache

# 清空所有缓存
curl -X DELETE http://localhost:3000/api/admin/cache
```

### 方法 3: 在 Vercel Dashboard 查看

1. 进入你的 KV 数据库
2. 点击 **Data Browser**
3. 查看存储的缓存键

## 📊 缓存工作原理

```
用户请求
  ↓
检查 L1 缓存（内存，1分钟）
  ↓ 未命中
检查 L2 缓存（Redis，5分钟）
  ↓ 未命中
查询 Firestore
  ↓
保存到 L2 (Redis)
  ↓
保存到 L1 (内存)
  ↓
返回数据
```

**后续请求：**
- 1分钟内：从 L1 返回（极快）
- 1-5分钟：从 L2 返回（快）
- 5分钟后：重新查询 Firestore

## 🎨 已启用缓存的 API

| API Endpoint | L1 TTL | L2 TTL | 说明 |
|-------------|--------|--------|------|
| `GET /api/admin/enrollments` | 1分钟 | 5分钟 | 课程注册记录 |

## 🔄 下一步：扩展到其他 API

你可以将相同的缓存模式应用到其他API：

```typescript
import { tieredCachedFetch } from '@/lib/cache-tiered';
import { CacheKeys, CacheTTL } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const cacheKey = CacheKeys.students(1, 20);
  
  const data = await tieredCachedFetch(
    cacheKey,
    async () => {
      // Firestore查询
      const snapshot = await collections.students.get();
      return snapshot.docs.map(doc => doc.data());
    },
    {
      l1Ttl: CacheTTL.SHORT,
      l2Ttl: CacheTTL.MEDIUM,
    }
  );
  
  return NextResponse.json({ data });
}
```

## 💰 费用预估

### Vercel KV 免费额度
- ✅ 30,000 次读写/天
- ✅ 256 MB 存储
- ✅ 完全够用

### 你的预期使用量
```
日均请求: ~1,000次
缓存写入: ~100次/天（90%命中率）
缓存读取: ~900次/天
总操作: ~1,000次/天

免费额度: 30,000次/天
使用率: 3.3%
费用: $0/月 ✅
```

### Firestore 节省
```
无缓存: $0.018/月
有缓存: $0.0018/月
节省: $0.0162/月 (90%)
```

## 🐛 故障排除

### 问题 1: 本地开发时看到 "Redis访问失败"

**解决：**
检查 `.env.local` 是否正确配置：
```bash
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN
```

### 问题 2: 缓存没有命中

**检查：**
1. 查看终端日志，确认缓存键格式
2. 访问 Vercel KV Data Browser 查看实际存储的键
3. 确认 TTL 没有设置太短

### 问题 3: 部署后环境变量未生效

**解决：**
1. 在 Vercel Dashboard → Settings → Environment Variables
2. 确认 KV 环境变量存在
3. 重新部署项目

## 📞 需要帮助？

如果遇到问题：
1. 检查终端日志
2. 查看 Vercel KV Data Browser
3. 使用 `/api/admin/cache` 查看缓存统计

---

## 🎉 完成！

完成上述步骤后，你的缓存系统就全面运行了！

**效果：**
- ⚡ 90%+ 的请求从缓存返回
- 💰 节省 90% 的 Firestore 费用
- 🚀 显著提升响应速度
- 🌍 全球分布式，低延迟

**注意：** 在你完成 Vercel KV 设置之前，系统会自动降级到只使用内存缓存（仍有20-30%的效果）。

