# ✅ Vercel 环境变量配置清单

## 🔐 需要配置的环境变量（共 13 个）

### 1. Node 环境（1个）
```
NODE_ENV=production
```

---

### 2. Firebase Admin SDK（4个）

#### FIREBASE_ADMIN_PROJECT_ID
```
值：你的 Firebase 项目 ID
示例：st-regis-enrollment
```

#### FIREBASE_ADMIN_CLIENT_EMAIL
```
值：firebase-adminsdk-xxxxx@你的项目.iam.gserviceaccount.com
在哪找：Firebase Console → Project Settings → Service Accounts
```

#### FIREBASE_ADMIN_PRIVATE_KEY
```
⚠️ 重要格式：
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...(你的私钥)...\n-----END PRIVATE KEY-----\n"

注意：
1. 必须包含双引号
2. 换行符用 \n 表示
3. 包含完整的 BEGIN 和 END 标记
```

#### FIREBASE_ADMIN_DATABASE_ID
```
值：(default)
```

---

### 3. Firebase Client - 公开配置（2个）

#### NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
值：你的 Firebase 项目 ID（同上）
```

#### NEXT_PUBLIC_FIREBASE_DATABASE_ID
```
值：(default)
```

---

### 4. NextAuth 认证（2个）

#### NEXTAUTH_URL
```
首次部署填：https://你猜测的项目名.vercel.app
部署后更新为：https://实际的域名.vercel.app
```

#### NEXTAUTH_SECRET
```
生成命令：
openssl rand -base64 32

或在线生成：https://generate-secret.vercel.app/32

示例：abc123xyz789randomstringhere==
```

---

### 5. Google OAuth（2个）

#### GOOGLE_CLIENT_ID
```
值：你的客户端ID.apps.googleusercontent.com
在哪找：https://console.cloud.google.com/apis/credentials
```

#### GOOGLE_CLIENT_SECRET
```
值：GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
在哪找：同上
```

**⚠️ 重要：部署后需要添加回调 URL**
```
回调 URL：https://你的域名.vercel.app/api/auth/callback/google
```

---

### 6. Resend Email（2个）

#### RESEND_API_KEY
```
值：re_xxxxxxxxxxxxxxxx
在哪找：https://resend.com/api-keys
```

#### RESEND_FROM_EMAIL
```
值：noreply@你的域名.com
或：noreply@yourdomain.com
```

---

### 7. Vercel KV / Upstash Redis（2个）

**选项 A：在 Vercel 创建 KV（推荐）**
1. Vercel Dashboard → Storage → Create Database
2. 选择 KV (Redis)
3. 选择区域：Hong Kong (asia-east2)
4. 自动添加环境变量

**选项 B：使用现有 Upstash**

#### KV_REST_API_URL
```
值：https://your-instance.upstash.io
```

#### KV_REST_API_TOKEN
```
值：你的 token
```

---

## 📋 快速检查清单

在 Vercel 配置环境变量时，按以下顺序填写：

- [ ] NODE_ENV
- [ ] FIREBASE_ADMIN_PROJECT_ID
- [ ] FIREBASE_ADMIN_CLIENT_EMAIL
- [ ] FIREBASE_ADMIN_PRIVATE_KEY ⚠️ 注意格式
- [ ] FIREBASE_ADMIN_DATABASE_ID
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] NEXT_PUBLIC_FIREBASE_DATABASE_ID
- [ ] NEXTAUTH_URL ⚠️ 部署后需要更新
- [ ] NEXTAUTH_SECRET
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] RESEND_API_KEY
- [ ] RESEND_FROM_EMAIL
- [ ] KV_REST_API_URL（或在 Vercel 创建）
- [ ] KV_REST_API_TOKEN

---

## 🔧 部署后必做

### 1. 更新 NEXTAUTH_URL（必须）

部署成功后，Vercel 会给你一个 URL，例如：
```
https://st-regis-student-management-abc123.vercel.app
```

**操作：**
1. Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 找到 `NEXTAUTH_URL`
3. 点击编辑，更新为实际 URL
4. 保存
5. 重新部署（Deployments → ⋯ → Redeploy）

### 2. 更新 Google OAuth 回调 URL（必须）

**操作：**
1. 访问：https://console.cloud.google.com/apis/credentials
2. 选择你的 OAuth 2.0 客户端
3. 在"授权的重定向 URI"添加：
   ```
   https://实际的域名.vercel.app/api/auth/callback/google
   ```
4. 保存

### 3. 创建 Vercel KV（如果还没有）

**操作：**
1. Vercel Dashboard → 你的项目 → Storage
2. Create Database → KV
3. 选择区域：Hong Kong
4. Create
5. 环境变量会自动添加

---

## 🚨 常见错误

### 错误 1: Firebase Admin SDK 初始化失败
```
原因：FIREBASE_ADMIN_PRIVATE_KEY 格式不正确
解决：确保包含双引号和 \n 换行符
```

### 错误 2: NextAuth 无法登录
```
原因：NEXTAUTH_URL 与实际域名不匹配
解决：部署后更新为实际的 Vercel URL
```

### 错误 3: Google OAuth 报错
```
原因：回调 URL 未添加到 Google Console
解决：添加正确的回调 URL
```

### 错误 4: Redis 连接失败
```
原因：KV 环境变量未配置
解决：在 Vercel 创建 KV 数据库
```

---

## 💡 复制粘贴模板

可以从现有的 `.env` 文件复制：

```bash
# 如果你有本地 .env 文件
cat WEB_APP/.env

# 复制输出的内容到 Vercel
```

---

## 📞 需要帮助？

1. **检查格式**：特别是 FIREBASE_ADMIN_PRIVATE_KEY
2. **查看日志**：Vercel Dashboard → Functions
3. **测试 API**：`curl https://你的域名.vercel.app/api/health`

---

**准备好了？开始配置吧！🚀**


