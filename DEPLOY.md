# PianoRecord 飞牛 NAS Docker 部署指南

## 环境要求

- 飞牛 OS（或任何 Linux NAS，支持 Docker）
- Docker 已安装
- 2GB 可用空间

---

## 第一步：上传项目到 NAS

```bash
# Mac 上打包（已完成）
scp piano-teacher.tar.gz root@你的NAS-IP:/vol1/1000/docker/

# SSH 到 NAS
ssh root@你的NAS-IP
cd /vol1/1000/docker
tar -xzf piano-teacher.tar.gz
cd piano-teacher  # 如果解压到了子目录
```

## 第二步：一键部署

```bash
chmod +x setup.sh
bash setup.sh
```

`setup.sh` 会自动：
1. 生成随机 `AUTH_SECRET` 和 `BACKUP_SECRET`，写入 `.env`
2. 创建 `data/`（数据库）和 `backups/`（备份）目录
3. 构建 Docker 镜像并启动

## 第三步：访问

```
http://你的NAS-IP:14387
```

首次打开注册账号即可使用。

---

## 日常管理

```bash
# 查看日志
docker logs piano-teacher

# 重启
docker compose restart

# 停止
docker compose down

# 更新代码后重新构建
docker compose up -d --build

# 查看备份
ls -la backups/
```

## 数据位置

| 数据 | 路径 |
|------|------|
| 数据库 | `./data/dev.db`（SQLite） |
| 备份 | `./backups/backup-YYYY-MM-DD.json`（每天凌晨2点） |
| 密钥 | `./.env`（AUTH_SECRET + BACKUP_SECRET） |

**重要：** `data/` 和 `.env` 不可删除，否则数据丢失。

---

## 端口说明

| 端口 | 用途 |
|------|------|
| 14387 | 应用 HTTP 端口 |
| 3000 | 容器内部端口（不对外暴露） |

修改端口：编辑 `docker-compose.yml` 中的 `"14387:3000"`。

---

## Cloudflare Tunnel（假设你已安装 cloudflared）

```bash
# 创建 Tunnel
cloudflared tunnel create piano-teacher

# 配置 DNS
cloudflared tunnel route dns piano-teacher piano.yourdomain.com

# 配置文件 ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: piano.yourdomain.com
    service: http://localhost:14387
  - service: http_status:404

# 启动 Tunnel
cloudflared tunnel run piano-teacher
```

---

## 安全提醒

- `.env` 文件包含密钥，不要上传到 GitHub
- 首次部署后建议备份 `data/` 目录
- 如果通过 Cloudflare Tunnel 暴露公网，确保 AUTH_SECRET 已正确生成
