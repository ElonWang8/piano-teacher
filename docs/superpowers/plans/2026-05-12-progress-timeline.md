# 学生学琴历程 实现计划

> **面向 AI 代理的工作者：** 使用 superpowers:subagent-driven-development 逐任务实现。

**目标：** 在学生详情页「学习进度」Tab 中新增进度概览卡片 + 学习阶段条 + 按年时间线

**架构：** 新建 `ProgressTimeline` 组件，数据从现有 `GET /api/students/[id]` 的 Lesson 数组提取。纯前端聚合计算，无需改 API。

**技术栈：** React, TypeScript, Tailwind CSS, date-fns, lucide-react

---

### 任务 1：创建 ProgressTimeline 组件

**文件：**
- 创建：`src/components/students/progress-timeline.tsx`

- [ ] **步骤 1：编写进度数据处理逻辑 + 组件**

`src/components/students/progress-timeline.tsx`：

```tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, differenceInMonths } from "date-fns";
import { BookOpen, Clock, Calendar, Circle } from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  repertoire: string | null;
  notes: string | null;
  status: string;
}

interface Props {
  lessons: Lesson[];
  startDate?: string | null;
  level?: string | null;
}

// 阶段定义
const STAGES = [
  { key: "入门", color: "bg-[#2e7d32]", match: (r: string) => /小汤|汤普森|简易|入门/i.test(r) },
  { key: "初级", color: "bg-[#1565c0]", match: (r: string) => /拜厄|车尔尼599|599|哈农|音阶/i.test(r) },
  { key: "中级", color: "bg-[#e65100]", match: (r: string) => /车尔尼849|849|小奏鸣曲|二部创意/i.test(r) },
  { key: "高级", color: "bg-[#c62828]", match: (r: string) => /车尔尼299|299|740|贝多芬|莫扎特|肖邦/i.test(r) },
];

export function ProgressTimeline({ lessons, startDate, level }: Props) {
  const stats = useMemo(() => {
    const attended = lessons.filter(l => l.status === "ATTENDED");
    // 统计曲目（去重）
    const pieces = new Set<string>();
    attended.forEach(l => {
      if (l.repertoire) {
        l.repertoire.split(/[、，,]/).forEach(p => pieces.add(p.trim()));
      }
    });

    // 学琴时长
    const dates = attended.map(l => new Date(l.date).getTime());
    const minDate = dates.length ? new Date(Math.min(...dates)) : null;
    const maxDate = dates.length ? new Date(Math.max(...dates)) : null;
    const totalMonths = minDate && maxDate ? differenceInMonths(maxDate, minDate) : 0;
    const duration = totalMonths >= 12
      ? `${Math.floor(totalMonths / 12)}年${totalMonths % 12}个月`
      : `${totalMonths}个月`;

    // 阶段统计
    const stageStats = STAGES.map(stage => {
      const matched = attended.filter(l => l.repertoire && stage.match(l.repertoire));
      const stageDates = matched.map(l => new Date(l.date).getTime());
      return {
        key: stage.key,
        color: stage.color,
        count: matched.length,
        months: stageDates.length >= 2
          ? differenceInMonths(new Date(Math.max(...stageDates)), new Date(Math.min(...stageDates)))
          : 0,
      };
    });

    // 按年月分组
    const grouped: Record<string, Lesson[]> = {};
    attended.forEach(l => {
      const key = format(new Date(l.date), "yyyy年M月");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    });

    return { attended, pieces, duration, stageStats, grouped };
  }, [lessons]);

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <BookOpen size={40} className="mb-3 opacity-50" />
        <p>暂无课程记录</p>
        <p className="text-sm">开始上课后这里会显示学琴历程</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xl font-bold text-primary">{stats.attended.length}</div>
          <div className="text-xs text-muted-foreground">累计课时</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.pieces.size}首</div>
          <div className="text-xs text-muted-foreground">学完曲目</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{stats.duration}</div>
          <div className="text-xs text-muted-foreground">学琴时长</div>
        </div>
      </div>

      {/* 阶段条 */}
      <div>
        <h4 className="text-sm font-semibold mb-2">学习阶段</h4>
        <div className="flex rounded-lg overflow-hidden">
          {stats.stageStats.map((s, i) => (
            <div
              key={s.key}
              className={cn("flex-1 text-center py-3 text-white text-xs", s.color)}
            >
              <div className="font-semibold">{s.key}</div>
              <div className="opacity-80">{s.months > 0 ? `${s.months}个月` : "-"}</div>
              <div className="opacity-80">{s.count > 0 ? `${s.count}首` : "-"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 时间线 */}
      <div>
        <h4 className="text-sm font-semibold mb-3">学琴历程</h4>
        <div className="relative pl-6 border-l-2 border-muted space-y-4">
          {Object.entries(stats.grouped).reverse().map(([month, items]) => (
            <div key={month} className="relative">
              <Circle
                size={10}
                className="absolute -left-[21px] top-1 fill-primary text-primary"
              />
              <div className="text-xs font-semibold text-primary mb-1">{month}</div>
              <div className="space-y-1">
                {items.map(l => (
                  <div key={l.id} className="text-xs text-muted-foreground">
                    {l.repertoire || "无曲目记录"}
                    {l.notes && ` — ${l.notes.slice(0, 30)}${l.notes.length > 30 ? "..." : ""}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
git add src/components/students/progress-timeline.tsx
git commit -m "feat: add ProgressTimeline component"
```

---

### 任务 2：集成到学生详情页

**文件：**
- 修改：`src/app/students/[id]/page.tsx`

- [ ] **步骤 1：替换学习进度 Tab 内容**

在 `src/app/students/[id]/page.tsx` 中：
1. 导入 `ProgressTimeline`
2. 在 progress Tab 中替换现有的简单数字为 `<ProgressTimeline lessons={student.lessons} startDate={student.startDate} level={student.level} />`
3. 保留 loading 状态处理

- [ ] **步骤 2：验证**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/students/
git commit -m "feat: integrate ProgressTimeline into student detail page"
```

---

### 任务 3：最终验证

- [ ] **步骤 1：TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **步骤 2：测试**

```bash
npx vitest run
```
预期：17 tests PASS

- [ ] **步骤 3：Commit**

```bash
git add .
git commit -m "chore: final progress timeline verification"
```
