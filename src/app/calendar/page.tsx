"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import {
  ScheduleDialogs,
  EditScheduleDialog,
} from "@/components/calendar/schedule-dialogs";
import {
  Clock,
  User,
  Calendar,
  Pencil,
  CheckCheck,
  UserX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";
import { holidays } from "@/lib/holidays";

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

function toDateKey(iso: string) {
  return iso.split("T")[0];
}

// ---------- page ----------

export default function CalendarPage() {
  const toast = useToast();

  // ---- calendar state ----
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- edit dialog state ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // ---- derived: calendar grid days ----
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    );
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
    setLoading(true);
    const monthStr = format(currentMonth, "yyyy-MM");
    try {
      const res = await fetch(`/api/schedules?month=${monthStr}`);
      const data = await res.json();
      if (Array.isArray(data)) setSchedules(data);
      else setSchedules([]);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
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
  }

  // ---- check-in / leave ----
  async function handleAction(scheduleId: string, action: "ATTEND" | "LEAVE") {
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === "ATTEND" ? "已签到" : "已请假");
        fetchSchedules();
      } else {
        toast.error("操作失败");
      }
    } catch {
      toast.error("操作失败，请重试");
    }
  }

  // ---- edit schedule ----
  function openEditDialog(schedule: Schedule) {
    setEditingSchedule(schedule);
    setEditDialogOpen(true);
  }

  // ---- selected-date day-of-week label ----
  const selectedDayLabel = selectedDate
    ? `${format(selectedDate, "M月d日")} 周${WEEKDAYS[selectedDate.getDay()]}`
    : "";

  // ====================== render ======================

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton type="card" count={1} />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={48} />}
        title="暂无排课"
        description="点击「添加排课」安排单节课，或使用「批量排课」快速安排多节"
        action={
          <ScheduleDialogs
            students={students}
            selectedDate={selectedDate}
            onRefresh={fetchSchedules}
          />
        }
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* ======== left: calendar ======== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* --- action buttons --- */}
        <div className="flex items-center justify-end mb-3">
          <ScheduleDialogs
            students={students}
            selectedDate={selectedDate}
            onRefresh={fetchSchedules}
          />
        </div>

        <CalendarGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          calendarDays={calendarDays}
          schedulesByDate={schedulesByDate}
          holidays={holidays}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onDateClick={handleDateClick}
        />
      </div>

      {/* ======== right: selected day detail ======== */}
      <div className="w-full lg:w-72 shrink-0">
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
                      <CardContent className="py-3 space-y-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Clock
                            size={14}
                            className="text-muted-foreground"
                          />
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

                        {/* action buttons */}
                        <div className="flex gap-1 pt-1 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAction(s.id, "ATTEND")}
                          >
                            <CheckCheck size={12} className="mr-1" />
                            签到
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAction(s.id, "LEAVE")}
                          >
                            <UserX size={12} className="mr-1" />
                            请假
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs ml-auto"
                            onClick={() => openEditDialog(s)}
                          >
                            <Pencil size={12} className="mr-1" />
                            编辑
                          </Button>
                        </div>
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

      {/* edit schedule dialog */}
      <EditScheduleDialog
        open={editDialogOpen}
        schedule={editingSchedule}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingSchedule(null);
        }}
        onRefresh={fetchSchedules}
      />
    </div>
  );
}
