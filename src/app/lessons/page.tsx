"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Plus, BookOpen, Pencil, CheckCheck, UserX, Calendar } from "lucide-react";

interface Student { id: string; name: string; }

interface ScheduleItem {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  student: { name: string };
}

interface LessonItem {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
  student: { name: string };
}

const statusLabels: Record<string, string> = {
  ATTENDED: "已上课",
  ABSENT: "旷课",
  LEAVE: "请假",
};

export default function LessonsPage() {
  const toast = useToast();

  // ---------- schedules (未上课 tab) ----------
  const [schedules, setSchedules] = useState<ScheduleItem[] | null>(null);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  // ---------- lessons (已上课 tab) ----------
  const [lessons, setLessons] = useState<LessonItem[] | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // ---------- shared ----------
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [filterStudent, setFilterStudent] = useState("all");

  // ---------- new record dialog ----------
  const [newOpen, setNewOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("45");
  const [repertoire, setRepertoire] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState("ATTENDED");
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // ---------- edit dialog ----------
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LessonItem | null>(null);
  const [editRepertoire, setEditRepertoire] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHomework, setEditHomework] = useState("");
  const [editStatus, setEditStatus] = useState("ATTENDED");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editDuration, setEditDuration] = useState("45");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // ---------- data fetching ----------

  async function fetchSchedules() {
    setSchedulesLoading(true);
    try {
      const res = await fetch("/api/schedules");
      setSchedules(await res.json());
    } finally {
      setSchedulesLoading(false);
    }
  }

  async function fetchLessons() {
    setLessonsLoading(true);
    try {
      const url =
        filterStudent !== "all"
          ? `/api/lessons?studentId=${filterStudent}`
          : "/api/lessons";
      const res = await fetch(url);
      setLessons(await res.json());
    } finally {
      setLessonsLoading(false);
    }
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  useEffect(() => {
    fetchStudents();
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [filterStudent]);

  // ---------- refresh helpers ----------

  function refreshAll() {
    fetchSchedules();
    fetchLessons();
  }

  // ---------- schedule actions ----------

  async function handleScheduleAction(id: string, action: "ATTEND" | "LEAVE") {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === "ATTEND" ? "已签到" : "已请假");
        refreshAll();
      } else {
        const d = await res.json();
        toast.error(d.error || "操作失败");
      }
    } catch {
      toast.error("操作失败，请重试");
    }
  }

  // ---------- new record submit ----------

  async function handleNewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId) {
      setError("请选择学生");
      return;
    }
    if (!date) {
      setError("请选择日期");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date,
          startTime,
          durationMinutes: parseInt(duration),
          repertoire,
          notes: lessonNotes,
          homework,
          status,
        }),
      });
      if (res.ok) {
        toast.success("课程记录已保存");
        setNewOpen(false);
        fetchLessons();
        setRepertoire("");
        setLessonNotes("");
        setHomework("");
      } else {
        const d = await res.json();
        setError(d.error || "保存失败");
      }
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setSubmitLoading(false);
    }
  }

  // ---------- edit ----------

  function openEdit(lesson: LessonItem) {
    setEditing(lesson);
    setEditRepertoire(lesson.repertoire || "");
    setEditNotes(lesson.notes || "");
    setEditHomework(lesson.homework || "");
    setEditStatus(lesson.status);
    setEditStartTime(lesson.startTime);
    setEditDuration(String(lesson.durationMinutes));
    setEditError("");
    setEditOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditError("");
    setEditLoading(true);
    try {
      const res = await fetch(`/api/lessons/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repertoire: editRepertoire,
          notes: editNotes,
          homework: editHomework,
          status: editStatus,
          startTime: editStartTime,
          durationMinutes: parseInt(editDuration),
        }),
      });
      if (res.ok) {
        toast.success("课程记录已更新");
        setEditOpen(false);
        setEditing(null);
        fetchLessons();
      } else {
        const d = await res.json();
        setEditError(d.error || "更新失败");
      }
    } catch {
      toast.error("更新失败，请重试");
    } finally {
      setEditLoading(false);
    }
  }

  // ---------- status badge variant ----------

  function statusVariant(s: string) {
    if (s === "ATTENDED") return "default";
    if (s === "ABSENT") return "destructive";
    return "secondary";
  }

  // ---------- render helpers ----------

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("zh-CN");
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-6">课程记录</h2>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "pending")}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">未上课</TabsTrigger>
          <TabsTrigger value="completed">已上课</TabsTrigger>
        </TabsList>

        {/* ======================== 未上课 Tab ======================== */}
        <TabsContent value="pending">
          <div className="space-y-2 md:space-y-3">
            {schedulesLoading && !schedules ? (
              <Skeleton type="card" count={3} />
            ) : schedules && schedules.length === 0 ? (
              <EmptyState
                icon={<Calendar size={48} />}
                title="暂无待签到课程"
                description="所有排课已处理完毕，去日历页面添加新的排课"
              />
            ) : (
              schedules?.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex justify-between items-center py-4">
                    <div>
                      <div className="font-semibold">
                        {formatDate(s.date)} {s.startTime} · {s.student.name} · {s.durationMinutes}分钟
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleAction(s.id, "ATTEND")}
                      >
                        <CheckCheck size={14} className="mr-1" />
                        签到
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleAction(s.id, "LEAVE")}
                      >
                        <UserX size={14} className="mr-1" />
                        请假
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ======================== 已上课 Tab ======================== */}
        <TabsContent value="completed">
          {/* toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
            <Select
              value={filterStudent}
              onValueChange={(v) => setFilterStudent(v ?? "all")}
            >
              <SelectTrigger className="w-40">
                <span
                  className={
                    filterStudent !== "all" ? "" : "text-muted-foreground"
                  }
                >
                  {filterStudent !== "all"
                    ? students.find((s) => s.id === filterStudent)?.name ||
                      "未知学生"
                    : "全部学生"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部学生</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* ------ new record dialog ------ */}
            <Dialog
              open={newOpen}
              onOpenChange={(v) => {
                setNewOpen(v);
                if (!v) setError("");
              }}
            >
              <DialogTrigger
                render={<Button className="min-h-[44px]"><Plus size={16} className="mr-1" />新增记录</Button>}
              />
              <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[90dvh] max-md:!rounded-lg">
                <DialogHeader>
                  <DialogTitle>新增课程记录</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNewSubmit} className="space-y-4">
                  <ErrorMessage message={error} />
                  <div className="space-y-2">
                    <Label>学生 *</Label>
                    <Select
                      value={studentId}
                      onValueChange={(v) => setStudentId(v ?? "")}
                    >
                      <SelectTrigger>
                        <span
                          className={
                            studentId ? "" : "text-muted-foreground"
                          }
                        >
                          {students.find((s) => s.id === studentId)?.name ||
                            "选择学生"}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>日期 *</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>时间</Label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>时长（分钟）</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>状态</Label>
                      <Select
                        value={status}
                        onValueChange={(v) => setStatus(v ?? "ATTENDED")}
                      >
                        <SelectTrigger>
                          <span>{statusLabels[status] || status}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ATTENDED">已上课</SelectItem>
                          <SelectItem value="ABSENT">旷课</SelectItem>
                          <SelectItem value="LEAVE">请假</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>曲目/练习内容</Label>
                    <Textarea
                      value={repertoire}
                      onChange={(e) => setRepertoire(e.target.value)}
                      placeholder="如：拜厄 No.45、哈农 No.3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>掌握情况/备注</Label>
                    <Textarea
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>布置作业</Label>
                    <Textarea
                      value={homework}
                      onChange={(e) => setHomework(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full min-h-[44px]"
                    disabled={submitLoading}
                  >
                    {submitLoading ? "保存中..." : "保存记录"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* lesson list */}
          <div className="space-y-2 md:space-y-3">
            {lessonsLoading && !lessons ? (
              <Skeleton type="card" count={3} />
            ) : lessons && lessons.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={48} />}
                title="暂无课程记录"
                description="点击右上角「新增记录」开始记录第一节课"
              />
            ) : (
              lessons?.map((l) => (
                <Card key={l.id}>
                  <CardContent className="flex justify-between items-start py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">
                        {formatDate(l.date)} {l.startTime} · {l.student.name} ·{" "}
                        {l.durationMinutes}分钟
                      </div>
                      {l.repertoire && (
                        <p className="text-sm mt-1">曲目：{l.repertoire}</p>
                      )}
                      {l.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {l.notes}
                        </p>
                      )}
                      {l.homework && (
                        <p className="text-sm mt-1">作业：{l.homework}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Badge variant={statusVariant(l.status)}>
                        {statusLabels[l.status]}
                      </Badge>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEdit(l)}
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================== Edit Dialog ======================== */}
      <Dialog
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) {
            setEditError("");
          }
        }}
      >
        <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[90dvh] max-md:!rounded-lg">
          <DialogHeader>
            <DialogTitle>编辑课程记录</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <ErrorMessage message={editError} />

              <div className="text-sm text-muted-foreground">
                {formatDate(editing.date)} · {editing.student.name}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v ?? "ATTENDED")}
                >
                  <SelectTrigger>
                    <span>{statusLabels[editStatus] || editStatus}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATTENDED">已上课</SelectItem>
                    <SelectItem value="ABSENT">旷课</SelectItem>
                    <SelectItem value="LEAVE">请假</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>曲目/练习内容</Label>
                <Textarea
                  value={editRepertoire}
                  onChange={(e) => setEditRepertoire(e.target.value)}
                  placeholder="如：拜厄 No.45、哈农 No.3"
                />
              </div>
              <div className="space-y-2">
                <Label>掌握情况/备注</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>布置作业</Label>
                <Textarea
                  value={editHomework}
                  onChange={(e) => setEditHomework(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={editLoading}
              >
                {editLoading ? "保存中..." : "保存修改"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
