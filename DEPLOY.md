# 🚀 部署指南

## 📋 快速开始

### 1. 服务器要求

```yaml
CPU: 2核+
内存: 4GB+
系统: Ubuntu 20.04+ / Debian 11+
Docker: 20.10+
Docker Compose: 2.0+
```

### 2. 安装 Docker

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com | sh

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3. 克隆代码

```bash
git clone https://github.com/Borui-Eduation/st-regis-student-management.git
cd st-regis-student-management
```

### 4. 配置环境变量

```bash
# 复制示例文件
cp .env.example .env

# 编辑环境变量
nano .env
```

**必填环境变量：**

```bash
# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=borui-education
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@borui-education.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_DATABASE_ID=(default)

# Firebase Client
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education
NEXT_PUBLIC_FIREBASE_DATABASE_ID=(default)

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx

# Upstash Redis
KV_REST_API_URL=https://xxxxx.upstash.io
KV_REST_API_TOKEN=xxxxx
```

### 5. 部署

```bash
# 一键部署
chmod +x deploy.sh
./deploy.sh
```

**或手动部署：**

```bash
docker-compose up -d --build
```

### 6. 验证部署

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试健康检查
curl http://localhost:3000/api/health
```

---

## 🌐 Cloudflare Tunnel 配置

### 方式一：使用 cloudflared（推荐）

#### 1. 安装 cloudflared

```bash
# Debian/Ubuntu
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 验证安装
cloudflared --version
```

#### 2. 登录 Cloudflare

```bash
cloudflared tunnel login
```

浏览器会打开，选择要使用的域名。

#### 3. 创建 Tunnel

```bash
# 创建 Tunnel
cloudflared tunnel create stregis

# 会生成一个 UUID，记录下来
# 例如: Created tunnel stregis with id 12345678-1234-1234-1234-123456789abc
```

#### 4. 创建配置文件

```bash
# 创建配置目录
mkdir -p ~/.cloudflared

# 创建配置文件
nano ~/.cloudflared/config.yml
```

**config.yml 内容：**

```yaml
tunnel: stregis
credentials-file: /root/.cloudflared/12345678-1234-1234-1234-123456789abc.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

#### 5. 配置 DNS

```bash
# 创建 DNS 记录（自动）
cloudflared tunnel route dns stregis your-domain.com
```

#### 6. 启动 Tunnel

```bash
# 测试运行
cloudflared tunnel run stregis

# 后台运行（使用 systemd）
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# 查看状态
sudo systemctl status cloudflared
```

### 方式二：Cloudflare Dashboard（更简单）

1. 登录 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. 进入 **Access** → **Tunnels**
3. 点击 **Create a tunnel**
4. 选择 **Cloudflared**
5. 输入名称：`stregis`
6. 按照指引在服务器安装 connector
7. 配置 Public Hostname：
   - **Subdomain**: `app` (或其他)
   - **Domain**: 选择你的域名
   - **Service**: `http://localhost:3000`
8. 保存

---

## 🔐 Google OAuth 配置

### 1. 添加授权域名

进入 [Google Cloud Console](https://console.cloud.google.com/)：

1. 选择项目 `borui-education`
2. 进入 **APIs & Services** → **Credentials**
3. 编辑 OAuth 2.0 Client ID
4. 添加 **Authorized redirect URIs**:
   ```
   https://your-domain.com/api/auth/callback/google
   ```
5. 保存

---

## 🔄 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh

# 或手动
docker-compose down
docker-compose up -d --build
```

---

## 📊 维护命令

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 进入容器
docker exec -it stregis-webapp sh

# 查看资源占用
docker stats stregis-webapp

# 清理未使用的镜像
docker system prune -a
```

---

## 🆘 故障排查

### 应用无法启动

```bash
# 查看完整日志
docker-compose logs --tail=100

# 检查环境变量
docker exec stregis-webapp printenv | grep FIREBASE

# 重启容器
docker-compose restart
```

### 健康检查失败

```bash
# 进入容器检查
docker exec -it stregis-webapp sh

# 测试端口
wget -O- http://localhost:3000/api/health

# 查看 Node.js 进程
ps aux | grep node
```

### Cloudflare Tunnel 无法连接

```bash
# 查看 cloudflared 日志
sudo journalctl -u cloudflared -f

# 重启 cloudflared
sudo systemctl restart cloudflared

# 检查配置
cloudflared tunnel info stregis
```

---

## ✅ 部署检查清单

```
服务器准备:
□ Docker 已安装
□ Docker Compose 已安装
□ 代码已克隆

环境配置:
□ .env 文件已创建
□ 所有环境变量已填写
□ Google OAuth 已配置

部署完成:
□ docker-compose ps 显示 healthy
□ curl http://localhost:3000/api/health 返回 200
□ Cloudflare Tunnel 已配置
□ 能通过域名访问
□ 登录功能正常
```

---

## 📞 获取帮助

如果遇到问题：
1. 查看 Docker 日志：`docker-compose logs -f`
2. 检查环境变量配置
3. 确认 Firestore 连接正常
4. 验证 Google OAuth 配置

---

**最后更新：** 2025-01-03  
**版本：** 1.0.0

