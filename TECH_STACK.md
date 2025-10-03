# 🏗️ 技术栈总结

## 项目信息

**项目名称:** St Regis 学生管理系统  
**技术架构:** Serverless全栈应用  
**开发时间:** 2024-2025  
**状态:** 生产就绪 ✅

---

## 📚 完整技术栈

### 前端技术
```yaml
框架: Next.js 15.5.4 (App Router)
语言: TypeScript 5.x (严格模式)
UI框架: Tailwind CSS 3.x
组件库: shadcn/ui (Radix UI)
状态管理: React Hooks (useState, useEffect, useCallback)
表单: React Hook Form + Zod
图标: Lucide Icons
样式: CSS Modules + Tailwind

关键特性:
  • Server Components (RSC)
  • Client Components
  • Server Actions
  • Parallel Routes
  • Intercepting Routes
```

### 后端技术
```yaml
运行时: Node.js 20.x
框架: Next.js API Routes
认证: NextAuth.js v5 (Auth.js)
会话: JWT + Session
权限: 基于角色的访问控制 (RBAC)

API设计:
  • RESTful API
  • 标准化响应格式
  • 统一错误处理
  • 权限中间件
```

### 数据库和存储
```yaml
主数据库: Google Firestore
  类型: NoSQL文档数据库
  区域: us-central1
  数据库ID: studentapp
  
Collections (7个):
  • students      - 学生档案
  • agents        - 中介信息
  • teachers      - 教师档案
  • courses       - 课程目录
  • enrollments   - 核心关系（枢纽集合）
  • payments      - 支付记录
  • carts         - 购物车
  • emails        - 邮件日志
  
设计特点:
  • 反范式化（冗余字段）
  • ID字符串关联（非References）
  • 枢纽集合模式
  • 状态分离（课程状态 vs 支付状态）
```

### 缓存层
```yaml
L1缓存: 内存缓存 (Map)
  实现: 自定义ServerCache类
  作用域: 单个Lambda实例
  TTL: 1-5分钟
  命中率: ~30%

L2缓存: Vercel KV (Upstash Redis)
  提供商: Upstash
  协议: Redis REST API
  作用域: 全局共享
  TTL: 5-15分钟
  命中率: ~60%

总命中率: 90%+
节省成本: 99%+ Firestore读取
```

### 部署和基础设施
```yaml
平台: Vercel
架构: Serverless (AWS Lambda)
区域: US West (sfo1)
CDN: Vercel Edge Network (全球)
DNS: Vercel DNS

函数配置:
  • 最大执行时间: 10秒
  • 内存: 1024 MB
  • 并发: 100个函数 (Pro层)

自动化:
  • Git推送自动部署
  • 预览环境（PR）
  • 生产环境（main分支）
  • 环境变量管理
```

---

## 🔄 数据流架构

### 请求流程
```
用户请求
  ↓
Vercel Edge Network (CDN)
  ↓
Next.js API Route (Serverless Function)
  ↓
权限验证 (NextAuth + RBAC)
  ↓
L1缓存检查 (内存) → 命中 → 返回 (1ms)
  ↓ 未命中
L2缓存检查 (Redis) → 命中 → 返回 (3ms)
  ↓ 未命中
Firestore查询 → 返回 (50-200ms)
  ↓
更新L1和L2缓存
  ↓
返回响应给用户
```

### 数据写入流程
```
用户提交数据
  ↓
API权限验证
  ↓
Firestore写入
  ↓
缓存失效 (invalidateCache)
  ↓
返回成功响应
```

---

## 📊 性能指标

### 响应时间
```yaml
API响应时间:
  缓存命中: 10-50ms
  缓存未命中: 100-300ms
  平均: 50-150ms

页面加载:
  首屏: 800-1200ms
  交互时间 (TTI): 1.5-2s
  
优化措施:
  • 两层缓存
  • 代码分割
  • 图片优化
  • 预取关键数据
```

### 并发能力
```yaml
当前配置 (Vercel Pro):
  并发函数: 100个
  每秒请求: ~1000 QPS
  支持用户: 2000+ 并发

扩展能力:
  • 水平扩展（自动）
  • 全球CDN分发
  • 边缘缓存
```

