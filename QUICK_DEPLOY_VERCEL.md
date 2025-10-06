# 🚀 Vercel 快速部署指南（5分钟）

## ⚡ 快速开始

### 前置条件
- ✅ 代码已推送到 GitHub
- ✅ 有一个 GitHub 账号
- ✅ 准备好所有环境变量

---

## 📝 部署步骤

### 步骤 1: 登录 Vercel（1分钟）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** 或 **"Log In"**
3. 选择 **"Continue with GitHub"**
4. 授权 Vercel 访问你的 GitHub 账号

### 步骤 2: 导入项目（2分钟）

1. 点击 **"Add New..."** → **"Project"**
2. 在列表中找到 `st-regis-student-management`
3. 点击 **"Import"**
4. 配置项目:
   - **Framework Preset**: Next.js (自动检测)
   - **Root Directory**: `WEB_APP` ⚠️ **重要！**
   - **Build Command**: `npm run build` (默认)
   - **Output Directory**: `.next` (默认)
   - **Install Command**: `npm install` (默认)

### 步骤 3: 配置环境变量（2分钟）

点击 **"Environment Variables"**，添加以下变量：

#### 🔐 必需的环境变量

```env
# Node 环境
NODE_ENV=production

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=你的项目ID
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@你的项目.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n完整的私钥内容\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_DATABASE_ID=(default)

# Firebase Client (公开)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的项目ID
NEXT_PUBLIC_FIREBASE_DATABASE_ID=(default)

# NextAuth
NEXTAUTH_URL=https://你的域名.vercel.app
NEXTAUTH_SECRET=生成一个随机字符串

# Google OAuth
GOOGLE_CLIENT_ID=你的Google客户端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=你的Google客户端密钥

# Resend Email
RESEND_API_KEY=re_你的API密钥
RESEND_FROM_EMAIL=noreply@你的域名.com

# Upstash Redis (Vercel KV)
KV_REST_API_URL=https://你的redis实例.upstash.io
KV_REST_API_TOKEN=你的token
```

#### 💡 快速填充技巧

**方式 A: 从本地 .env 文件复制**
```bash
# 在本地执行
cd WEB_APP
cat .env
# 复制所有内容到 Vercel
```

**方式 B: 使用 Vercel CLI（推荐）**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 关联项目
cd WEB_APP
vercel link

# 拉取生产环境变量（如果之前已配置）
vercel env pull .env.production

# 或者推送本地环境变量
vercel env add FIREBASE_ADMIN_PROJECT_ID production
# 然后输入值
```

### 步骤 4: 部署！（30秒）

1. 检查所有配置无误
2. 点击 **"Deploy"**
3. 等待构建完成（约 2-3 分钟）
4. 🎉 部署成功！

---

## 🔍 部署后验证

### 1. 检查部署状态

访问 Vercel Dashboard，查看:
- ✅ 构建日志（Build Logs）
- ✅ 运行时日志（Function Logs）
- ✅ 部署状态（Deployments）

### 2. 测试应用功能

```bash
# 获取你的 Vercel URL
# 格式: https://your-project.vercel.app

# 测试健康检查
curl https://your-project.vercel.app/api/health

# 应该返回:
# {"success": true, "status": "ok"}
```

### 3. 功能检查清单

- [ ] 首页能正常访问
- [ ] 登录功能正常（Google OAuth）
- [ ] API 接口响应正常
- [ ] 数据库读写正常
- [ ] 缓存功能正常
- [ ] 邮件发送正常（如果有）

---

## 🌍 配置自定义域名（可选）

### 方法 1: 使用 Vercel 提供的域名

**免费子域名:**
- `your-project.vercel.app`
- 自动 HTTPS
- 全球 CDN
- 无需配置

### 方法 2: 使用自己的域名

#### 步骤 1: 在 Vercel 添加域名

1. 进入项目 → **Settings** → **Domains**
2. 输入你的域名: `your-domain.com`
3. 点击 **"Add"**

#### 步骤 2: 配置 DNS

Vercel 会显示需要添加的 DNS 记录:

**选项 A: 使用 A 记录**
```
类型: A
名称: @
值: 76.76.21.21
```

**选项 B: 使用 CNAME 记录（推荐）**
```
类型: CNAME
名称: @
值: cname.vercel-dns.com
```

**添加 www 子域名:**
```
类型: CNAME
名称: www
值: cname.vercel-dns.com
```

#### 步骤 3: 等待 DNS 生效

- 通常需要 5-30 分钟
- Vercel 会自动验证
- 验证成功后自动颁发 SSL 证书

#### 步骤 4: 更新环境变量

```env
# 更新 NEXTAUTH_URL
NEXTAUTH_URL=https://your-domain.com
```

然后重新部署:
```bash
vercel --prod
```

---

## 🔧 高级配置

### 配置 vercel.json（可选）

在 `WEB_APP/` 目录创建 `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  
  "regions": ["sfo1", "hkg1"],
  
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10,
      "memory": 1024
    }
  },
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### 配置环境特定的变量

**Development (开发环境):**
```bash
vercel env add NEXT_PUBLIC_API_URL development
# 输入: http://localhost:3000
```

**Preview (预览环境):**
```bash
vercel env add NEXT_PUBLIC_API_URL preview
# 输入: https://preview-url.vercel.app
```

**Production (生产环境):**
```bash
vercel env add NEXT_PUBLIC_API_URL production
# 输入: https://your-domain.com
```

---

## 📊 监控和分析

### 1. 内置分析

Vercel 提供免费的分析功能:
- **Web Analytics**: 页面浏览量、访客数据
- **Speed Insights**: 性能指标
- **Logs**: 实时日志查看

