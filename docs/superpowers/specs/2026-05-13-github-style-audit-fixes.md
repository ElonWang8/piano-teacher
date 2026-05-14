# GitHub 风格改造 + 审查修复 — 设计规格

## 一、GitHub 风格 UI

### 色彩系统
- 顶栏：`#24292e`（GitHub 暗色 header）
- 主背景：`#f6f8fa`（GitHub 灰底）
- 侧边栏/卡片：`white` + `1px solid #d0d7de`
- 主按钮：`#2da44e`（GitHub 绿）
- 选中态：左边条 `#0969da` + 浅蓝底 `#ddf4ff`
- 字色：主 `#1f2328`，次 `#656d76`

### 组件变更
1. **顶栏** — 新建 `src/components/layout/header.tsx`，暗色背景，Logo + 用户头像
2. **侧边栏** — 白色背景，圆角6px，蓝色左边条选中指示
3. **卡片** — 白色 bg + `border: 1px solid #d0d7de` + `border-radius: 6px`
4. **按钮** — 主操作绿色 `#2da44e`，次要灰底 `#f6f8fa` + 边框
5. **Badge** — 标签风格：蓝色(待上课) / 绿色(已签到) / 红色(旷课) / 灰色(请假)
6. **移动端** — 底部导航保留，适配颜色

### 实现方式
修改 `globals.css` 中的 CSS 变量，全站生效。

## 二、14 项审查修复

详见审查报告。关键项：
1. BACKUP_SECRET 随机化 + Authorization header
2. AUTH_SECRET 强制设置
3. React render 反模式修复
4. Dialog 移动端样式统一
5. ConfirmDialog 替代 window.confirm
6. 设置页假保存
7. aria-label
8. API 集成测试
9. 看板拆分
10. 类型统一

## 三、手机端兼容

所有 GitHub 风格改造必须通过 `md:` 断点适配移动端。底部导航保持。
