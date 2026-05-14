"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, BookOpen, Pencil, CheckCheck, UserX, Calendar, Copy } from "lucide-react";
import { LessonForm, type LessonFormEditTarget } from "@/components/lessons/lesson-form";

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

  // ---------- edit dialog ----------
  const [editTarget, setEditTarget] = useState<LessonFormEditTarget | null>(null);

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

  // ---------- edit helper ----------

  function openEdit(lesson: LessonItem) {
    setEditTarget({
      id: lesson.id,
      date: lesson.date,
      startTime: lesson.startTime,
      durationMinutes: lesson.durationMinutes,
      repertoire: lesson.repertoire,
      notes: lesson.notes,
      homework: lesson.homework,
      status: lesson.status,
      studentName: lesson.student.name,
    });
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

  async function copyLesson(lesson: LessonItem) {
    const text = `【PianoRecord 上课记录】
学生：${lesson.student?.name || ""}
日期：${new Date(lesson.date).toLocaleDateString("zh-CN")} ${lesson.startTime || ""}
${lesson.repertoire ? `曲目：${lesson.repertoire}` : ""}
${lesson.notes ? `掌握情况：${lesson.notes}` : ""}
${lesson.homework ? `本周作业：${lesson.homework}` : ""}`.trim();
    await navigator.clipboard.writeText(text);
    toast.success("已复制，可粘贴发送给家长");
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
                        aria-label="签到"
                        onClick={() => handleScheduleAction(s.id, "ATTEND")}
                      >
                        <CheckCheck size={14} className="mr-1" />
                        签到
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label="请假"
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

            <Button
              className="min-h-[44px]"
              onClick={() => setNewOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              新增记录
            </Button>
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
                        aria-label="复制上课记录"
                        onClick={() => copyLesson(l)}
                        title="复制上课记录"
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="编辑"
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

      {/* ======================== New Lesson Dialog ======================== */}
      <LessonForm
        students={students}
        open={newOpen}
        onOpenChange={setNewOpen}
        onSuccess={fetchLessons}
      />

      {/* ======================== Edit Lesson Dialog ======================== */}
      <LessonForm
        students={students}
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null);
        }}
        onSuccess={fetchLessons}
        editLesson={editTarget}
      />
    </div>
  );
}
