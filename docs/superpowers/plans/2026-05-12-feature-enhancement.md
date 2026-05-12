# 功能增强 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。

**目标：** 修复 Select 学生名显示 bug、批量排课、日历签到/请假/编辑、课程记录 Tab + 编辑、学生状态筛选

**架构：** 在现有 Next.js + Prisma 代码基础上修改。Student 表加 status 字段，Schedule 表用于未上课数据源，Lesson 表存已上课记录。日历和课程记录页面重构交互。

**技术栈：** Next.js 16, TypeScript, Prisma 5, SQLite, shadcn/ui v4 (@base-ui/react), date-fns, sonner

---

### 任务 1：Student 表加 status 字段

**文件：**
- 修改：`prisma/schema.prisma`
- 修改：`src/app/api/students/route.ts`

- [ ] **步骤 1：数据库迁移**

在 `prisma/schema.prisma` 的 Student model 中添加：
```prisma
status String @default("ACTIVE")
```

```bash
npx prisma db push
npx prisma generate
```

- [ ] **步骤 2：更新学生 API 支持 status 筛选**

修改 `src/app/api/students/route.ts` 的 GET：
```typescript
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const students = await db.student.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    include: { payments: true, _count: { select: { lessons: true } } },
    orderBy: { createdAt: "desc" },
  });
  // ... rest unchanged
}
```

同时在 POST 中支持 status 字段：
```typescript
const { name, age, parentPhone, startDate, level, notes, status } = body;
// ...
data: {
  // ... existing fields
  status: status || "ACTIVE",
}
```

- [ ] **步骤 3：更新单个学生 API**

修改 `src/app/api/students/[id]/route.ts` 的 PUT，支持 status 更新。

- [ ] **步骤 4：Commit**

```bash
git add prisma/schema.prisma src/app/api/students/
git commit -m "feat: add student status field (ACTIVE/GRADUATED/DROPPED) with filter API"
```

---

### 任务 2：学生页面加状态筛选

**文件：**
- 修改：`src/app/students/page.tsx`
- 修改：`src/components/students/student-form.tsx`
- 修改：`src/app/students/[id]/page.tsx`

- [ ] **步骤 1：student-form 加状态选择**

在 `StudentForm` 中添加状态 Select（在读/毕业/肄业），默认"在读"。props 类型增加 `status?: string`。

- [ ] **步骤 2：学生列表页加筛选栏**

`students/page.tsx` 顶部加状态筛选 chips：全部 / 在读 / 毕业 / 肄业。默认选中"在读"。fetch 时传 `?status=ACTIVE`（全部时不传）。

- [ ] **步骤 3：学生详情页显示状态**

在信息 Tab 中显示学生状态，支持编辑时修改。

- [ ] **步骤 4：验证并提交**

```bash
npx tsc --noEmit
git add src/app/students/ src/components/students/
git commit -m "feat: add student status filter and form field"
```

---

### 任务 3：修复 Select 学生名显示 bug

**文件：**
- 修改：`src/app/calendar/page.tsx`

**问题：** @base-ui/react 的 `Select.Value` 默认渲染 value（ID），非 children（name）。

**修复：** 用 state + 手动查找替代 SelectValue 文本显示。在 Select 外层显示已选名称：

```tsx
const selectedStudentName = students.find(s => s.id === formStudentId)?.name;

// 在 SelectTrigger 中：
<SelectTrigger>
  <span>{selectedStudentName || "选择学生"}</span>
</SelectTrigger>
```

同时修复课程记录页和费用管理页的同样问题。

- [ ] **步骤 2：全局修复所有 Select 显示**

检查所有页面使用 `<SelectValue placeholder="...">` 的地方，统一改为手动渲染文本。

- [ ] **步骤 3：验证并提交**

```bash
npx tsc --noEmit
git add src/app/calendar/ src/app/lessons/ src/app/payments/
git commit -m "fix: select shows student name instead of cuid"
```

---

### 任务 4：批量排课

**文件：**
- 修改：`src/app/calendar/page.tsx`
- 创建：`src/app/api/schedules/batch/route.ts`

- [ ] **步骤 1：创建批量排课 API**

`src/app/api/schedules/batch/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, startDate, endDate, weekdays, startTime, durationMinutes } = body;

  if (!studentId || !startDate || !endDate || !weekdays?.length) {
    return NextResponse.json({ error: "请填写必填字段" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  // 计算匹配的日期
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    const dayOfWeek = cursor.getDay(); // 0=Sun, ..., 6=Sat
    if (weekdays.includes(dayOfWeek)) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // 批量创建
  const created = await db.schedule.createMany({
    data: dates.map(d => ({
      studentId,
      date: d,
      startTime: startTime || "18:00",
      durationMinutes: durationMinutes || 45,
    })),
  });

  return NextResponse.json({ count: created.count, dates: dates.map(d => d.toISOString().split("T")[0]) });
}
```

- [ ] **步骤 2：日历页面加批量排课 Dialog**

在 CalendarPage 中添加 `batchOpen` state 和批量排课 Dialog：
- 学生 Select
- 开始/结束日期 Input
- 星期多选 toggle buttons（一~日）
- 时间 + 时长
- 实时计算预览："预计生成 N 节课"
- 提交后 toast.success，刷新日历

- [ ] **步骤 3：验证并提交**

```bash
npx tsc --noEmit
git add src/app/calendar/ src/app/api/schedules/batch/
git commit -m "feat: add batch scheduling with date range and weekday selection"
```