启用方法:
1. 项目 → **Analytics** → **Enable Web Analytics**
2. 在代码中添加（Vercel 自动注入，无需手动添加）

### 2. 实时日志

查看实时日志:
```bash
# 使用 CLI
vercel logs --follow

# 或在 Dashboard
# Project → Deployments → [最新部署] → Functions
```

### 3. 监控指标

关注以下指标:
- **请求数**: 确保不超过 100 万次/月
- **带宽**: 确保不超过 100 GB/月
- **函数执行时间**: 优化慢查询
- **错误率**: 及时修复 bug

---

## 🚨 常见问题

### 问题 1: 构建失败

**错误:** `Build failed`

**解决方案:**
```bash
# 检查本地是否能正常构建
cd WEB_APP
npm run build

# 如果本地成功，检查环境变量是否完整
# 特别是 NEXT_PUBLIC_* 变量，构建时需要
```

### 问题 2: 环境变量不生效

**错误:** `Missing environment variable`

**解决方案:**
1. 检查变量名是否正确（区分大小写）
2. 检查是否选择了正确的环境（Production/Preview/Development）
3. 重新部署项目

```bash
# 使用 CLI 验证
vercel env ls
```

### 问题 3: API 路由 404

**错误:** `404: NOT_FOUND`

**解决方案:**
- 确保 API 文件在 `app/api/` 目录
- 检查文件名是否正确（route.ts）
- 确保导出了正确的 HTTP 方法（GET, POST, etc.）

### 问题 4: Firestore 连接失败

**错误:** `Failed to initialize Firebase Admin`

**解决方案:**
```bash
# 检查 FIREBASE_ADMIN_PRIVATE_KEY 格式
# 必须包含完整的 -----BEGIN PRIVATE KEY----- 标记
# 并且换行符必须是 \n

# 正确格式:
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

### 问题 5: 超出免费额度

**警告:** `You are approaching your bandwidth limit`

**解决方案:**
1. 优化图片大小和格式
2. 启用更激进的缓存策略
3. 使用 CDN 托管静态资源
4. 考虑升级到 Pro 计划 ($20/月)

---

## 🎯 CI/CD 自动部署

### 自动部署流程

Vercel 默认已启用自动部署:

```yaml
触发条件:
  - Push to main/master → 部署到 Production
  - Push to other branches → 部署到 Preview
  - Pull Request → 创建 Preview 部署

流程:
  1. 检测到 Git 推送
  2. 自动触发构建
  3. 运行 npm install
  4. 运行 npm run build
  5. 部署到 Vercel Edge Network
  6. 发送部署通知（邮件/Slack）
```

### 预览部署

每个 PR 自动获得预览链接:

```
PR #123 → https://your-project-git-feature-branch.vercel.app

功能:
✅ 独立环境
✅ 可分享的 URL
✅ 自动评论到 PR
✅ 每次推送自动更新
```

### 自定义构建脚本

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "npm run build && npm run post-build",
    "post-build": "echo 'Build completed!'"
  }
}
```

---

## 💰 成本监控

### 查看使用情况

1. Dashboard → **Settings** → **Usage**
2. 查看当前月份的:
   - 带宽使用量
   - 函数调用次数
   - 构建时间
   - 团队成员数

### 设置使用警报

1. Settings → **Notifications**
2. 启用:
   - Usage Alerts (80%, 100%)
   - Deployment Notifications
   - Error Alerts

---

## 🔄 更新应用

### 方式 1: Git Push（推荐）

```bash
# 修改代码
git add .
git commit -m "Update feature"
git push origin main

# Vercel 自动检测并部署
# 无需任何手动操作！
```

### 方式 2: 使用 Vercel CLI

```bash
# 部署到 Production
vercel --prod

# 部署到 Preview
vercel

# 查看部署状态
vercel ls
```

### 方式 3: 手动触发

在 Vercel Dashboard:
1. Deployments → [选择一个历史部署]
2. 点击 **"Redeploy"**
3. 选择环境（Production/Preview）

---

## 📚 额外资源

### 官方文档
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Vercel CLI 文档](https://vercel.com/docs/cli)

### 社区资源
- [Vercel Discord](https://vercel.com/discord)
- [Vercel GitHub](https://github.com/vercel/vercel)
- [Next.js GitHub](https://github.com/vercel/next.js)

### 视频教程
- [Vercel 快速开始](https://www.youtube.com/watch?v=x_HgjD1LUdc)
- [部署 Next.js 到 Vercel](https://www.youtube.com/watch?v=2HBIzEx6IZA)

---

## ✅ 检查清单

部署前确保:

- [ ] 代码已推送到 GitHub
- [ ] 所有环境变量已准备
- [ ] Firebase 项目已配置
- [ ] Google OAuth 已设置
- [ ] Vercel KV (Redis) 已创建
- [ ] Resend API Key 已获取

部署后验证:

- [ ] 应用能正常访问
- [ ] 登录功能正常
- [ ] API 接口正常
- [ ] 数据库连接正常
- [ ] 缓存功能正常
- [ ] 没有控制台错误
- [ ] 性能指标良好

---

## 🎉 完成！

恭喜！你的应用已成功部署到 Vercel！

**你的应用地址:**
```
https://your-project.vercel.app
```

**下一步:**
1. 分享给用户测试
2. 监控性能和使用情况
3. 根据反馈持续优化
4. 考虑配置自定义域名

**需要帮助？**
- 📧 查看 Vercel 文档
- 💬 加入 Vercel Discord
- 🐛 提交 Issue 到 GitHub

**祝你成功！🚀**
