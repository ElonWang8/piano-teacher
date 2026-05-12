"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repeatRule: string | null;
  student: { name: string };
  studentId: string;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | null;
  calendarDays: Date[];
  schedulesByDate: Record<string, Schedule[]>;
  holidays: Record<string, string>;
  workdays: Record<string, string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  calendarDays,
  schedulesByDate,
  holidays,
  workdays,
  onPrevMonth,
  onNextMonth,
  onDateClick,
}: CalendarGridProps) {
  return (
    <>
      {/* month navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={onPrevMonth}>
          <ChevronLeft />
        </Button>
        <h2 className="text-lg font-bold min-w-[120px] text-center select-none">
          {format(currentMonth, "yyyy年M月")}
        </h2>
        <Button variant="outline" size="icon-sm" onClick={onNextMonth}>
          <ChevronRight />
        </Button>
      </div>

      {/* weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-xs font-medium text-muted-foreground py-2 border-b"
          >
            {d}
          </div>
        ))}
      </div>

      {/* day grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr border-l rounded-b-lg overflow-hidden">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const daySchedules = schedulesByDate[key] ?? [];
          const holidayName = holidays[key] ?? null;
          const workdayReason = workdays[key] ?? null;
          const inMonth = isSameMonth(day, currentMonth);
          const selected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;
          const today = isToday(day);
          const tooltip = [holidayName, workdayReason].filter(Boolean).join(" · ") || undefined;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateClick(day)}
              title={tooltip}
              className={cn(
                "flex flex-col items-center border-b border-r p-1 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 outline-none",
                !inMonth && "bg-muted/30 text-muted-foreground/50",
                selected &&
                  "ring-2 ring-inset ring-primary bg-primary/5",
                today && !selected && "bg-accent/20",
              )}
            >
              {/* day number */}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                  today && "bg-primary text-primary-foreground font-semibold",
                  selected && !today && "font-bold text-primary",
                  holidayName && !today && "text-red-500 font-semibold",
                  workdayReason && !today && !holidayName && "text-amber-600 font-semibold",
                )}
              >
                {format(day, "d")}
              </span>

              {/* holiday / workday label */}
              {holidayName && (
                <span className="text-[10px] leading-none text-red-500 mt-0.5 truncate max-w-full px-0.5">
                  {holidayName}
                </span>
              )}
              {workdayReason && !holidayName && (
                <span className="text-[9px] leading-none text-amber-600 mt-0.5 truncate max-w-full px-0.5">
                  班
                </span>
              )}

              {/* schedule dots */}
              {daySchedules.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {daySchedules.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="w-1.5 h-1.5 rounded-full bg-primary/70"
                    />
                  ))}
                  {daySchedules.length > 3 && (
                    <span className="text-[10px] leading-none text-muted-foreground">
                      +{daySchedules.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
