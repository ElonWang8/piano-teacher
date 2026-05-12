"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, differenceInMonths } from "date-fns";
import { BookOpen, Circle } from "lucide-react";

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

const STAGES = [
  { key: "入门", color: "bg-[#2e7d32]", match: (r: string) => /小汤|汤普森|简易|入门/i.test(r) },
  { key: "初级", color: "bg-[#1565c0]", match: (r: string) => /拜厄|车尔尼599|599|哈农|音阶/i.test(r) },
  { key: "中级", color: "bg-[#e65100]", match: (r: string) => /车尔尼849|849|小奏鸣曲|二部创意/i.test(r) },
  { key: "高级", color: "bg-[#c62828]", match: (r: string) => /车尔尼299|299|740|贝多芬|莫扎特|肖邦/i.test(r) },
];

export function ProgressTimeline({ lessons, startDate, level }: Props) {
  const stats = useMemo(() => {
    const attended = lessons.filter(l => l.status === "ATTENDED");
    const pieces = new Set<string>();
    attended.forEach(l => {
      if (l.repertoire) {
        l.repertoire.split(/[、，,]/).forEach(p => pieces.add(p.trim()));
      }
    });

    const dates = attended.map(l => new Date(l.date).getTime());
    const minDate = dates.length ? new Date(Math.min(...dates)) : null;
    const maxDate = dates.length ? new Date(Math.max(...dates)) : null;
    const totalMonths = minDate && maxDate ? differenceInMonths(maxDate, minDate) : 0;
    const duration = totalMonths >= 12
      ? `${Math.floor(totalMonths / 12)}年${totalMonths % 12}个月`
      : `${totalMonths}个月`;

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

      <div>
        <h4 className="text-sm font-semibold mb-2">学习阶段</h4>
        <div className="flex rounded-lg overflow-hidden">
          {stats.stageStats.map((s) => (
            <div key={s.key} className={cn("flex-1 text-center py-3 text-white text-xs", s.color)}>
              <div className="font-semibold">{s.key}</div>
              <div className="opacity-80">{s.months > 0 ? `${s.months}个月` : "-"}</div>
              <div className="opacity-80">{s.count > 0 ? `${s.count}首` : "-"}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">学琴历程</h4>
        <div className="relative pl-6 border-l-2 border-muted space-y-4">
          {Object.entries(stats.grouped).reverse().map(([month, items]) => (
            <div key={month} className="relative">
              <Circle size={10} className="absolute -left-[21px] top-1 fill-primary text-primary" />
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
