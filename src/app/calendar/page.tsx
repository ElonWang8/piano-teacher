"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

// ---------- types ----------

interface Student {
  id: string;
  name: string;
}

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

// ---------- helpers ----------

/** Extract yyyy-MM-dd from an ISO date string without timezone shifts */
function toDateKey(iso: string) {
  return iso.split("T")[0];
}

// ---------- page ----------

export default function CalendarPage() {
  // ---- calendar state ----
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ---- form state ----
  const [formStudentId, setFormStudentId] = useState("");
  const [formDate, setFormDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState("45");

  // ---- derived: calendar grid days ----
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // ---- schedules grouped by date key ----
  const schedulesByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {};
    for (const s of schedules) {
      const key = toDateKey(s.date);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [schedules]);

  // ---- schedules for the selected date ----
  const selectedSchedules = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return schedulesByDate[key] ?? [];
  }, [selectedDate, schedulesByDate]);

  // ---- data fetching ----
  const fetchSchedules = useCallback(async () => {
    const monthStr = format(currentMonth, "yyyy-MM");
    try {
      const res = await fetch(`/api/schedules?month=${monthStr}`);
      const data = await res.json();
      if (Array.isArray(data)) setSchedules(data);
      else setSchedules([]);
    } catch {
      setSchedules([]);
    }
  }, [currentMonth]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) setStudents(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ---- handlers ----
  function goPrevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
    setSelectedDate(null);
  }

  function goNextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
    setSelectedDate(null);
  }

  function handleDateClick(date: Date) {
    setSelectedDate(date);
    setFormDate(format(date, "yyyy-MM-dd"));
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!formStudentId) return;

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: formStudentId,
        date: formDate,
        startTime: formStartTime,
        durationMinutes: parseInt(formDuration, 10),
      }),
    });

    if (res.ok) {
      setDialogOpen(false);
      setFormStudentId("");
      fetchSchedules();
    }
  }

  // ---- selected-date day-of-week label ----
  const selectedDayLabel = selectedDate
    ? `${format(selectedDate, "M月d日")} 周${WEEKDAYS[selectedDate.getDay()]}`
    : "";

  // ====================== render ======================

  return (
    <div className="flex gap-6 h-full">
      {/* ======== left: calendar ======== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* --- month nav + add button --- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={goPrevMonth}>
              <ChevronLeft />
            </Button>
            <h2 className="text-lg font-bold min-w-[120px] text-center select-none">
              {format(currentMonth, "yyyy年M月")}
            </h2>
            <Button variant="outline" size="icon-sm" onClick={goNextMonth}>
              <ChevronRight />
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus size={16} className="mr-1" />
                  添加排课
                </Button>
              }
            />
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>添加排课</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSchedule} className="space-y-4">
                {/* student */}
                <div className="space-y-2">
                  <Label>学生 *</Label>
                  <Select
                    value={formStudentId}
                    onValueChange={(v) => setFormStudentId(v ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* date */}
                <div className="space-y-2">
                  <Label>日期 *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                {/* time + duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>时间</Label>
                    <Input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>时长（分钟）</Label>
                    <Input
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  保存排课
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* --- weekday headers --- */}
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

        {/* --- calendar grid --- */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr border-l rounded-b-lg overflow-hidden">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const daySchedules = schedulesByDate[key] ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const selected = selectedDate
              ? isSameDay(day, selectedDate)
              : false;
            const today = isToday(day);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDateClick(day)}
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
                  )}
                >
                  {format(day, "d")}
                </span>

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
      </div>

      {/* ======== right: selected day detail ======== */}
      <div className="w-72 shrink-0">
        {selectedDate ? (
          <>
            <h3 className="font-semibold mb-4">{selectedDayLabel}</h3>

            {selectedSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                当日暂无排课
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedSchedules
                  .slice()
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <Card key={s.id} size="sm">
                      <CardContent className="py-3 space-y-1.5">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Clock size={14} className="text-muted-foreground" />
                          {s.startTime}
                          <Badge variant="secondary" className="ml-auto">
                            {s.durationMinutes}分钟
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User size={14} />
                          {s.student.name}
                        </div>
                        {s.repeatRule && (
                          <p className="text-xs text-muted-foreground">
                            重复规则：{s.repeatRule}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            点击左侧日期查看当天排课
          </div>
        )}
      </div>
    </div>
  );
}
