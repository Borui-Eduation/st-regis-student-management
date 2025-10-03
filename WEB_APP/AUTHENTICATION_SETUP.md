# 🔐 认证系统配置指南

## 1. 安装依赖

```bash
cd WEB_APP
npm install
```

## 2. 配置 Google OAuth

### 2.1 创建 Google OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目 `borui-education`
3. 导航到 **APIs & Services** > **Credentials**
4. 点击 **Create Credentials** > **OAuth 2.0 Client ID**
5. 选择 **Web application**
6. 配置：
   - **Name**: St Regis Course System
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-production-domain.com`
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-production-domain.com/api/auth/callback/google`
7. 保存并复制 **Client ID** 和 **Client Secret**

### 2.2 更新环境变量

在 `.env.local` 中添加：

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 3. 生成 NextAuth Secret

运行以下命令生成密钥：

```bash
openssl rand -base64 32
```

将生成的密钥添加到 `.env.local`：

```bash
NEXTAUTH_SECRET=生成的密钥
NEXTAUTH_URL=http://localhost:3000
```

## 4. 配置 Email 登录

已配置使用 Resend 发送登录邮件。确保以下环境变量已设置：

```bash
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM_EMAIL=noreply@stregis.edu
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_xxxxxxxxxx
```

## 5. 用户角色分配规则

### 自动分配规则：

1. **@borui.org 域名**:
   - `admin@borui.org` → **admin**
   - `it@borui.org` → **it**
   - 其他 `*@borui.org` → **admin**

2. **其他邮箱**: → **student**

### 数据库字段：

在 `students` collection 中添加 `role` 字段：
- `student` - 学生
- `admin` - 管理员
- `it` - IT人员
- `superadmin` - 超级管理员

## 6. 保护的路由

### 自动保护（通过 middleware）：
- `/student/*` - 所有登录用户
- `/admin/*` - 仅 admin、superadmin
- `/it/*` - 仅 it、admin、superadmin

### 未保护的路由：
- `/` - 首页
- `/auth/*` - 登录页面
- `/api/auth/*` - NextAuth API

## 7. 测试登录流程

### 7.1 启动服务器

```bash
cd WEB_APP
npm run dev
```

### 7.2 测试 Google 登录

1. 访问 http://localhost:3000/auth/signin
2. 点击 "使用 Google 账号登录"
3. 选择 Google 账号
4. 确认权限

### 7.3 测试 Email 登录

1. 访问 http://localhost:3000/auth/signin
2. 输入邮箱地址
3. 点击 "发送登录链接"
4. 检查邮箱，点击登录链接

## 8. 在代码中使用认证

### 8.1 获取当前用户（客户端）

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>加载中...</p>;
  if (!session) return <p>未登录</p>;

  return (
    <div>
      <p>欢迎, {session.user.name}</p>
      <p>角色: {session.user.role}</p>
    </div>
  );
}
```

### 8.2 获取当前用户（服务端）

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <p>未登录</p>;
  }

  return <p>欢迎, {session.user.name}</p>;
}
```

### 8.3 保护 API 路由

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: '权限不足' }, { status: 403 });
  }

  // 执行管理员操作
  return NextResponse.json({ success: true });
}
```

### 8.4 登出

```typescript
'use client';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/' })}>
      退出登录
    </button>
  );
}
```

## 9. 生产环境配置

### 9.1 更新环境变量

```bash
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=生产环境密钥（使用新的密钥）
```

### 9.2 更新 Google OAuth 重定向 URI

在 Google Cloud Console 中添加生产环境的重定向 URI：
- `https://your-production-domain.com/api/auth/callback/google`

## 10. 常见问题

### Q: 登录后跳转到错误页面？
A: 检查 `NEXTAUTH_URL` 是否正确配置

### Q: Google 登录显示 "redirect_uri_mismatch"？
A: 确保 Google Console 中配置的重定向 URI 与实际 URL 完全匹配

### Q: Email 登录没有收到邮件？
A: 检查 Resend API Key 和发件人邮箱配置

### Q: 如何手动设置用户角色？
A: 在 Firestore 的 `students` collection 中，更新用户文档的 `role` 字段

## 11. 安全建议

1. ✅ 使用 HTTPS（生产环境）
2. ✅ 定期更新 `NEXTAUTH_SECRET`
3. ✅ 限制 OAuth 重定向 URI
4. ✅ 在 Firestore 中设置适当的安全规则
5. ✅ 记录所有登录和权限变更操作

