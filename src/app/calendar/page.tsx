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
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Calendar,
  ListPlus,
  Pencil,
  CheckCheck,
  UserX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
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

/** T4 weekday labels starting from Monday */
const BATCH_WEEKDAYS = [
  { day: 1, label: "一" },
  { day: 2, label: "二" },
  { day: 3, label: "三" },
  { day: 4, label: "四" },
  { day: 5, label: "五" },
  { day: 6, label: "六" },
  { day: 0, label: "日" },
];

// ---------- helpers ----------

/** Extract yyyy-MM-dd from an ISO date string without timezone shifts */
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
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---- single-add form state ----
  const [formStudentId, setFormStudentId] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formDuration, setFormDuration] = useState("45");

  // ---- T4: batch dialog state ----
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchStudentId, setBatchStudentId] = useState("");
  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchEndDate, setBatchEndDate] = useState("");
  const [batchWeekdays, setBatchWeekdays] = useState<number[]>([]);
  const [batchStartTime, setBatchStartTime] = useState("18:00");
  const [batchDuration, setBatchDuration] = useState("45");
  const [batchError, setBatchError] = useState("");

  // ---- T5: edit dialog state ----
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editDuration, setEditDuration] = useState("");

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

  // ---- T4: batch preview ----
  const batchPreviewCount = useMemo(() => {
    if (!batchStartDate || !batchEndDate || batchWeekdays.length === 0)
      return 0;
    let count = 0;
    const cursor = new Date(batchStartDate);
    const end = new Date(batchEndDate);
    while (cursor <= end) {
      if (batchWeekdays.includes(cursor.getDay())) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }, [batchStartDate, batchEndDate, batchWeekdays]);

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
    setFormDate(format(date, "yyyy-MM-dd"));
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formStudentId) {
      setError("请选择学生");
      return;
    }

    try {
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
        toast.success("排课已添加");
        setSingleDialogOpen(false);
        setFormStudentId("");
        fetchSchedules();
      } else {
        toast.error("添加排课失败");
      }
    } catch {
      toast.error("添加排课失败，请重试");
    }
  }

  // ---- T4: batch schedule ----
  function toggleBatchWeekday(day: number) {
    setBatchWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBatchError("");

    if (!batchStudentId) {
      setBatchError("请选择学生");
      return;
    }
    if (!batchStartDate || !batchEndDate) {
      setBatchError("请选择开始和结束日期");
      return;
    }
    if (batchWeekdays.length === 0) {
      setBatchError("请至少选择一个星期");
      return;
    }

    try {
      const res = await fetch("/api/schedules/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: batchStudentId,
          startDate: batchStartDate,
          endDate: batchEndDate,
          weekdays: batchWeekdays,
          startTime: batchStartTime,
          durationMinutes: parseInt(batchDuration, 10),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`成功生成 ${data.count} 节排课`);
        setBatchDialogOpen(false);
        setBatchStudentId("");
        setBatchStartDate("");
        setBatchEndDate("");
        setBatchWeekdays([]);
        fetchSchedules();
      } else {
        const data = await res.json();
        toast.error(data.error || "批量排课失败");
      }
    } catch {
      toast.error("批量排课失败，请重试");
    }
  }

  // ---- T5: check-in / leave ----
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

  // ---- T5: edit schedule ----
  function openEditDialog(schedule: Schedule) {
    setEditingSchedule(schedule);
    setEditDate(format(new Date(schedule.date), "yyyy-MM-dd"));
    setEditStartTime(schedule.startTime);
    setEditDuration(String(schedule.durationMinutes));
    setEditDialogOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      const res = await fetch(`/api/schedules/${editingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editDate,
          startTime: editStartTime,
          durationMinutes: parseInt(editDuration, 10),
        }),
      });
      if (res.ok) {
        toast.success("排课已更新");
        setEditDialogOpen(false);
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        toast.error("更新失败");
      }
    } catch {
      toast.error("更新失败，请重试");
    }
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
          <div className="flex gap-2">
            {/* single add dialog */}
            <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
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
                  <ErrorMessage message={error} />
                  <div className="space-y-2">
                    <Label>学生 *</Label>
                    <Select
                      value={formStudentId}
                      onValueChange={(v) => setFormStudentId(v ?? "")}
                    >
                      <SelectTrigger>
                        <span
                          className={
                            formStudentId ? "" : "text-muted-foreground"
                          }
                        >
                          {students.find((s) => s.id === formStudentId)
                            ?.name || "选择学生"}
                        </span>
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
                  <div className="space-y-2">
                    <Label>日期 *</Label>
                    <Input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                    />
                  </div>
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

            {/* T4: batch schedule dialog */}
            <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline">
                    <ListPlus size={16} className="mr-1" />
                    批量排课
                  </Button>
                }
              />
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>批量排课</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBatchSubmit} className="space-y-4">
                  <ErrorMessage message={batchError} />
                  {/* student */}
                  <div className="space-y-2">
                    <Label>学生 *</Label>
                    <Select
                      value={batchStudentId}
                      onValueChange={(v) => setBatchStudentId(v ?? "")}
                    >
                      <SelectTrigger>
                        <span
                          className={
                            batchStudentId ? "" : "text-muted-foreground"
                          }
                        >
                          {students.find((s) => s.id === batchStudentId)
                            ?.name || "选择学生"}
                        </span>
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

                  {/* date range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>开始日期 *</Label>
                      <Input
                        type="date"
                        value={batchStartDate}
                        onChange={(e) => setBatchStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结束日期 *</Label>
                      <Input
                        type="date"
                        value={batchEndDate}
                        onChange={(e) => setBatchEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* weekday toggle */}
                  <div className="space-y-2">
                    <Label>重复星期 *</Label>
                    <div className="flex gap-1.5">
                      {BATCH_WEEKDAYS.map(({ day, label }) => {
                        const selected = batchWeekdays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleBatchWeekday(day)}
                            className={cn(
                              "w-9 h-9 rounded-full text-sm font-medium border transition-colors",
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-input hover:border-primary/50",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* time + duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>时间</Label>
                      <Input
                        type="time"
                        value={batchStartTime}
                        onChange={(e) => setBatchStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>时长（分钟）</Label>
                      <Input
                        type="number"
                        value={batchDuration}
                        onChange={(e) => setBatchDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* preview */}
                  {batchPreviewCount > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      预计生成{" "}
                      <span className="font-semibold text-foreground">
                        {batchPreviewCount}
                      </span>{" "}
                      节课
                    </p>
                  )}

                  <Button type="submit" className="w-full">
                    生成排课
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* ======== left: calendar ======== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* --- month nav + add / batch buttons --- */}
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

          <div className="flex items-center gap-2">
            {/* T4: batch schedule button */}
            <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline">
                    <ListPlus size={16} className="mr-1" />
                    批量排课
                  </Button>
                }
              />
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>批量排课</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBatchSubmit} className="space-y-4">
                  <ErrorMessage message={batchError} />
                  {/* student */}
                  <div className="space-y-2">
                    <Label>学生 *</Label>
                    <Select
                      value={batchStudentId}
                      onValueChange={(v) => setBatchStudentId(v ?? "")}
                    >
                      <SelectTrigger>
                        <span
                          className={
                            batchStudentId ? "" : "text-muted-foreground"
                          }
                        >
                          {students.find((s) => s.id === batchStudentId)
                            ?.name || "选择学生"}
                        </span>
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

                  {/* date range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>开始日期 *</Label>
                      <Input
                        type="date"
                        value={batchStartDate}
                        onChange={(e) => setBatchStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结束日期 *</Label>
                      <Input
                        type="date"
                        value={batchEndDate}
                        onChange={(e) => setBatchEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* weekday toggle */}
                  <div className="space-y-2">
                    <Label>重复星期 *</Label>
                    <div className="flex gap-1.5">
                      {BATCH_WEEKDAYS.map(({ day, label }) => {
                        const selected = batchWeekdays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleBatchWeekday(day)}
                            className={cn(
                              "w-9 h-9 rounded-full text-sm font-medium border transition-colors",
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-input hover:border-primary/50",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* time + duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>时间</Label>
                      <Input
                        type="time"
                        value={batchStartTime}
                        onChange={(e) => setBatchStartTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>时长（分钟）</Label>
                      <Input
                        type="number"
                        value={batchDuration}
                        onChange={(e) => setBatchDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* preview */}
                  {batchPreviewCount > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      预计生成{" "}
                      <span className="font-semibold text-foreground">
                        {batchPreviewCount}
                      </span>{" "}
                      节课
                    </p>
                  )}

                  <Button type="submit" className="w-full">
                    生成排课
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* single add schedule */}
            <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
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
                  <ErrorMessage message={error} />
                  {/* student */}
                  <div className="space-y-2">
                    <Label>学生 *</Label>
                    <Select
                      value={formStudentId}
                      onValueChange={(v) => setFormStudentId(v ?? "")}
                    >
                      <SelectTrigger>
                        <span
                          className={
                            formStudentId ? "" : "text-muted-foreground"
                          }
                        >
                          {students.find((s) => s.id === formStudentId)
                            ?.name || "选择学生"}
                        </span>
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

                        {/* T5: action buttons */}
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

      {/* T5: edit schedule dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑排课</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* date */}
            <div className="space-y-2">
              <Label>日期</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            {/* time + duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>时间</Label>
                <Input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>时长（分钟）</Label>
                <Input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <DialogClose
                render={
                  <Button variant="outline" type="button">
                    取消
                  </Button>
                }
              />
              <Button type="submit">保存修改</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
