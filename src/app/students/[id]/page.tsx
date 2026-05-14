"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentForm } from "@/components/students/student-form";
import { ProgressTimeline } from "@/components/students/progress-timeline";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Copy } from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  lessonCount: number;
  notes: string | null;
}

interface StudentDetail {
  id: string;
  name: string;
  age: number | null;
  parentPhone: string | null;
  level: string | null;
  startDate: string | null;
  notes: string | null;
  status?: string;
  lessons: Lesson[];
  payments: Payment[];
  totalLessons: number;
  attendedLessons: number;
  remainingLessons: number;
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useToast();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  async function fetchStudent() {
    const res = await fetch(`/api/students/${id}`);
    if (res.ok) setStudent(await res.json());
  }

  useEffect(() => { fetchStudent(); }, [id]);

  async function copyLesson(lesson: Lesson) {
    const text = `【PianoRecord 上课记录】
学生：${student?.name || ""}
日期：${new Date(lesson.date).toLocaleDateString("zh-CN")} ${lesson.startTime || ""}
${lesson.repertoire ? `曲目：${lesson.repertoire}` : ""}
${lesson.notes ? `掌握情况：${lesson.notes}` : ""}
${lesson.homework ? `本周作业：${lesson.homework}` : ""}`.trim();
    await navigator.clipboard.writeText(text);
    toast.success("已复制，可粘贴发送给家长");
  }

  if (!student) {
    return (
      <div className="p-6">
        <Skeleton type="form" count={1} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="返回">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold">{student.name}</h2>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="编辑" />}>
                <Pencil size={16} />
              </DialogTrigger>
              <DialogContent className="max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
                <DialogHeader><DialogTitle>编辑学生</DialogTitle></DialogHeader>
                <StudentForm
                  student={student}
                  onSuccess={() => { setEditOpen(false); fetchStudent(); toast.success("学生信息已更新"); }}
                  onError={() => toast.error("更新失败")}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground text-sm">
            {student.level || "未设置级别"} · 剩余 {student.remainingLessons} 课时
          </p>
        </div>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">课程记录</TabsTrigger>
          <TabsTrigger value="progress">学习进度</TabsTrigger>
          <TabsTrigger value="payments">费用</TabsTrigger>
          <TabsTrigger value="info">信息</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-4 space-y-2 md:space-y-3">
          {student.lessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无课程记录</p>
          ) : (
            student.lessons.map((l) => (
              <Card key={l.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">
                        {new Date(l.date).toLocaleDateString("zh-CN")} {l.startTime} · {l.durationMinutes}分钟
                      </div>
                      {l.repertoire && <p className="text-sm mt-1">曲目：{l.repertoire}</p>}
                      {l.notes && <p className="text-sm text-muted-foreground mt-1">{l.notes}</p>}
                      {l.homework && <p className="text-sm mt-1">作业：{l.homework}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="复制上课记录"
                        onClick={() => copyLesson(l)}
                        title="复制上课记录"
                      >
                        <Copy size={14} />
                      </Button>
                      <Badge variant={l.status === "ATTENDED" ? "default" : l.status === "ABSENT" ? "destructive" : "secondary"}>
                        {l.status === "ATTENDED" ? "已上课" : l.status === "ABSENT" ? "旷课" : "请假"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <ProgressTimeline lessons={student.lessons} startDate={student.startDate} level={student.level} />
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-6">
          <div>
            <h4 className="font-semibold mb-3">缴费记录</h4>
            {student.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无缴费记录</p>
            ) : (
              student.payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b text-sm">
                  <span>{new Date(p.date).toLocaleDateString("zh-CN")}</span>
                  <span>¥{p.amount} / {p.lessonCount}课时</span>
                  {p.notes && <span className="text-muted-foreground">{p.notes}</span>}
                </div>
              ))
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-3">消课记录</h4>
            {student.lessons.filter(l => l.status === "ATTENDED").length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无消课记录</p>
            ) : (
              student.lessons.filter(l => l.status === "ATTENDED").map((l) => (
                <div key={l.id} className="flex justify-between items-center py-2 border-b text-sm">
                  <span>{new Date(l.date).toLocaleDateString("zh-CN")}</span>
                  <span className="text-muted-foreground">-1 课时</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="py-6 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">姓名</span><span>{student.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">年龄</span><span>{student.age || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">级别</span><span>{student.level || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">状态</span><span>{student.status === "ACTIVE" ? "在读" : student.status === "GRADUATED" ? "毕业" : "肄业"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">家长手机</span><span>{student.parentPhone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">备注</span><span>{student.notes || "-"}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
