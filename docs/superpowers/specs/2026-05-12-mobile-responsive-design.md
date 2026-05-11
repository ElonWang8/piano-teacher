# 移动端响应式适配 — 设计规格

## 概述

将钢琴老师平台适配为响应式布局。桌面端保持侧边栏导航，手机端切换为底部 Tab 导航。所有页面、表单、Dialog 在手机上可用。

## 方案

**桌面（≥768px）：** 侧边栏 + 主内容区（现有布局）

**手机（<768px）：** 底部 5 Tab 导航（看板/记录/排课/学生/费用），顶部简洁标题栏

## 适配清单

### 1. 根布局 `layout.tsx`

- 添加 `useMediaQuery` 或 CSS 类检测屏幕宽度
- `md:flex-row` 桌面侧边栏布局
- `max-md:flex-col` 手机纵向布局
- 手机隐藏 Sidebar，显示 BottomNav
- 添加 `SessionProvider` 包裹（给移动端客户端组件用）

### 2. 新建 `BottomNav` 组件

`src/components/layout/bottom-nav.tsx`：
- 5 个 Tab：看板/记录/排课/学生/费用
- 固定在底部，`h-14` + `safe-area-inset-bottom`
- 当前路由高亮

### 3. 各页面响应式改造

**看板 (`page.tsx`)：**
- 统计卡片 `grid-cols-2 sm:grid-cols-3`，手机 2 列

**日历 (`calendar/page.tsx`)：**
- 桌面：左右布局（日历 + 课程列表）
- 手机：上下布局，日历紧凑显示，下方课程列表
- `flex-col lg:flex-row`

**课程记录、学生、费用、设置：**
- 搜索栏/筛选按钮堆叠
- Dialog 手机全屏：`max-md:h-[100dvh] max-md:max-w-full max-md:rounded-none`
- 表单 `grid-cols-1 sm:grid-cols-2`

### 4. Sidebar 桌面保留

Sidebar 不变，仅在 `md:hidden` 时隐藏。

### 5. 通用改进

- 按钮最小触控区域 44px
- 列表项间距增大（`py-3` → `py-4`）
- Dialog 关闭按钮更明显（左上角 ✕）

## 不涉及

- 不修改 API
- 不修改数据库
- 不新增业务逻辑

## 测试

- 浏览器 DevTools 模拟 iPhone SE / 12 Pro 测试各页面
- 确保所有按钮可点击、表单可填写、Dialog 可关闭