### 成本效率
```yaml
月度运营成本 (~1000日活用户):
  
Firestore:
  读取: 51,000次/月
  费用: $0.03

Vercel Pro:
  基础费用: $20/月
  包含: 100并发 + 1TB带宽

Vercel KV Pro:
  基础费用: $10/月
  包含: 100K请求/天 + 1GB存储

总计: ~$30/月

成本效益:
  • 支持1000+日活用户
  • 每用户成本: $0.03/月
  • 99.9%可用性
```

---

## 🔐 安全架构

### 认证系统
```yaml
方案: NextAuth.js v5
提供商:
  • Google OAuth 2.0
  • Email/Password (可选)

会话管理:
  • JWT Token
  • HTTP-only Cookie
  • CSRF保护
  • 自动刷新

会话存储:
  • 客户端: JWT (加密)
  • 服务端: 无状态
```

### 权限系统
```yaml
角色层级:
  1. student      - 学生（查看自己）
  2. agent        - 中介（管理自己的学生）
  3. admin        - 管理员（全局管理）
  4. superadmin   - 超级管理员（所有权限）

权限粒度:
  • 资源级（students, courses, etc.）
  • 操作级（view, create, edit, delete）
  • 数据范围（self, assigned, all）

实现方式:
  • API中间件（requireRole）
  • 权限矩阵（permissions.ts）
  • 前端路由守卫
```

### 数据安全
```yaml
Firestore安全规则:
  • 基于认证的访问控制
  • 字段级权限
  • 数据验证规则

API安全:
  • 所有端点需要认证
  • 角色权限检查
  • 输入验证
  • SQL注入防护（NoSQL）
  • XSS防护

敏感数据:
  • 密码加密 (bcrypt)
  • Token加密 (JWT)
  • HTTPS传输
  • 环境变量保护
```

---

## 🎨 UI/UX技术

### 组件系统
```yaml
基础库: Radix UI
封装层: shadcn/ui
样式: Tailwind CSS

核心组件:
  • Button
  • Table (DataTable)
  • Dialog (Modal)
  • Form
  • Badge
  • Card
  • Tabs
  • Select
  • Input

布局:
  • 响应式设计
  • 移动优先
  • Flexbox + Grid
  • 暗色模式支持（可选）
```

### 用户体验
```yaml
加载状态:
  • Skeleton加载
  • Progress指示器
  • 乐观UI更新

错误处理:
  • Toast通知
  • 错误边界
  • 友好错误信息
  • 重试机制

交互反馈:
  • 即时验证
  • 确认对话框
  • 加载动画
  • 成功/失败提示
```

---

## 🛠️ 开发工具链

### 包管理
```yaml
包管理器: npm
Lock文件: package-lock.json

关键依赖:
  • next: ^15.5.4
  • react: ^18.3.1
  • typescript: ^5.0.0
  • firebase-admin: ^13.0.1
  • next-auth: ^5.0.0-beta.25
  • @vercel/kv: ^3.0.0
  • tailwindcss: ^3.4.1
```

### 代码质量
```yaml
TypeScript:
  • 严格模式启用
  • 类型检查强制
  • 编译时错误捕获

ESLint:
  • Next.js规则
  • TypeScript规则
  • React Hooks规则
  • 导入排序

Prettier:
  • 代码格式化
  • 保存时自动格式化
  • 团队统一风格
```

### 开发环境
```yaml
IDE: Cursor (VS Code fork)
Node版本: 20.x LTS
包管理器: npm 10.x

开发服务器:
  • 热重载 (HMR)
  • Fast Refresh
  • 端口: 3000

调试工具:
  • React DevTools
  • Chrome DevTools
  • Next.js DevTools
```

---

## 📈 监控和分析

### 性能监控
```yaml
Vercel Analytics:
  • 实时性能指标
  • Web Vitals (LCP, FID, CLS)
  • 页面加载时间
  • API响应时间

自定义日志:
  • API性能追踪
  • Firestore读取计数
  • 缓存命中率
  • 错误率统计
```

### 错误追踪
```yaml
方式: Console Logs + Vercel Logs
监控项:
  • API错误
  • 认证失败
  • 数据库错误
  • 缓存错误

日志格式:
  • 时间戳
  • 错误类型
  • 堆栈跟踪
  • 用户上下文
```

