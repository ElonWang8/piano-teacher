"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Student { id: string; name: string; }
interface Lesson {
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

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [filterStudent, setFilterStudent] = useState("all");

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("45");
  const [repertoire, setRepertoire] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState("ATTENDED");

  async function fetchLessons() {
    const url = filterStudent !== "all"
      ? `/api/lessons?studentId=${filterStudent}`
      : "/api/lessons";
    const res = await fetch(url);
    setLessons(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchLessons(); }, [filterStudent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId, date, startTime,
        durationMinutes: parseInt(duration),
        repertoire, notes: lessonNotes, homework, status,
      }),
    });
    if (res.ok) {
      setOpen(false);
      fetchLessons();
      setRepertoire(""); setLessonNotes(""); setHomework("");
    }
  }

  const statusLabels: Record<string, string> = {
    ATTENDED: "已上课", ABSENT: "旷课", LEAVE: "请假",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">课程记录</h2>
        <div className="flex items-center gap-3">
          <Select value={filterStudent} onValueChange={(v) => setFilterStudent(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="筛选学生" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学生</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus size={16} className="mr-1" />新增记录</Button>} />
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>新增课程记录</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>学生 *</Label>
                  <Select value={studentId} onValueChange={(v) => setStudentId(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>日期 *</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>时间</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>时长（分钟）</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v ?? "ATTENDED")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Textarea value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="如：拜厄 No.45、哈农 No.3" />
                </div>
                <div className="space-y-2">
                  <Label>掌握情况/备注</Label>
                  <Textarea value={lessonNotes} onChange={(e) => setLessonNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>布置作业</Label>
                  <Textarea value={homework} onChange={(e) => setHomework(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">保存记录</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {lessons.map((l) => (
          <Card key={l.id}>
            <CardContent className="flex justify-between items-start py-4">
              <div>
                <div className="font-semibold">
                  {new Date(l.date).toLocaleDateString("zh-CN")} {l.startTime} · {l.student.name} · {l.durationMinutes}分钟
                </div>
                {l.repertoire && <p className="text-sm mt-1">曲目：{l.repertoire}</p>}
                {l.notes && <p className="text-sm text-muted-foreground mt-1">{l.notes}</p>}
                {l.homework && <p className="text-sm mt-1">作业：{l.homework}</p>}
              </div>
              <Badge variant={l.status === "ATTENDED" ? "default" : l.status === "ABSENT" ? "destructive" : "secondary"}>
                {statusLabels[l.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {lessons.length === 0 && (
          <p className="text-center text-muted-foreground py-12">暂无课程记录</p>
        )}
      </div>
    </div>
  );
}
