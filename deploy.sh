#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 St Regis 学生管理系统 - Docker 部署${NC}\n"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env 文件不存在${NC}"
    echo -e "${YELLOW}📝 请从 .env.example 复制并填写环境变量：${NC}"
    echo -e "   cp .env.example .env"
    echo -e "   nano .env"
    exit 1
fi

# 拉取最新代码
echo -e "${GREEN}📥 拉取最新代码...${NC}"
if [ -d .git ]; then
    git pull origin main || true
fi

# 停止旧容器
echo -e "${GREEN}🛑 停止旧容器...${NC}"
docker-compose down || true

# 构建镜像
echo -e "${GREEN}🔨 构建 Docker 镜像...${NC}"
docker-compose build --no-cache

# 启动服务
echo -e "${GREEN}🚀 启动服务...${NC}"
docker-compose up -d

# 等待服务启动
echo -e "${GREEN}⏳ 等待服务启动...${NC}"
sleep 10

# 检查健康状态
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        echo -e "\n${GREEN}✅ 部署成功！${NC}\n"
        echo -e "${GREEN}📍 本地访问: http://localhost:3000${NC}"
        echo -e "${YELLOW}💡 使用 Cloudflare Tunnel 映射端口到公网${NC}\n"
        echo -e "${GREEN}常用命令:${NC}"
        echo -e "  查看日志: docker-compose logs -f"
        echo -e "  重启服务: docker-compose restart"
        echo -e "  停止服务: docker-compose down"
        exit 0
    fi
    echo "等待中... ($i/10)"
    sleep 3
done

echo -e "${RED}❌ 健康检查失败${NC}"
echo -e "查看日志: docker-compose logs"
exit 1