---

## 🔄 CI/CD流程

### Git工作流
```yaml
主分支: main (生产)
开发分支: feature/* (功能开发)

提交流程:
  1. 创建feature分支
  2. 开发和测试
  3. 提交PR
  4. Vercel自动创建预览
  5. 代码审查
  6. 合并到main
  7. 自动部署生产
```

### 部署流程
```yaml
触发条件:
  • Push到main分支
  • PR创建/更新

自动化步骤:
  1. 检出代码
  2. 安装依赖 (npm ci)
  3. TypeScript类型检查
  4. ESLint检查
  5. 构建Next.js (npm run build)
  6. 部署到Vercel Edge
  7. 健康检查

部署时间: 2-3分钟
回滚: 一键回滚到之前版本
```

---

## 📚 关键设计决策

### 1. 为什么选择Next.js？
```
✅ Full-stack框架（前后端一体）
✅ 优秀的开发体验
✅ 自动代码分割
✅ 内置优化
✅ Vercel原生支持
✅ 活跃的社区
```

### 2. 为什么选择Firestore？
```
✅ NoSQL灵活性
✅ 实时更新能力
✅ 自动扩展
✅ 按使用付费
✅ Firebase生态集成
✅ 免费额度慷慨
```

### 3. 为什么使用反范式化？
```
✅ 查询性能（一次读取）
✅ 降低成本（减少读取）
✅ 简化代码（无需JOIN）
✅ 更快响应
```

### 4. 为什么用ID字符串而非References？
```
✅ 性能更好（无额外读取）
✅ 成本更低（节省90%+）
✅ 前端处理简单
✅ 灵活性高
```

### 5. 为什么需要两层缓存？
```
✅ Serverless特性（实例不共享）
✅ 内存缓存命中率低（30%）
✅ Redis共享提升到90%+
✅ 成本效益最优
```

---

## 🎯 最佳实践总结

### DO ✅
1. 使用TypeScript严格模式
2. 反范式化数据设计
3. 实施两层缓存
4. 批量查询代替循环
5. 创建Firestore索引
6. 统一错误处理
7. 添加性能日志
8. 权限检查在最前
9. 使用count()统计
10. 环境变量保护敏感信息

### DON'T ❌
1. 不要使用Firestore References
2. 不要N+1查询
3. 不要全表扫描统计
4. 不要过度范式化
5. 不要忽略缓存失效
6. 不要跳过权限检查
7. 不要硬编码配置
8. 不要忽略错误处理
9. 不要提交敏感信息
10. 不要忽视性能监控

---

## 📖 相关文档

| 文档 | 说明 |
|------|------|
| `.cursorrules` | Cursor AI项目规则和最佳实践 |
| `API_PERFORMANCE_AUDIT.md` | API性能审查报告 |
| `DATABASE_DESIGN_COMPARISON.md` | 数据库设计对比分析 |
| `CACHE_SYSTEM.md` | 缓存系统详细文档 |
| `VERCEL_KV_SCALABILITY.md` | 并发和扩展性分析 |
| `DATA_CLEANUP_NOTES.md` | 数据清理说明 |

---

## 🚀 快速开始新项目

### 1. 初始化项目
```bash
npx create-next-app@latest my-project --typescript --tailwind --app
cd my-project
```

### 2. 安装核心依赖
```bash
npm install firebase-admin next-auth@beta
npm install @vercel/kv
npm install @radix-ui/react-dialog @radix-ui/react-select
```

### 3. 复制配置文件
```bash
# 从本项目复制
cp .cursorrules my-project/
cp firestore.indexes.json my-project/
cp src/lib/firebase-admin.ts my-project/src/lib/
cp src/lib/cache*.ts my-project/src/lib/
```

### 4. 配置环境变量
```bash
# 在 .env.local 添加
FIREBASE_ADMIN_PROJECT_ID=
NEXTAUTH_URL=
KV_REST_API_URL=
# ... 其他变量
```

### 5. 部署到Vercel
```bash
vercel login
vercel link
vercel deploy --prod
```

---

**技术栈持续更新中... 最后更新: 2025-01-03** 🚀

