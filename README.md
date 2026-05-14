# PianoRecord - 钢琴老师课程记录

面向钢琴老师的课程管理与教学记录平台。支持学生管理、排课签到、费用追踪、学琴历程时间线。

## 特性

- 学生管理（在读/毕业/肄业状态筛选）
- 排课日历 + 批量排课（日期范围 + 星期选择）
- 上课签到/请假 + 曲目/备注/作业记录
- 费用管理（缴费记录 + 消课追踪）
- 学琴历程时间线（进度概览 + 阶段统计 + 分月记录）
- AI 整理上课记录（大白话 → 专业钢琴教学术语）
- 中国法定节假日 + 调休标注
- 5 套 UI 主题切换
- 响应式设计（桌面端 + 手机端）
- 数据 JSON 导出导入 + 定时备份
- Bark 推送通知

## 技术栈

Next.js 16 · TypeScript · Prisma · SQLite · Tailwind CSS · NextAuth v5 · Docker

## 本地开发

```bash
git clone https://github.com/ElonWang8/piano-teacher.git
cd piano-teacher
npm install
npx prisma generate
npx prisma db push
npm run dev
```

打开 http://localhost:3000 注册账号即可。

## Docker 部署

参见 [DEPLOY.md](./DEPLOY.md)

```bash
git clone https://github.com/ElonWang8/piano-teacher.git
cd piano-teacher
bash setup.sh
```

## 开源协议

MIT

## 作者

ElonWang8
