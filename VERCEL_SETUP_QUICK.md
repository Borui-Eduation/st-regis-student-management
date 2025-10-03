# ⚡ Vercel 快速部署指南

## ✅ 是的，您说得对！

**应该部署的目录是：`WEB_APP`（大写）**

项目结构：
```
Student APP(Google firestore)/
├── WEB_APP/              ← 这是 Next.js 应用，需要部署
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── vercel.json       ← WEB_APP 的配置
├── functions/            ← Firebase Cloud Functions（不用管）
├── scripts/              ← Python 脚本（不用管）
├── vercel.json           ← 根目录配置
└── *.md                  ← 文档（不用管）
```

---

## 🚀 Vercel Dashboard 设置（重要！）

### 1️⃣ Root Directory 设置

登录 [Vercel Dashboard](https://vercel.com/) → 找到您的项目 → Settings → General

**Root Directory:** 
```
WEB_APP
```

✅ **必须设置为 `WEB_APP`**（大写，不是 webapp）

![Root Directory](https://vercel.com/docs-static/images/root-directory.png)

---

### 2️⃣ Framework Preset

应该自动检测为：
```
Framework Preset: Next.js
```

---

### 3️⃣ Build & Development Settings

保持默认：
```yaml
Build Command: npm run build (自动检测)
Output Directory: .next (自动检测)
Install Command: npm install (自动检测)
```

---

### 4️⃣ Node.js Version

```
Node.js Version: 18.x
```

---

## 🔐 环境变量（必须配置）

在 Vercel Dashboard → Settings → Environment Variables 添加以下变量：

### Firebase Admin
```bash
FIREBASE_ADMIN_PROJECT_ID=borui-education
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@borui-education.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_DATABASE_ID=(default)
```

### Firebase Client
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education
NEXT_PUBLIC_FIREBASE_DATABASE_ID=(default)
```

### NextAuth
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here
```

### Google OAuth
```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### Vercel KV（自动添加）
```bash
KV_REST_API_URL=https://xxxxx.upstash.io
KV_REST_API_TOKEN=xxxxx
```

---

## 📝 部署步骤

### 方式 1: 自动部署（推荐）

1. **代码已经推送到 GitHub**
   ```bash
   git push origin main
   ```
   ✅ 已完成

2. **Vercel 会自动检测并部署**
   - 等待 1-3 分钟
   - 查看部署状态：https://vercel.com/dashboard

3. **如果构建失败**
   - 检查 Root Directory 是否设置为 `WEB_APP`
   - 检查环境变量是否都已配置
   - 查看构建日志找到具体错误

---

### 方式 2: 手动触发部署

在 Vercel Dashboard → Deployments → 点击 **"Redeploy"**

---

## 🔍 验证部署

### 检查构建日志

在 Vercel Dashboard 找到最新的 Deployment，查看：

1. **Build Logs**
   - 应该看到 `npm install` 成功
   - 应该看到 `npm run build` 成功
   - 没有错误

2. **Function Logs**
   - API 路由能正常初始化
   - Firebase Admin 连接成功
   - Redis 连接成功

### 访问应用

```
https://your-domain.vercel.app
```

应该能看到：
- ✅ 登录页面正常显示
- ✅ 能用 Google 登录
- ✅ Dashboard 能加载数据

---

## ⚠️ 常见错误

### 错误 1: "Cannot find module"
**原因：** Root Directory 未设置或设置错误

**解决：** 
1. 进入 Settings → General
2. 设置 Root Directory 为 `WEB_APP`
3. 点击 Save
4. 重新部署

---

### 错误 2: "Firebase Admin SDK error"
**原因：** 环境变量未设置或格式错误

**解决：**
1. 检查 `FIREBASE_ADMIN_PRIVATE_KEY` 格式
2. 确保包含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
3. 换行符是 `\n`，不是真实换行
4. 整个值用双引号包裹

---

### 错误 3: "Redis connection failed"
**原因：** Vercel KV 未创建或未绑定

**解决：**
1. 进入 Storage → Create Database → KV
2. 选择 San Francisco (sfo1)
3. 创建后会自动添加环境变量
4. 重新部署

---

## 📊 部署成功标志

✅ 在 Vercel Dashboard 看到绿色的 "Ready"

✅ 访问 URL 能看到应用

✅ 能正常登录

✅ Dashboard 能显示数据

✅ 无 Console 错误

---

## 📞 需要帮助？

如果部署失败，请提供：
1. 构建日志截图
2. 错误信息
3. Root Directory 设置截图

我会帮您解决！🚀

---

**最后更新：** 2025-01-03  
**当前状态：** ✅ 代码已推送到 GitHub，等待 Vercel 自动部署

