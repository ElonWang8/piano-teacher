# 钢琴老师课程记录平台 — 设计规格

## 概述

面向钢琴老师的 SaaS 课程记录与管理平台（Web 应用），帮助老师管理学生、记录课程、排课、追踪费用。

## 技术栈

- **框架**：Next.js 14+ (App Router)
- **前端**：React + Tailwind CSS + shadcn/ui
- **ORM**：Prisma + PostgreSQL
- **认证**：NextAuth.js（邮箱 + 密码登录）
- **部署**：Vercel

## 信息架构

侧边栏导航，按功能模块组织：

- 📋 课程记录 — 新增/查看上课记录
- 👨‍🎓 学生管理 — 学生列表、详情、添加
- 📅 排课日历 — 月视图日历 + 当日课程列表
- 💰 费用管理 — 缴费记录、消课记录
- 📊 数据统计 — 收入、课时、出勤率等
- ⚙️ 设置 — 个人资料、偏好设置

## 页面设计

### 首页/看板

上半部分：今日概览（今日课程数、待记录、今日收入）
下半部分：本月统计（本月课时、收入、学生数、出勤率）+ 最近记录

### 课程记录页

- 新增记录：纵向表单 — 选择学生 → 日期 → 时间 → 时长（默认45分钟）→ 曲目/练习 → 掌握情况 → 作业 → 保存
- 记录列表：按日期倒序，支持按学生筛选

### 学生管理页

- 学生列表：头像、姓名、阶段、剩余课时、最近上课日期
- 学生详情（Tab 标签页）：
  - 课程记录 Tab — 该生所有上课历史
  - 学习进度 Tab — 学习历程概览
  - 费用 Tab — 缴费记录 + 消课记录 + 剩余课时
  - 信息 Tab — 基本信息编辑

### 排课日历页

- 月视图日历，日期格显示当天课程数
- 选中日期后下方显示当日课程列表
- 每节课卡片：时间、学生名、状态标签（待上课/已上课/待记录）
- 添加排课按钮

### 费用管理页

- 缴费记录列表 + 新增缴费（学生、金额、课时数、日期、备注）
- 消课记录列表（自动生成 + 手动调整）

## 数据模型

### User
- id, name, email, passwordHash, phone?, createdAt

### Student
- id, userId (FK), name, age?, parentPhone?, startDate?, level?, notes?
- remainingLessons（计算字段：缴费总课时 - 已消课时）
- createdAt

### Lesson
- id, studentId (FK), date, startTime, durationMinutes (default 45)
- repertoire（曲目/练习内容）
- notes（掌握情况/备注）
- homework（作业）
- status: ATTENDED | ABSENT | LEAVE
- createdAt

### Payment
- id, studentId (FK), date, amount, lessonCount, notes?
- createdAt

## 核心业务逻辑

### 消课规则
- 课程记录状态标记为 ATTENDED 时，自动扣除该学生 1 课时
- ABSENT（旷课）和 LEAVE（请假）不扣课时
- 剩余课时 = 所有 Payment.lessonCount 之和 - 所有 ATTENDED 状态 Lesson 数

### 排课规则
- 排课独立于课程记录，支持重复规则（每周六 14:00）
- 上课后从排课创建对应的课程记录

## 错误处理

- 表单校验：必填字段提示（学生、日期、时间）
- 缴费金额 > 0 校验
- 剩余课时不足时排课提醒
- 网络错误统一 Toast 提示

## 测试策略

- 单元测试：消课逻辑、剩余课时计算
- 组件测试：核心表单提交、Tab 切换
- E2E 测试：课程记录流程、缴费流程
