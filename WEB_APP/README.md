# 🎓 St Regis 学生管理系统 - 前端应用

基于 Next.js 15 的现代化学生管理系统前端。

---

## ⚡ 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 3. 启动开发
npm run dev

# 访问 http://localhost:3000
```

---

## 📂 项目结构

```
src/
├── app/                          # Next.js 应用路由
│   ├── (auth)/                  # 认证相关页面
│   ├── student/                 # 学生端页面
│   ├── admin/                   # 管理员端页面
│   ├── it/                      # IT端页面
│   ├── api/                     # API 路由
│   │   ├── auth/                # NextAuth 认证
│   │   ├── student/             # 学生 API
│   │   ├── admin/               # 管理员 API
│   │   └── health/              # 健康检查
│   └── layout.tsx               # 根布局
│
├── components/                   # React 组件
│   ├── layout/                  # 布局组件（导航栏等）
│   ├── auth/                    # 认证组件
│   ├── student/                 # 学生端组件
│   ├── admin/                   # 管理员端组件
│   ├── pricing/                 # 定价计算器
│   └── providers/               # Context Providers
│
├── lib/                         # 核心库
│   ├── firebase-admin.ts       # Firebase Admin SDK
│   ├── auth.ts                 # NextAuth 配置
│   ├── permissions.ts          # 权限系统
│   ├── api-auth.ts             # API 认证工具
│   └── pricing.ts              # 定价引擎
│
├── hooks/                       # React Hooks
│   └── use-permissions.ts      # 权限检查 Hook
│
└── types/                       # TypeScript 类型
    └── index.ts                # 全局类型定义
```

---

## 🔑 核心功能

### 认证与权限
- Google OAuth 登录
- 邮箱登录（Magic Link）
- 基于角色的访问控制（RBAC）
- 4种角色：Student / Admin / IT / Superadmin

### 学生功能
- 课程浏览（表格视图）
- 购物车（最多4门课）
- 选课限制检查
- 价格计算器（动态定价）
- 个人课程管理

### 管理员功能
- 财务统计仪表板
- 欠费学生管理
- 标记付款
- 注册审批
- 详细统计（按科目/年级/教师）

### IT功能
- 用户管理
- 系统维护

---

## 🎨 技术栈

### 核心框架
- **Next.js 15** - React 框架（App Router）
- **TypeScript** - 类型安全
- **React 18** - UI 库

### 样式
- **Tailwind CSS** - 实用工具优先的 CSS
- **Lucide React** - 图标库

### 认证
- **NextAuth.js** - 身份验证
- **Firebase Auth** - Google OAuth
- **Email Provider** - Magic Link 登录

### 数据库
- **Firebase Firestore** - NoSQL 数据库
- **Firebase Admin SDK** - 服务端操作

### 开发工具
- **ESLint** - 代码检查
- **TypeScript** - 静态类型检查

---

## 🔐 环境变量

创建 `.env.local` 文件：

```env
# Firebase Admin SDK（服务端）
FIREBASE_ADMIN_PROJECT_ID=borui-education
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@borui-education.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client（客户端 - 公开）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=borui-education.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education
NEXT_PUBLIC_FIREBASE_DATABASE_ID=studentapp

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Email Provider（可选）
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🛠️ 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器（端口 3000）
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 运行 ESLint
npm run type-check       # TypeScript 类型检查

# 清除缓存
rm -rf .next
```

---

## 📡 API 路由

### 认证 API
- `POST /api/auth/signin` - 登录
- `POST /api/auth/signout` - 登出
- `GET /api/auth/session` - 获取会话

### 学生 API
- `GET /api/courses` - 获取课程列表
- `POST /api/student/cart/add` - 添加到购物车
- `POST /api/student/enroll` - 提交注册
- `GET /api/student/check-limit` - 检查选课限制

### 管理员 API
- `GET /api/admin/finance/stats` - 财务统计
- `GET /api/admin/finance/unpaid` - 欠费列表
- `POST /api/admin/finance/mark-paid` - 标记已付款
- `GET /api/admin/stats/detailed` - 详细统计

### 系统 API
- `GET /api/health` - 健康检查

---

## 🎯 权限系统

详细文档：[PERMISSIONS_GUIDE.md](./PERMISSIONS_GUIDE.md)

### 配置权限

编辑 `src/lib/permissions.ts`：

```typescript
// 管理员邮箱白名单
export const ADMIN_EMAILS = [
  'admin@example.com',
];

// IT邮箱白名单
export const IT_EMAILS = [
  'it@example.com',
];

// 超级管理员邮箱白名单
export const SUPERADMIN_EMAILS = [
  'superadmin@example.com',
];
```

### 使用权限

```typescript
// 在客户端组件
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent() {
  const { role, can, isAdmin } = usePermissions();
  
  if (can('canApprove')) {
    return <ApproveButton />;
  }
}

// 在 API 路由
import { requireRole } from '@/lib/api-auth';

export async function POST(req: Request) {
  await requireRole(['admin', 'superadmin']);
  // 只有管理员和超级管理员可以访问
}
```

---

## 💰 定价系统

动态定价基于：
1. **课程类别**：文科 (\$400) / 理科 (\$550)
2. **支付方式**：信用卡、微信、支付宝、EMT、手动

```typescript
import { calculatePrice } from '@/lib/pricing';

const price = calculatePrice('arts', 'credit_card');
// { basePrice: 400, fee: 14, finalPrice: 414, currency: 'CAD' }
```

---

## 🚀 部署

### Vercel（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 环境变量设置
在 Vercel Dashboard → Settings → Environment Variables 中设置所有环境变量。

---

## 🧪 测试

```bash
# 测试 API
curl http://localhost:3000/api/health

# 测试认证
curl http://localhost:3000/api/auth/session

# 测试课程列表
curl http://localhost:3000/api/courses
```

---

## 🆘 故障排除

### 无法启动
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### 认证失败
1. 检查 `.env.local` 配置
2. 确认 Google OAuth 凭据
3. 检查 NEXTAUTH_SECRET 是否设置

### Firestore 连接失败
1. 确认 Firebase 配置正确
2. 检查数据库 ID 是否为 `studentapp`
3. 验证服务账号权限

### 角色不正确
1. 检查邮箱是否在权限白名单中
2. 退出登录后重新登录
3. 清除浏览器 Cookie

---

## 📄 相关文档

- [权限系统指南](./PERMISSIONS_GUIDE.md)
- [项目主文档](../README.md)
- [Python 脚本说明](../scripts/README.md)

---

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [NextAuth.js 文档](https://next-auth.js.org)
- [Firebase 文档](https://firebase.google.com/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**前端状态**: 🟢 生产就绪
