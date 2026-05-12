"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { holidays, workdays } from "@/lib/holidays";

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

  // ---- check-in dialog ----
  const [checkinSchedule, setCheckinSchedule] = useState<Schedule | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinRepertoire, setCheckinRepertoire] = useState("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinHomework, setCheckinHomework] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);

  function openCheckin(schedule: Schedule) {
    setCheckinSchedule(schedule);
    setCheckinRepertoire("");
    setCheckinNotes("");
    setCheckinHomework("");
    setCheckinOpen(true);
  }

  async function handleCheckinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkinSchedule) return;
    setCheckinLoading(true);
    try {
      const res = await fetch(`/api/schedules/${checkinSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ATTEND",
          repertoire: checkinRepertoire,
          notes: checkinNotes,
          homework: checkinHomework,
        }),
      });
      if (res.ok) {
        toast.success("已签到");
        setCheckinOpen(false);
        fetchSchedules();
      } else {
        toast.error("操作失败");
      }
    } catch {
      toast.error("操作失败，请重试");
    } finally {
      setCheckinLoading(false);
    }
  }

  // ---- leave ----
  async function handleLeave(scheduleId: string) {
    if (!window.confirm("确认请假？不会扣除课时")) return;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LEAVE" }),
      });
      if (res.ok) { toast.success("已请假"); fetchSchedules(); }
      else toast.error("操作失败");
    } catch { toast.error("操作失败，请重试"); }
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
          workdays={workdays}
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
                            onClick={() => openCheckin(s)}
                          >
                            <CheckCheck size={12} className="mr-1" />
                            签到
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleLeave(s.id)}
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

      {/* check-in dialog */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="max-md:!max-w-full max-md:!h-dvh max-md:!rounded-none max-md:m-0">
          <DialogHeader><DialogTitle>签到确认</DialogTitle></DialogHeader>
          {checkinSchedule && (
            <form onSubmit={handleCheckinSubmit} className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">学生：</span>{checkinSchedule.student.name}</div>
                <div><span className="text-muted-foreground">日期：</span>{format(new Date(checkinSchedule.date), "yyyy年M月d日")} 周{WEEKDAYS[new Date(checkinSchedule.date).getDay()]}</div>
                <div><span className="text-muted-foreground">时间：</span>{checkinSchedule.startTime} · {checkinSchedule.durationMinutes}分钟</div>
              </div>
              <div className="space-y-2">
                <Label>曲目/练习内容</Label>
                <Textarea value={checkinRepertoire} onChange={e => setCheckinRepertoire(e.target.value)} placeholder="如：拜厄 No.45、哈农 No.3" />
              </div>
              <div className="space-y-2">
                <Label>掌握情况/备注</Label>
                <Textarea value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} placeholder="手指独立性有进步..." />
              </div>
              <div className="space-y-2">
                <Label>布置作业</Label>
                <Textarea value={checkinHomework} onChange={e => setCheckinHomework(e.target.value)} placeholder="哈农 No.4 慢练" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1 min-h-[44px]" onClick={() => setCheckinOpen(false)}>取消</Button>
                <Button type="submit" className="flex-1 min-h-[44px]" disabled={checkinLoading}>{checkinLoading ? "签到中..." : "确认签到"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
