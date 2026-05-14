"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ErrorMessage } from "@/components/ui/error-message";
import { cn } from "@/lib/utils";
import { Plus, ListPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendBark } from "@/lib/bark";

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

const BATCH_WEEKDAYS = [
  { day: 1, label: "一" },
  { day: 2, label: "二" },
  { day: 3, label: "三" },
  { day: 4, label: "四" },
  { day: 5, label: "五" },
  { day: 6, label: "六" },
  { day: 0, label: "日" },
];

// ====== 添加排课 Dialog ======

function AddScheduleDialog({
  students,
  selectedDate,
  onRefresh,
}: {
  students: Student[];
  selectedDate: Date | null;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(
    selectedDate
      ? selectedDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("45");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId) {
      setError("请选择学生");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date,
          startTime,
          durationMinutes: parseInt(duration, 10),
        }),
      });

      if (res.ok) {
        toast.success("排课已添加");
        sendBark("排课成功", `${label || ""} ${date} ${startTime}`);
        setOpen(false);
        setStudentId("");
        onRefresh();
      } else {
        toast.error("添加排课失败");
      }
    } catch {
      toast.error("添加排课失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const label = students.find((s) => s.id === studentId)?.name;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
      <DialogTrigger
        render={
          <Button>
            <Plus size={16} className="mr-1" />
            添加排课
          </Button>
        }
      />
      <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
          <X size={20} />
        </button>
        <DialogHeader>
          <DialogTitle>添加排课</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error} />
          <div className="space-y-2">
            <Label>学生 *</Label>
            <Select
              value={studentId}
              onValueChange={(v) => setStudentId(v ?? "")}
            >
              <SelectTrigger>
                <span className={studentId ? "" : "text-muted-foreground"}>
                  {label || "选择学生"}
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>时间</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>时长（分钟）</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full min-h-[44px] sticky bottom-0"
            disabled={loading}
          >
            {loading ? "保存中..." : "保存排课"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ====== 批量排课 Dialog ======

function BatchScheduleDialog({
  students,
  onRefresh,
}: {
  students: Student[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState("45");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const previewCount = (() => {
    if (!startDate || !endDate || weekdays.length === 0) return 0;
    let count = 0;
    const cursor = new Date(startDate);
    const end = new Date(endDate);
    while (cursor <= end) {
      if (weekdays.includes(cursor.getDay())) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  })();

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId) {
      setError("请选择学生");
      return;
    }
    if (!startDate || !endDate) {
      setError("请选择开始和结束日期");
      return;
    }
    if (weekdays.length === 0) {
      setError("请至少选择一个星期");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/schedules/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          startDate,
          endDate,
          weekdays,
          startTime,
          durationMinutes: parseInt(duration, 10),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`成功生成 ${data.count} 节排课`);
        setOpen(false);
        setStudentId("");
        setStartDate("");
        setEndDate("");
        setWeekdays([]);
        onRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "批量排课失败");
      }
    } catch {
      toast.error("批量排课失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const label = students.find((s) => s.id === studentId)?.name;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <ListPlus size={16} className="mr-1" />
            批量排课
          </Button>
        }
      />
      <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
        <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
          <X size={20} />
        </button>
        <DialogHeader>
          <DialogTitle>批量排课</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error} />
          <div className="space-y-2">
            <Label>学生 *</Label>
            <Select
              value={studentId}
              onValueChange={(v) => setStudentId(v ?? "")}
            >
              <SelectTrigger>
                <span className={studentId ? "" : "text-muted-foreground"}>
                  {label || "选择学生"}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期 *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期 *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>重复星期 *</Label>
            <div className="flex gap-1.5">
              {BATCH_WEEKDAYS.map(({ day, label }) => {
                const selected = weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={cn(
                      "w-9 h-9 rounded-full text-sm font-medium border transition-colors",
                      selected
                        ? "bg-[#2da44e] text-white border-[#2da44e]"
                        : "bg-background text-muted-foreground border-input hover:border-[#2da44e]/50",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>时间</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>时长（分钟）</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {previewCount > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              预计生成{" "}
              <span className="font-semibold text-foreground">
                {previewCount}
              </span>{" "}
              节课
            </p>
          )}

          <Button
            type="submit"
            className="w-full min-h-[44px] sticky bottom-0"
            disabled={loading}
          >
            {loading ? "保存中..." : "生成排课"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ====== 导出：操作按钮区域 ======

export function ScheduleDialogs({
  students,
  selectedDate,
  onRefresh,
}: {
  students: Student[];
  selectedDate: Date | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <BatchScheduleDialog students={students} onRefresh={onRefresh} />
      <AddScheduleDialog
        students={students}
        selectedDate={selectedDate}
        onRefresh={onRefresh}
      />
    </div>
  );
}

// ====== 编辑排课 Dialog（由父组件控制 open） ======

export function EditScheduleDialog({
  open,
  schedule,
  onClose,
  onRefresh,
}: {
  open: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  // 当 schedule 变化时同步表单
  useEffect(() => {
    if (schedule) {
      setDate(schedule.date.split("T")[0]);
      setStartTime(schedule.startTime);
      setDuration(String(schedule.durationMinutes));
    }
  }, [schedule?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schedule) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          durationMinutes: parseInt(duration, 10),
        }),
      });
      if (res.ok) {
        toast.success("排课已更新");
        onClose();
        onRefresh();
      } else {
        toast.error("更新失败");
      }
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
        <button onClick={onClose} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
          <X size={20} />
        </button>
        <DialogHeader>
          <DialogTitle>编辑排课</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>日期</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>时间</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>时长（分钟）</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end sticky bottom-0 bg-background pt-3 border-t">
            <DialogClose
              render={
                <Button variant="outline" type="button" className="min-h-[44px]">
                  取消
                </Button>
              }
            />
            <Button type="submit" className="min-h-[44px]" disabled={loading}>
              {loading ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
