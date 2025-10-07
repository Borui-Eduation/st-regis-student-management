# 🚀 立即部署到 Vercel - 操作指南

## ✅ 准备工作已完成

我已经为你准备好了：
- ✅ 优化了 `next.config.js`（注释掉了 Docker 专用配置）
- ✅ 创建了 `vercel.json`（Vercel 配置文件）
- ✅ 创建了 `.env.example`（环境变量模板）

---

## 📝 第一步：提交代码到 GitHub（2分钟）

在终端执行以下命令：

```bash
# 进入 WEB_APP 目录
cd /home/borui/apps/st-regis-student-management

# 添加所有更改
git add .

# 提交更改
git commit -m "feat: 准备 Vercel 部署配置"

# 推送到 GitHub
git push origin main
```

---

## 🌐 第二步：在 Vercel 部署（5分钟）

### 1. 登录 Vercel

**访问：** https://vercel.com/login

- 点击 **"Continue with GitHub"**
- 授权 Vercel 访问你的 GitHub

### 2. 导入项目

**访问：** https://vercel.com/new

1. 在列表中找到 `st-regis-student-management` 仓库
2. 点击 **"Import"**

### 3. 配置项目设置

**重要配置：**

```
Framework Preset: Next.js （自动检测）
Root Directory: WEB_APP  ⚠️ 必须设置！
Build Command: npm run build （默认）
Output Directory: .next （默认）
Install Command: npm install （默认）
Node.js Version: 20.x （推荐）
```

**设置 Root Directory 的方法：**
1. 点击 "Edit" 按钮
2. 在 "Root Directory" 输入框填写：`WEB_APP`
3. 点击 "Continue"

---

## 🔐 第三步：配置环境变量（10-15分钟）

点击 **"Environment Variables"**，添加以下变量：

### 必需的环境变量清单

#### 1. Node 环境
```
Name: NODE_ENV
Value: production
```

#### 2. Firebase Admin SDK

```
Name: FIREBASE_ADMIN_PROJECT_ID
Value: 你的 Firebase 项目 ID
```

```
Name: FIREBASE_ADMIN_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@你的项目.iam.gserviceaccount.com
```

```
Name: FIREBASE_ADMIN_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----\n完整的私钥\n-----END PRIVATE KEY-----\n"
```

⚠️ **重要：** FIREBASE_ADMIN_PRIVATE_KEY 必须：
- 包含双引号
- 换行符用 `\n` 表示
- 包含 BEGIN 和 END 标记

```
Name: FIREBASE_ADMIN_DATABASE_ID
Value: (default)
```

#### 3. Firebase Client（公开）

```
Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: 你的 Firebase 项目 ID
```

```
Name: NEXT_PUBLIC_FIREBASE_DATABASE_ID
Value: (default)
```

#### 4. NextAuth 认证

```
Name: NEXTAUTH_URL
Value: https://你的项目名.vercel.app
```

⚠️ **注意：** 部署后需要更新为实际的 Vercel URL

```
Name: NEXTAUTH_SECRET
Value: 生成一个随机字符串（可以用下面的命令）
```

**生成 NEXTAUTH_SECRET：**
```bash
openssl rand -base64 32
# 或者在线生成：https://generate-secret.vercel.app/32
```

#### 5. Google OAuth

```
Name: GOOGLE_CLIENT_ID
Value: 你的 Google 客户端 ID.apps.googleusercontent.com
```

```
Name: GOOGLE_CLIENT_SECRET
Value: 你的 Google 客户端密钥
```

**获取 Google OAuth 凭据：**
1. 访问：https://console.cloud.google.com/apis/credentials
2. 创建 OAuth 2.0 客户端 ID
3. 授权重定向 URI 添加：
   - `https://你的项目名.vercel.app/api/auth/callback/google`

#### 6. Resend Email

```
Name: RESEND_API_KEY
Value: re_你的 API 密钥
```

```
Name: RESEND_FROM_EMAIL
Value: noreply@你的域名.com
```

**获取 Resend API Key：**
- 访问：https://resend.com/api-keys

#### 7. Vercel KV (Redis)

如果你还没有创建 Vercel KV，需要先创建：

**创建 Vercel KV 数据库：**
1. 在 Vercel Dashboard
2. 进入你的项目
3. 点击 **Storage** 标签
4. 点击 **Create Database**
5. 选择 **KV (Redis)**
6. 选择区域（建议选择 Hong Kong）
7. 点击 **Create**

Vercel 会自动添加这些环境变量：
```
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
KV_URL
```