---

### 任务 5：日历课程签到/请假/编辑

**文件：**
- 修改：`src/app/calendar/page.tsx`
- 创建：`src/app/api/schedules/[id]/route.ts`

- [ ] **步骤 1：创建排课签到/请假 API**

`src/app/api/schedules/[id]/route.ts`：
```typescript
// PUT: 签到或请假 — 创建 Lesson 记录，删除 Schedule
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const schedule = await db.schedule.findFirst({
    where: { id, student: { userId: session.user.id } },
    include: { student: true },
  });
  if (!schedule) return NextResponse.json({ error: "排课不存在" }, { status: 404 });

  const body = await req.json();
  const { action } = body; // "ATTEND" | "LEAVE"

  // 创建课程记录
  const lesson = await db.lesson.create({
    data: {
      studentId: schedule.studentId,
      date: schedule.date,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
      status: action === "ATTEND" ? "ATTENDED" : "LEAVE",
    },
  });

  // 删除排课
  await db.schedule.delete({ where: { id } });

  return NextResponse.json(lesson);
}

// DELETE: 编辑 — 删除排课
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const schedule = await db.schedule.findFirst({
    where: { id, student: { userId: session.user.id } },
  });
  if (!schedule) return NextResponse.json({ error: "排课不存在" }, { status: 404 });

  await db.schedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **步骤 2：日历课程卡片加操作按钮**

在选中日期的课程列表中，每张卡片添加：
- 签到按钮（调用 PUT `{ action: "ATTEND" }`）→ toast.success → 刷新
- 请假按钮（调用 PUT `{ action: "LEAVE" }`）→ toast.success → 刷新  
- 编辑按钮 → Dialog 修改时间/学生 → 调用删除+创建新的

- [ ] **步骤 3：验证并提交**

```bash
npx tsc --noEmit
git add src/app/calendar/ src/app/api/schedules/
git commit -m "feat: add check-in, leave, and edit actions to calendar lessons"
```

---

### 任务 6：课程记录 Tab + 编辑

**文件：**
- 修改：`src/app/lessons/page.tsx`
- 修改：`src/app/api/lessons/[id]/route.ts`（如不存在则创建）

- [ ] **步骤 1：课程记录页拆分为两个 Tab**

改造 `lessons/page.tsx`：
- Tab「未上课」：fetch `/api/schedules`，显示待签到课程列表
- Tab「已上课」：fetch `/api/lessons`（现有），显示已上课/请假/旷课记录
- 未上课列表每项有"签到"/"请假"按钮，调用 schedules API
- 已上课列表每项有"编辑"按钮，Dialog 可修改曲目/备注/作业/状态

- [ ] **步骤 2：课程记录编辑 API**

创建/修改 `src/app/api/lessons/[id]/route.ts`：
```typescript
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { repertoire, notes, homework, status, startTime, durationMinutes } = body;

  const lesson = await db.lesson.findFirst({
    where: { id, student: { userId: session.user.id } },
  });
  if (!lesson) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const updated = await db.lesson.update({
    where: { id },
    data: { repertoire, notes, homework, status, startTime, durationMinutes },
  });
  return NextResponse.json(updated);
}
```

- [ ] **步骤 3：验证并提交**

```bash
npx tsc --noEmit
git add src/app/lessons/ src/app/api/lessons/
git commit -m "feat: split lessons into tabs, add edit functionality"
```

---

### 任务 7：更新测试

**文件：**
- 修改：`src/__tests__/lessons.test.ts`
- 创建：`src/__tests__/batch-schedule.test.ts`

- [ ] **步骤 1：加批量排课日期计算测试**

```typescript
import { describe, it, expect } from "vitest";

function calculateBatchDates(startDate: string, endDate: string, weekdays: number[]): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

describe("calculateBatchDates", () => {
  it("returns Saturdays in May 2026", () => {
    const result = calculateBatchDates("2026-05-01", "2026-05-31", [6]);
    expect(result).toEqual(["2026-05-02", "2026-05-09", "2026-05-16", "2026-05-23", "2026-05-30"]);
  });

  it("returns Mon+Wed for a week", () => {
    const result = calculateBatchDates("2026-05-04", "2026-05-10", [1, 3]);
    expect(result).toEqual(["2026-05-04", "2026-05-06"]);
  });

  it("returns empty for no matching days", () => {
    const result = calculateBatchDates("2026-05-04", "2026-05-04", [0]);
    expect(result).toEqual([]);
  });
});
```

- [ ] **步骤 2：运行测试**

```bash
npx vitest run
```
预期：17 tests PASS（14 原有 + 3 新增）

- [ ] **步骤 3：Commit**

```bash
git add src/__tests__/
git commit -m "test: add batch schedule date calculation tests"
```

---

### 任务 8：最终验证

- [ ] **步骤 1：TypeScript 类型检查**

```bash
npx tsc --noEmit
```
预期：零错误

- [ ] **步骤 2：全部测试**

```bash
npx vitest run
```
预期：17 tests PASS

- [ ] **步骤 3：Dev server 验证**

```bash
npm run dev
# 验证：注册→登录→添加学生(状态)→批量排课→签到→课程记录Tab查看→编辑
```

- [ ] **步骤 4：Commit**

```bash
git add .
git commit -m "chore: final verification — all tests pass, tsc clean"
```
