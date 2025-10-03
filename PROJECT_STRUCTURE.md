# 项目结构总览

## 📁 目录结构

```
Student APP(Google firestore)/
│
├── 📂 WEB_APP/                           # Next.js 前端应用
│   ├── src/
│   │   ├── app/                          # App Router 页面
│   │   │   ├── (auth)/                  # 认证页面组
│   │   │   │   ├── auth/signin/         # 登录页
│   │   │   │   └── auth/error/          # 错误页
│   │   │   ├── student/                 # 学生端
│   │   │   ├── admin/                   # 管理员端
│   │   │   │   ├── finance/             # 财务管理
│   │   │   │   └── stats/               # 统计报表
│   │   │   ├── it/                      # IT管理端
│   │   │   └── api/                     # API 路由
│   │   │       ├── auth/[...nextauth]/  # NextAuth 认证
│   │   │       ├── courses/             # 课程 API
│   │   │       ├── student/             # 学生 API
│   │   │       │   ├── cart/            # 购物车
│   │   │       │   ├── enroll/          # 注册
│   │   │       │   └── check-limit/     # 选课限制检查
│   │   │       ├── admin/               # 管理员 API
│   │   │       │   ├── finance/         # 财务相关
│   │   │       │   │   ├── stats/       # 财务统计
│   │   │       │   │   ├── unpaid/      # 欠费列表
│   │   │       │   │   └── mark-paid/   # 标记已付款
│   │   │       │   └── stats/           # 统计
│   │   │       │       └── detailed/    # 详细统计
│   │   │       └── health/              # 健康检查
│   │   │
│   │   ├── components/                  # React 组件
│   │   │   ├── layout/
│   │   │   │   ├── nav-bar.tsx         # 导航栏（角色相关）
│   │   │   │   └── footer.tsx          # 页脚
│   │   │   ├── auth/
│   │   │   │   └── permission-guard.tsx # 权限保护组件
│   │   │   ├── student/
│   │   │   │   └── CourseLimitBadge.tsx # 选课限制徽章
│   │   │   ├── pricing/
│   │   │   │   └── PriceCalculator.tsx  # 价格计算器
│   │   │   ├── providers/
│   │   │   │   └── auth-provider.tsx    # Auth Provider
│   │   │   └── ui/                      # UI 基础组件
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── badge.tsx
│   │   │       └── ...
│   │   │
│   │   ├── lib/                         # 核心库
│   │   │   ├── firebase-admin.ts       # Firebase Admin SDK
│   │   │   ├── auth.ts                 # NextAuth 配置
│   │   │   ├── permissions.ts          # 权限系统（白名单）
│   │   │   ├── api-auth.ts             # API 认证工具
│   │   │   └── pricing.ts              # 定价引擎
│   │   │
│   │   ├── hooks/                       # React Hooks
│   │   │   └── use-permissions.ts      # 权限检查 Hook
│   │   │
│   │   ├── types/                       # TypeScript 类型
│   │   │   └── index.ts                # 全局类型定义
│   │   │
│   │   └── middleware.ts                # Next.js 中间件（路由保护）
│   │
│   ├── public/                          # 静态资源
│   ├── .env.local                       # 环境变量（不提交）
│   ├── package.json                     # NPM 依赖
│   ├── tsconfig.json                    # TypeScript 配置
│   ├── tailwind.config.ts               # Tailwind 配置
│   ├── next.config.js                   # Next.js 配置
│   ├── README.md                        # 前端文档
│   └── PERMISSIONS_GUIDE.md             # 权限系统指南
│
├── 📂 scripts/                          # Python 工具脚本
│   ├── import_data.py                  # 从 Excel 导入课程数据
│   ├── student_manager.py              # 学生数据管理工具
│   └── README.md                        # 脚本说明文档
│
├── 📂 functions/                        # Firebase Cloud Functions（待开发）
│
├── 📄 St Regis Online Courses Form.xlsx # 课程数据源（Excel）
├── 📄 borui-education-*.json            # Firebase 服务账号密钥（不提交）
├── 📄 requirements.txt                  # Python 依赖
├── 📄 .gitignore                        # Git 忽略文件
├── 📄 README.md                         # 项目主文档
└── 📄 PROJECT_STRUCTURE.md              # 本文件

```

---

## 🎯 核心文件说明

### 配置文件

| 文件 | 作用 | 重要性 |
|-----|------|-------|
| `WEB_APP/.env.local` | 环境变量（Firebase、NextAuth、OAuth） | 🔴 必需 |
| `borui-education-*.json` | Firebase Admin SDK 密钥 | 🔴 必需 |
| `requirements.txt` | Python 脚本依赖 | 🟡 可选 |
| `.gitignore` | Git 忽略规则 | 🟢 建议 |

### 权限系统

| 文件 | 作用 |
|-----|------|
| `src/lib/permissions.ts` | 定义角色白名单（Admin/IT/Superadmin） |
| `src/lib/api-auth.ts` | API 路由权限验证工具 |
| `src/hooks/use-permissions.ts` | 客户端权限检查 Hook |
| `src/middleware.ts` | 全局路由保护 |
| `WEB_APP/PERMISSIONS_GUIDE.md` | 权限系统使用指南 |