**或者使用现有的 Upstash Redis：**
```
Name: KV_REST_API_URL
Value: https://你的-redis-实例.upstash.io
```

```
Name: KV_REST_API_TOKEN
Value: 你的 token
```

---

## 🚀 第四步：部署！（3分钟）

1. 确认所有环境变量已填写
2. 点击 **"Deploy"** 按钮
3. 等待构建完成（约 2-3 分钟）

**构建日志说明：**
```
✓ Installing dependencies
✓ Building application
✓ Uploading build output
✓ Deploying to Vercel Edge Network
✓ Deployment complete!
```

---

## ✅ 第五步：验证部署（5分钟）

### 1. 获取你的 Vercel URL

部署成功后，你会看到：
```
https://st-regis-student-management-xxx.vercel.app
或
https://你的项目名.vercel.app
```

### 2. 测试健康检查

```bash
curl https://你的项目名.vercel.app/api/health
```

应该返回：
```json
{"success": true, "status": "ok"}
```

### 3. 测试应用功能

访问应用并测试：
- [ ] 首页能正常加载
- [ ] 登录功能正常（Google OAuth）
- [ ] API 接口响应正常
- [ ] 数据能正常读写
- [ ] 没有控制台错误

---

## 🔧 第六步：更新配置（5分钟）

### 1. 更新 NEXTAUTH_URL

部署成功后，更新环境变量：

1. Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 找到 `NEXTAUTH_URL`
3. 点击编辑，更新为实际的 Vercel URL
4. 保存并重新部署

### 2. 更新 Google OAuth 回调 URL

1. 访问：https://console.cloud.google.com/apis/credentials
2. 选择你的 OAuth 2.0 客户端
3. 在"授权的重定向 URI"中添加：
   ```
   https://你的项目名.vercel.app/api/auth/callback/google
   ```
4. 保存

### 3. 重新部署

在 Vercel Dashboard：
1. 点击 **Deployments** 标签
2. 点击最新部署的 **⋯** 菜单
3. 选择 **"Redeploy"**

---

## 🎉 完成！

你的应用已成功部署！

**访问地址：**
```
https://你的项目名.vercel.app
```

---

## 📊 后续操作

### 监控使用情况

1. Vercel Dashboard → 你的项目 → **Analytics**
2. 查看：
   - 流量使用
   - 函数调用
   - 性能指标
   - 错误日志

### 设置告警

1. Settings → **Notifications**
2. 启用：
   - Usage Alerts (80%, 100%)
   - Deployment Notifications
   - Error Alerts

### 配置自定义域名（可选）

1. Settings → **Domains**
2. 添加你的域名
3. 配置 DNS 记录
4. 等待 SSL 证书自动配置

---

## 🚨 常见问题

### 问题 1: 构建失败

**错误提示：** `Build failed`

**解决方案：**
1. 检查 Root Directory 是否设置为 `WEB_APP`
2. 检查环境变量是否完整
3. 查看构建日志找到具体错误

### 问题 2: 环境变量不生效

**解决方案：**
1. 确保所有 `NEXT_PUBLIC_*` 变量在构建前已配置
2. 修改环境变量后需要重新部署
3. 检查变量名大小写是否正确

### 问题 3: Firebase 连接失败

**解决方案：**
1. 检查 `FIREBASE_ADMIN_PRIVATE_KEY` 格式
2. 确保包含完整的 BEGIN/END 标记
3. 确保换行符是 `\n` 而不是真实换行

### 问题 4: Google OAuth 不工作

**解决方案：**
1. 确保在 Google Console 添加了正确的回调 URL
2. 检查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
3. 确保 `NEXTAUTH_URL` 与实际域名匹配

### 问题 5: 404 错误

**解决方案：**
1. 确保 Root Directory 设置为 `WEB_APP`
2. 检查路由文件是否在 `app/` 目录
3. 清除缓存并重新部署

---

## 📞 需要帮助？

如果遇到问题：

1. **查看构建日志**
   - Vercel Dashboard → Deployments → [最新部署] → Building

2. **查看运行时日志**
   - Vercel Dashboard → Deployments → [最新部署] → Functions

3. **查看文档**
   - Vercel 文档：https://vercel.com/docs
   - Next.js 文档：https://nextjs.org/docs

---

## 🎯 快速命令参考

```bash
# 提交并推送代码
git add . && git commit -m "update" && git push

# 使用 Vercel CLI 部署（可选）
npm i -g vercel
vercel login
vercel --prod

# 查看日志
vercel logs --follow

# 查看环境变量
vercel env ls
```

---

**祝部署成功！🚀**

如有问题随时问我！



