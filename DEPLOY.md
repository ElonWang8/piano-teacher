# PianoRecord 飞牛 NAS Docker 部署指南

## 前置条件

- 飞牛 OS + Docker
- NAS 上配好 GitHub SSH key 或 Personal Access Token（用于拉私有仓库）

```bash
# NAS 上生成 SSH key（如未配过）
ssh-keygen -t ed25519 -C "piano-teacher"
cat ~/.ssh/id_ed25519.pub
# 复制输出，添加到 https://github.com/settings/keys
```

---

## 部署（一条命令）

```bash
git clone git@github.com:ElonWang8/piano-teacher.git && cd piano-teacher && bash setup.sh
```

`setup.sh` 自动完成：生成密钥 → 创建目录 → 构建镜像 → 启动服务。

---

## 访问

```
http://NAS-IP:14387
```

---

## 更新代码

```bash
cd /vol1/1000/docker/piano-teacher
git pull
docker compose up -d --build
```

---

## Cloudflare Tunnel

服务地址填 `localhost:14387`，Tunnel 那边照常配即可。

## 数据备份

每天凌晨 2 点自动备份到 `./backups/` 目录。

**不要删除：** `data/` 和 `.env`，删了数据就没了。
