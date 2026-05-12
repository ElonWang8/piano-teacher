# 操作反馈与加载体验完善 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为现有钢琴老师平台添加统一的操作反馈（Toast）、加载态（Skeleton）、空状态（EmptyState）和内联错误提示（ErrorMessage），改造 6 个页面。

**架构：** 提取 4 个可复用组件 + 1 个 hook，保持一致性。sonner 已在项目中使用，直接封装。组件位于 `src/components/ui/`，hook 位于 `src/hooks/`。

**技术栈：** React, TypeScript, sonner (toast), lucide-react (icons), Tailwind CSS

---

### 任务 1：创建 useToast hook

**文件：**
- 创建：`src/hooks/use-toast.ts`

- [ ] **步骤 1：编写 hook**

`src/hooks/use-toast.ts`：
```typescript
"use client";

import { toast as sonner } from "sonner";

export function useToast() {
  return {
    success: (message: string) => sonner.success(message),
    error: (message: string) => sonner.error(message),
  };
}
```

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/hooks/use-toast.ts
git commit -m "feat: add useToast hook wrapping sonner"
```

---

### 任务 2：创建 Skeleton 组件

**文件：**
- 创建：`src/components/ui/skeleton.tsx`

- [ ] **步骤 1：编写 Skeleton 组件**

`src/components/ui/skeleton.tsx`：
```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  type: "card" | "table-row" | "form";
  count?: number;
  className?: string;
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="h-4 bg-muted rounded flex-1" />
      <div className="h-4 bg-muted rounded w-20" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="h-10 bg-muted rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-10 bg-muted rounded w-1/3" />
    </div>
  );
}

export function Skeleton({ type, count = 3, className }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((i) => {
        switch (type) {
          case "card":
            return <CardSkeleton key={i} />;
          case "table-row":
            return <TableRowSkeleton key={i} />;
          case "form":
            return <FormSkeleton key={i} />;
        }
      })}
    </div>
  );
}
```

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/ui/skeleton.tsx
git commit -m "feat: add Skeleton component with card/table-row/form presets"
```

---

### 任务 3：创建 EmptyState 组件

**文件：**
- 创建：`src/components/ui/empty-state.tsx`

- [ ] **步骤 1：编写 EmptyState 组件**

`src/components/ui/empty-state.tsx`：
```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
```

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/ui/empty-state.tsx
git commit -m "feat: add EmptyState component"
```

---

### 任务 4：创建 ErrorMessage 组件

**文件：**
- 创建：`src/components/ui/error-message.tsx`

- [ ] **步骤 1：编写 ErrorMessage 组件**

`src/components/ui/error-message.tsx`：
```tsx
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
```

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/components/ui/error-message.tsx
git commit -m "feat: add ErrorMessage component"
```

---

### 任务 5：改造课程记录页面

**文件：**
- 修改：`src/app/lessons/page.tsx`

- [ ] **步骤 1：改造要点**

在 `src/app/lessons/page.tsx` 中：

1. 添加 imports：`useToast`, `Skeleton`, `EmptyState`, `ErrorMessage`, `BookOpen` icon
2. 添加 `loading` state，初始 `true`
3. fetch 数据前后设置 `[loading, setLoading]`
4. 加载中显示 `<Skeleton type="card" count={3} />`
5. 空数据显示 `<EmptyState icon={<BookOpen />} title="暂无课程记录" description="点击右上角「新增记录」开始记录第一节课" />`
6. 表单顶部添加 `error` state + `<ErrorMessage message={error} />`
7. 提交前表单校验（studentId 和 date 为空 → setError）
8. 提交成功后 `toast.success("课程记录已保存")`，catch 后 `toast.error`
9. 按钮 loading 态（`disabled={loading}` + "保存中..."）

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/lessons/page.tsx
git commit -m "feat: add feedback states to lessons page"
```

---

### 任务 6：改造学生列表页面

**文件：**
- 修改：`src/app/students/page.tsx`

- [ ] **步骤 1：改造要点**

在 `src/app/students/page.tsx` 中：

1. 添加 imports：`useToast`, `Skeleton`, `EmptyState`, `Users` icon
2. 添加 `loading` state
3. 加载中显示 `<Skeleton type="card" count={3} />`
4. 空数据显示 `<EmptyState icon={<Users />} title="暂无学生" description="点击右上角「添加学生」录入第一个学生" />`
5. 添加删除确认（用 `confirm()` 简化：`if (!confirm("确定删除该学生？")) return;`）
6. 添加/删除后 `toast.success(...)`，失败 `toast.error(...)`

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/students/page.tsx
git commit -m "feat: add feedback states to students list page"
```

