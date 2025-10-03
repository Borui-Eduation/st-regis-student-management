# St Regis 学生管理系统

Next.js 15 + Firebase + TypeScript 构建的在线课程注册管理系统。

## 🚀 快速部署

### 1. 克隆代码

```bash
git clone https://github.com/Borui-Eduation/st-regis-student-management.git
cd st-regis-student-management
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

### 3. 启动服务

```bash
docker-compose up -d --build
```

### 4. 访问应用

```
http://localhost:3000
```

---

## 🌐 Cloudflare Tunnel（公网访问）

### 安装 cloudflared

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 创建 Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create stregis
```

### 配置 (~/.cloudflared/config.yml)

```yaml
tunnel: stregis
credentials-file: /root/.cloudflared/YOUR-TUNNEL-ID.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 启动

```bash
cloudflared tunnel route dns stregis your-domain.com
sudo cloudflared service install
sudo systemctl start cloudflared
```

---

## 🔧 常用命令

```bash
# 查看日志
docker-compose logs -f

# 重启
docker-compose restart

# 停止
docker-compose down

# 更新
git pull && docker-compose up -d --build
```

---

## 📝 环境变量

参考 `.env.example` 文件配置以下变量：

- Firebase Admin SDK 配置
- Firebase Client 配置
- NextAuth 配置
- Google OAuth 配置
- Upstash Redis 配置

---

## 🔐 Google OAuth 配置

在 [Google Cloud Console](https://console.cloud.google.com/) 添加：

**Authorized redirect URIs:**
```
https://your-domain.com/api/auth/callback/google
```

---

**技术栈:** Next.js 15 | TypeScript | Firebase | Upstash Redis | Docker
