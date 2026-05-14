#!/bin/sh
# PianoRecord NAS 部署脚本 — 首次运行
set -e

echo "=== PianoRecord 部署脚本 ==="

# 生成随机密钥（如果还没有）
if [ ! -f .env ]; then
  echo "生成 AUTH_SECRET 和 BACKUP_SECRET..."
  echo "AUTH_SECRET=$(openssl rand -base64 32)" > .env
  echo "BACKUP_SECRET=$(openssl rand -base64 32)" >> .env
  echo "✅ .env 文件已创建"
else
  echo "✅ .env 已存在，跳过"
fi

# 创建数据目录
mkdir -p data backups

# 构建并启动
echo ""
echo "=== 构建 Docker 镜像并启动 ==="
docker compose up -d --build

echo ""
echo "=== 部署完成 ==="
echo "访问: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '你的NAS-IP'):14387"
