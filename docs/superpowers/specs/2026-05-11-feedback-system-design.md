# 操作反馈与加载体验完善 — 设计规格

## 概述

为现有钢琴老师平台补充统一的操作反馈（Toast + 内联错误）、加载态（Skeleton）和空状态（EmptyState），提升整体用户体验。

## 技术方案

**方案 B：组件化** — 提取 4 个可复用组件 + 1 个 hook，保证一致性，改造 6 个现有页面。

### 新增文件

#### 1. `src/hooks/use-toast.ts`

封装 sonner toast，提供统一的中文 API：

```typescript
const toast = useToast();
toast.success("课程记录已保存");
toast.error("保存失败");
```

#### 2. `src/components/ui/skeleton.tsx`

三种预设形状的加载骨架屏：

- `type="card"` — 卡片形（含圆形头像 + 两行文字）
- `type="table-row"` — 表格行（长条形）
- `type="form"` — 表单（多个输入框占位）

Props: `type`, `count`（重复数量，默认 3）

#### 3. `src/components/ui/empty-state.tsx`

统一空状态组件：

- `icon` — Lucide 图标（可选，默认无）
- `title` — 标题（必填）
- `description` — 引导描述（可选）
- `action` — 操作按钮/元素（可选）

#### 4. `src/components/ui/error-message.tsx`

内联错误提示：红底 + 左侧红色强调线 + 错误图标。

Props: `message`（必填）

### 修改文件

6 个页面统一改造模式：

| 页面 | 骨架屏 | 空状态 | Toast | 内联错误 | 额外 |
|------|--------|--------|-------|----------|------|
| `page.tsx` (看板) | ✅ stats 卡片 | ✅ 无记录 | — | — | — |
| `lessons/page.tsx` | ✅ 卡片列表 | ✅ 引导 + 按钮 | 保存后 | 表单校验 | loading 按钮 |
| `students/page.tsx` | ✅ 卡片列表 | ✅ 引导 + 按钮 | 添加/删除后 | — | 删除确认弹窗 |
| `students/[id]/page.tsx` | ✅ 详情页 | — | 编辑后 | — | — |
| `calendar/page.tsx` | ✅ 日历 | ✅ 无排课 | 添加后 | 表单校验 | loading 按钮 |
| `payments/page.tsx` | ✅ 卡片列表 | ✅ 引导 + 按钮 | 缴费后 | 表单校验 | loading 按钮 |

## 实现细节

### Toast 调用位置

- API 请求成功后：`toast.success(...)`
- API 请求失败后（catch）：`toast.error(...)`
- 删除操作：加入确认弹窗，确认后 toast

### 骨架屏替换逻辑

```
if (loading) → <Skeleton type="card" count={3} />
else if (data.length === 0) → <EmptyState ... />
else → 正常列表
```

### 表单内联错误

- 前端校验失败 → `<ErrorMessage message="..." />` 显示在表单顶部
- API 返回 4xx/5xx → 同时 toast.error + ErrorMessage

## 测试策略

- 组件测试：Skeleton、EmptyState、ErrorMessage 渲染测试
- E2E 测试：课程记录表单校验 → 内联错误出现 → 填写正确 → Toast 成功
