# 六个新功能 实现计划

> **目标：** 上课记录复制、曲目库、月度报表、JSON 备份、学生导入导出、日历节假日

---

### 任务 1：上课记录一键复制

**文件：** 修改 `src/app/lessons/page.tsx` 和 `src/app/students/[id]/page.tsx`

在已上课列表的每张卡片上加「📋 复制」按钮：

```tsx
async function copyLesson(lesson: Lesson) {
  const text = `【PianoRecord 上课记录】
学生：${lesson.student.name}
日期：${new Date(lesson.date).toLocaleDateString("zh-CN", { weekday: "long" })} ${lesson.startTime}-${lesson.startTime}+${lesson.durationMinutes}分
${lesson.repertoire ? `曲目：${lesson.repertoire}` : ""}
${lesson.notes ? `掌握情况：${lesson.notes}` : ""}
${lesson.homework ? `本周作业：${lesson.homework}` : ""}`;
  await navigator.clipboard.writeText(text);
  toast.success("已复制，可粘贴发送给家长");
}
```

同时加到学生详情页课程记录列表。提交 "feat: add one-click copy lesson summary"

---

### 任务 2：曲目库快捷标签

**文件：** 修改 `src/components/lessons/lesson-form.tsx`

在曲目 Textarea 下方添加标签栏：

```tsx
const PIANO_PIECES = [
  { label: "小汤1", value: "小汤1" }, { label: "小汤2", value: "小汤2" },
  { label: "小汤3", value: "小汤3" }, { label: "拜厄", value: "拜厄" },
  { label: "车尔尼599", value: "车尔尼599" }, { label: "车尔尼849", value: "车尔尼849" },
  { label: "车尔尼299", value: "车尔尼299" }, { label: "哈农", value: "哈农" },
  { label: "音阶", value: "音阶练习" },
];

function appendPiece(tag: string) {
  const current = repertoire.split(/[、，,\n]/).filter(Boolean);
  if (!current.includes(tag)) {
    setRepertoire(prev => (prev ? prev + "、" + tag : tag));
  }
}
```

渲染为一排 `Badge`/`Button` 标签。提交 "feat: add piano piece quick tags to lesson form"

---

### 任务 3：月度学生报表

**文件：**
- 创建：`src/app/api/report/monthly/route.ts`
- 修改：`src/app/page.tsx`（看板加"月报"入口）

**API：** GET /api/report/monthly?month=2026-05

返回每个学生当月统计：
```json
[{
  "studentName": "王小明",
  "attendedCount": 4,
  "absentCount": 0,
  "leaveCount": 0,
  "consumedLessons": 4,
  "paidAmount": 800,
  "paidLessons": 10,
  "remainingLessons": 6,
  "attendanceRate": 100
}]
```

在看板加一个「月度报表」区域或按钮，点击展示表格。提交 "feat: add monthly student report API and view"

---

### 任务 4：JSON 备份

**文件：**
- 创建：`src/app/api/backup/route.ts`
- 修改：`src/app/settings/page.tsx`

**API：** GET /api/backup — 导出所有表数据为 JSON：

```typescript
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  
  const [students, lessons, payments, schedules] = await Promise.all([
    db.student.findMany({ where: { userId: session.user.id } }),
    db.lesson.findMany({ where: { student: { userId: session.user.id } } }),
    db.payment.findMany({ where: { student: { userId: session.user.id } } }),
    db.schedule.findMany({ where: { student: { userId: session.user.id } } }),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    students, lessons, payments, schedules,
  });
}
```

设置页加「导出备份」按钮 → fetch API → 生成 JSON 文件下载。

**Docker 定时备份：** docker-compose.yml 加 backup 服务：
```yaml
backup:
  image: alpine/curl
  depends_on: [app]
  command: sh -c "while true; do sleep 86400; curl -o /backup/$(date +%Y%m%d).json http://app:3000/api/backup; done"
  volumes:
    - /vol1/1000/backup/piano-teacher:/backup
```

提交 "feat: add JSON backup API and scheduled Docker backup"

---

### 任务 5：学生导入导出

**文件：**
- 创建：`src/app/api/students/import/route.ts`
- 修改：`src/app/api/students/route.ts`（加导出格式）
- 修改：`src/app/students/page.tsx`（加导入/导出按钮）
- 安装：`npm install xlsx`

**导出：** 学生列表页加「导出 Excel」按钮。前端用 xlsx 库生成 .xlsx。学生数据从现有 API 获取。

**导入 API：** POST /api/students/import
- 接收 FormData (file)
- 解析 Excel/JSON
- 批量创建 Student

Excel 列：姓名(必填)、年龄、级别、家长手机号、状态、备注

JSON 格式：`[{ "name": "...", "age": 10, ... }]`

提交 "feat: add student import/export with Excel and JSON support"

---

### 任务 6：日历节假日

**文件：**
- 创建：`src/lib/holidays.ts`
- 修改：`src/components/calendar/calendar-grid.tsx`

**src/lib/holidays.ts：**
```typescript
interface Holiday {
  date: string; // "2026-05-01"
  name: string;
}

export const HOLIDAYS: Holiday[] = [
  // 2026
  { date: "2026-01-01", name: "元旦" },
  { date: "2026-01-28", name: "除夕" },
  { date: "2026-01-29", name: "春节" },
  { date: "2026-01-30", name: "春节" },
  { date: "2026-01-31", name: "春节" },
  { date: "2026-02-01", name: "春节" },
  { date: "2026-04-05", name: "清明节" },
  { date: "2026-05-01", name: "劳动节" },
  { date: "2026-05-02", name: "劳动节" },
  { date: "2026-05-03", name: "劳动节" },
  { date: "2026-05-31", name: "端午节" },
  { date: "2026-10-01", name: "国庆节" },
  { date: "2026-10-02", name: "国庆节" },
  { date: "2026-10-03", name: "国庆节" },
  { date: "2026-10-04", name: "中秋节" },
  { date: "2026-10-05", name: "国庆节" },
  { date: "2026-10-06", name: "国庆节" },
  { date: "2026-10-07", name: "国庆节" },
];

export function getHoliday(date: Date): Holiday | undefined {
  const key = date.toISOString().split("T")[0];
  return HOLIDAYS.find(h => h.date === key);
}
```

**CalendarGrid 改动：**
- 接收 `holidays` prop
- 假日日期格显示红色文字 + "假" Badge
- 用 `title` 属性显示假日名称

提交 "feat: add Chinese holidays to calendar"

---

### 任务 7：最终验证

```bash
npx tsc --noEmit
npx vitest run
npm run build
```

提交 "chore: final batch features verification"
