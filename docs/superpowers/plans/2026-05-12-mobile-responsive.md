# 移动端响应式适配 实现计划

> **面向 AI 代理的工作者：** 步骤使用复选框（`- [ ]`）语法跟踪进度。

**目标：** 为平台添加响应式布局，桌面保留侧边栏、手机切换底部 Tab 导航。

**架构：** 纯 Tailwind CSS 响应式改造。`md:` 断点（768px）为界：≥768px 桌面侧边栏，<768px 手机底部 Tab。新增 BottomNav 组件，改造 layout + 6 个页面。

**技术栈：** Tailwind CSS v4, React, next/navigation

---

### 任务 1：创建 BottomNav 组件

**文件：**
- 创建：`src/components/layout/bottom-nav.tsx`

- [ ] **步骤 1：创建底部导航组件**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Calendar, Users, CreditCard } from "lucide-react";

const tabs = [
  { href: "/", label: "看板", icon: BarChart3 },
  { href: "/lessons", label: "记录", icon: BookOpen },
  { href: "/calendar", label: "排课", icon: Calendar },
  { href: "/students", label: "学生", icon: Users },
  { href: "/payments", label: "费用", icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden pb-safe">
      <div className="flex h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **步骤 2：验证并提交**

```bash
npx tsc --noEmit
git add src/components/layout/bottom-nav.tsx
git commit -m "feat: add BottomNav component for mobile"
```

---

### 任务 2：改造根布局 + Sidebar

**文件：**
- 修改：`src/app/layout.tsx`
- 修改：`src/components/layout/sidebar.tsx`

- [ ] **步骤 1：layout.tsx 响应式改造**

关键改动：
- 桌面：`flex-row` 侧边栏 + main
- 手机：`flex-col` main + BottomNav
- body 加 `pb-14 md:pb-0`（手机给底部导航留空间）
- 导入 `BottomNav` + `SessionProvider`
- Sidebar 加 `hidden md:flex`

```tsx
// 在 layout.tsx 中
import { BottomNav } from "@/components/layout/bottom-nav";
import { SessionProvider } from "next-auth/react";

// body 改为：
<body className="min-h-full flex flex-col pb-14 md:pb-0">
  <SessionProvider>
    {session?.user ? (
      <div className="flex h-screen">
        <Sidebar /> {/* 内部加 hidden md:flex */}
        <main className="flex-1 overflow-auto p-3 md:p-6">{children}</main>
      </div>
    ) : (
      <main className="min-h-screen">{children}</main>
    )}
    {session?.user && <BottomNav />}
    <Toaster />
  </SessionProvider>
</body>
```

- [ ] **步骤 2：Sidebar 加响应式隐藏**

在 Sidebar 的 `<aside>` 标签加 `hidden md:flex`：
```tsx
<aside className="hidden md:flex w-56 h-screen bg-card border-r flex-col">
```

- [ ] **步骤 3：验证并提交**

```bash
npx tsc --noEmit
git add src/app/layout.tsx src/components/layout/sidebar.tsx
git commit -m "feat: add responsive layout with mobile bottom nav"
```

---

### 任务 3：看板页面响应式

**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：响应式网格**

改动：
- 今日概览 3 卡片：`grid-cols-2 sm:grid-cols-3`
- 本月概览 4 卡片：`grid-cols-2 sm:grid-cols-4`
- 间距：`gap-3 md:gap-4`
- 标题字号：`text-xl md:text-2xl`
- 数值字号：`text-xl md:text-2xl`

- [ ] **步骤 2：验证并提交**

```bash
npx tsc --noEmit
git add src/app/page.tsx
git commit -m "feat: responsive dashboard grid for mobile"
```

---

### 任务 4：日历页面响应式

**文件：**
- 修改：`src/app/calendar/page.tsx`

- [ ] **步骤 1：上下布局 + Dialog 全屏**

改动：
- 桌面 `flex-row` → 手机 `flex-col`
- 日历网格紧凑：`text-xs`、`p-1`
- 课程列表占满宽度
- Dialog 手机全屏：`max-md:!max-w-full max-md:!h-dvh max-md:!rounded-none max-md:m-0`
- 底部操作按钮 `sticky bottom-0 bg-background p-3 border-t`

- [ ] **步骤 2：验证并提交**

```bash
npx tsc --noEmit
git add src/app/calendar/page.tsx
git commit -m "feat: responsive calendar layout for mobile"
```

---

### 任务 5：其余页面响应式

**文件：**
- 修改：`src/app/lessons/page.tsx`
- 修改：`src/app/students/page.tsx`
- 修改：`src/app/students/[id]/page.tsx`
- 修改：`src/app/payments/page.tsx`
- 修改：`src/app/settings/page.tsx`
- 修改：`src/app/login/page.tsx`
- 修改：`src/app/register/page.tsx`

- [ ] **步骤 1：批量响应式改造**

每个页面统一改动：
1. 标题 `text-xl md:text-2xl`
2. 工具栏 `flex-col sm:flex-row gap-2`
3. Dialog `max-md:!max-w-full max-md:!h-dvh max-md:!rounded-none`
4. 表单网格 `grid-cols-1 sm:grid-cols-2`
5. Card 间距 `gap-2 md:gap-3`
6. 按钮触控 `min-h-[44px]`

登录/注册页：Card `mx-4`，移动端自适应。

- [ ] **步骤 2：验证并提交**

```bash
npx tsc --noEmit
git add src/app/lessons/ src/app/students/ src/app/payments/ src/app/settings/ src/app/login/ src/app/register/
git commit -m "feat: responsive pages — lessons, students, payments, settings, auth"
```

---

### 任务 6：最终验证

- [ ] **步骤 1：TypeScript 检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 2：运行测试**

```bash
npx vitest run
```
预期：17 tests PASS

- [ ] **步骤 3：Dev server + 手动测试**

```bash
npm run dev
# Chrome DevTools → iPhone SE 模式测试各页面
# 确认底部 Tab 显示、Dialog 全屏、表单可用
```

- [ ] **步骤 4：Commit**

```bash
git add .
git commit -m "chore: final mobile responsive verification"
```