---

### 任务 7：改造学生详情页

**文件：**
- 修改：`src/app/students/[id]/page.tsx`

- [ ] **步骤 1：改造要点**

1. 添加 imports：`useToast`, `Skeleton`
2. 添加 `loading` state（初始 `true`，fetch 后 `false`）
3. 加载中显示 `<Skeleton type="form" count={1} />`
4. 编辑保存成功 `toast.success("学生信息已更新")`

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/students/\[id\]/page.tsx
git commit -m "feat: add feedback states to student detail page"
```

---

### 任务 8：改造排课日历页面

**文件：**
- 修改：`src/app/calendar/page.tsx`

- [ ] **步骤 1：改造要点**

1. 添加 imports：`useToast`, `Skeleton`, `EmptyState`, `ErrorMessage`, `Calendar` icon
2. 日历加载骨架屏：`<Skeleton type="card" count={1} />` 包裹日历区域
3. 空排课列表：`<EmptyState icon={<Calendar />} title="暂无排课" description="点击右上角「添加排课」安排课程" />`
4. 添加排课表单：校验 + `<ErrorMessage />` + toast

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/calendar/page.tsx
git commit -m "feat: add feedback states to calendar page"
```

---

### 任务 9：改造费用管理页面

**文件：**
- 修改：`src/app/payments/page.tsx`

- [ ] **步骤 1：改造要点**

1. 添加 imports：`useToast`, `Skeleton`, `EmptyState`, `ErrorMessage`, `CreditCard` icon
2. 加载中显示骨架屏
3. 空状态 + 引导
4. 表单校验（金额、课时数 > 0）+ `<ErrorMessage />`
5. 保存成功/失败 toast

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/payments/page.tsx
git commit -m "feat: add feedback states to payments page"
```

---

### 任务 10：改造看板页面

**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：改造要点**

1. 添加 imports：`Skeleton`, `EmptyState`, `BarChart3` icon
2. 加载中显示统计卡片骨架屏 + 列表骨架屏
3. 空数据统一使用 EmptyState

- [ ] **步骤 2：验证 TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add loading and empty states to dashboard"
```

---

### 任务 11：组件单元测试

**文件：**
- 创建：`src/__tests__/components.test.tsx`

- [ ] **步骤 1：编写测试**

`src/__tests__/components.test.tsx`：
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="暂无" description="请先添加" />);
    expect(screen.getByText("请先添加")).toBeDefined();
  });

  it("renders icon when provided", () => {
    render(<EmptyState icon={<BookOpen data-testid="icon" />} title="暂无" />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });
});

describe("ErrorMessage", () => {
  it("renders message", () => {
    render(<ErrorMessage message="出错了" />);
    expect(screen.getByText("出错了")).toBeDefined();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Skeleton", () => {
  it("renders correct count of card skeletons", () => {
    const { container } = render(<Skeleton type="card" count={2} />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBe(2);
  });

  it("renders table-row skeleton", () => {
    const { container } = render(<Skeleton type="table-row" count={1} />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });
});
```

- [ ] **步骤 2：安装依赖并运行**

```bash
npm install -D @testing-library/react @testing-library/jest-dom jsdom
npx vitest run
```

预期：7 个测试 PASS

- [ ] **步骤 3：Commit**

```bash
git add src/__tests__/components.test.tsx
git commit -m "test: add component unit tests for EmptyState, ErrorMessage, Skeleton"
```

---

### 任务 12：最终验证

- [ ] **步骤 1：TypeScript 类型检查**

```bash
npx tsc --noEmit
```
预期：零错误

- [ ] **步骤 2：全部单元测试**

```bash
npx vitest run
```
预期：14 tests PASS（7 原有 + 7 新增）

- [ ] **步骤 3：验证 dev server 可启动**

```bash
npm run dev
# 访问 localhost:3000 确认正常
```

- [ ] **步骤 4：Commit**

```bash
git add .
git commit -m "chore: final verification — all tests pass, tsc clean"
```