### 数据模型

| 文件 | 作用 |
|-----|------|
| `src/types/index.ts` | TypeScript 类型定义（Student, Course, Enrollment, Payment） |
| `src/lib/pricing.ts` | 定价计算逻辑 |

### 前端页面

| 路由 | 文件 | 角色要求 |
|------|-----|---------|
| `/` | `app/page.tsx` | 公开 |
| `/auth/signin` | `app/(auth)/auth/signin/page.tsx` | 公开 |
| `/student` | `app/student/page.tsx` | Student+ |
| `/admin/finance` | `app/admin/finance/page.tsx` | Admin+ |
| `/admin/finance/unpaid` | `app/admin/finance/unpaid/page.tsx` | Admin+ |

### API 端点

| 分类 | 端点 | 文件 |
|------|-----|------|
| **认证** | `/api/auth/*` | `app/api/auth/[...nextauth]/route.ts` |
| **课程** | `/api/courses` | `app/api/courses/route.ts` |
| **学生** | `/api/student/cart/add` | `app/api/student/cart/add/route.ts` |
| **学生** | `/api/student/check-limit` | `app/api/student/check-limit/route.ts` |
| **管理员** | `/api/admin/finance/stats` | `app/api/admin/finance/stats/route.ts` |
| **管理员** | `/api/admin/finance/unpaid` | `app/api/admin/finance/unpaid/route.ts` |
| **管理员** | `/api/admin/finance/mark-paid` | `app/api/admin/finance/mark-paid/route.ts` |
| **系统** | `/api/health` | `app/api/health/route.ts` |

---

## 🔐 敏感文件（不要提交到 Git）

```
.env.local
borui-education-*.json
.next/
node_modules/
venv/
```

这些文件已在 `.gitignore` 中配置。

---

## 🔄 数据流

### 1. 用户认证流程
```
用户登录
  ↓
Google OAuth / Email Login
  ↓
NextAuth.js (`src/lib/auth.ts`)
  ↓
检查 Firestore 用户表
  ↓
根据邮箱白名单分配角色 (`src/lib/permissions.ts`)
  ↓
生成 JWT Token
  ↓
Session 存储在客户端（Cookie）
```

### 2. 学生选课流程
```
浏览课程 (`/student`)
  ↓
添加到购物车（客户端状态）
  ↓
检查选课限制 (`/api/student/check-limit`)
  ↓
提交注册 (`/api/student/enroll`)
  ↓
Firestore 创建 Enrollment 记录
  ↓
等待管理员审批
```

### 3. 管理员审批流程
```
查看待审批列表 (`/admin`)
  ↓
批准/拒绝注册 (`/api/admin/approve` 或 `/reject`)
  ↓
更新 Firestore Enrollment 状态
  ↓
（可选）发送通知邮件
```

### 4. 财务管理流程
```
查看财务统计 (`/admin/finance`)
  ↓
查看欠费列表 (`/admin/finance/unpaid`)
  ↓
标记已付款 (`/api/admin/finance/mark-paid`)
  ↓
更新 Firestore 中的 Payment 记录
```

---

## 📊 数据库集合（Firestore）

### 主要集合

| 集合名 | 说明 | 关键字段 |
|--------|------|---------|
| `students` | 学生/用户信息 | email, role, name, status |
| `courses` | 课程信息 | courseName, subject, category, basePrice |
| `enrollments` | 注册记录 | studentId, courseId, status, paymentInfo |
| `payments` | 付款记录 | studentId, amount, method, status |

---

## 🛠️ 开发工作流

### 添加新功能

1. **后端 API**
   - 在 `src/app/api/` 创建新路由
   - 使用 `requireAuth()` 或 `requireRole()` 保护
   - 在 `WEB_APP/README.md` 的 API 文档中更新

2. **前端页面**
   - 在 `src/app/` 创建新页面
   - 使用 `usePermissions()` Hook 检查权限
   - 使用 `<PermissionGuard>` 保护敏感UI

3. **权限配置**
   - 更新 `src/lib/permissions.ts` 白名单
   - 更新 `src/middleware.ts` 路由保护规则

---

## 📝 文档索引

| 文档 | 内容 |
|-----|------|
| [README.md](./README.md) | 项目总览、快速开始 |
| [WEB_APP/README.md](./WEB_APP/README.md) | 前端详细文档、API 列表 |
| [WEB_APP/PERMISSIONS_GUIDE.md](./WEB_APP/PERMISSIONS_GUIDE.md) | 权限系统完整指南 |
| [scripts/README.md](./scripts/README.md) | Python 脚本使用说明 |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | 本文件 - 项目结构 |

---

## 🚀 部署清单

### 开发环境
- [x] Node.js 18+
- [x] Python 3.9+
- [x] Firebase 项目
- [x] `.env.local` 配置

### 生产环境
- [ ] Vercel 部署
- [ ] 环境变量配置
- [ ] 域名绑定
- [ ] Firestore 安全规则
- [ ] Firebase Auth 域名白名单

---

**最后更新**: 2025-10-03  
**项目状态**: 🟢 生产就绪（核心功能完成）



