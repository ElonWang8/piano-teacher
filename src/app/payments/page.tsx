"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard } from "lucide-react";

interface Student { id: string; name: string; }
interface Payment {
  id: string;
  date: string;
  amount: number;
  lessonCount: number;
  notes: string | null;
  student: { name: string };
}
interface Lesson {
  id: string;
  date: string;
  student: { name: string };
}

export default function PaymentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [consumedLessons, setConsumedLessons] = useState<Lesson[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // form state
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [lessonCount, setLessonCount] = useState("");
  const [notes, setNotes] = useState("");

  // form validation errors
  const [formErrors, setFormErrors] = useState<{ amount?: string; lessonCount?: string }>({});

  async function fetchPayments() {
    const res = await fetch("/api/payments");
    setPayments(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  async function fetchConsumedLessons() {
    const res = await fetch("/api/lessons");
    const all = await res.json();
    if (Array.isArray(all)) {
      setConsumedLessons(all.filter((l: Lesson & { status: string }) => l.status === "ATTENDED"));
    }
  }

  useEffect(() => {
    Promise.all([fetchStudents(), fetchPayments(), fetchConsumedLessons()]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const errors: { amount?: string; lessonCount?: string } = {};
    const amt = parseInt(amount);
    const cnt = parseInt(lessonCount);
    if (isNaN(amt) || amt <= 0) errors.amount = "金额必须大于0";
    if (isNaN(cnt) || cnt <= 0) errors.lessonCount = "课时数必须大于0";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        date,
        amount: amt,
        lessonCount: cnt,
        notes,
      }),
    });
    if (res.ok) {
      toast.success("缴费记录已保存");
      setOpen(false);
      fetchPayments();
      setAmount("");
      setLessonCount("");
      setNotes("");
      setFormErrors({});
    } else {
      toast.error("保存失败，请重试");
    }
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidLessons = payments.reduce((sum, p) => sum + p.lessonCount, 0);
  const totalConsumed = consumedLessons.length;
  const remainingLessons = totalPaidLessons - totalConsumed;

  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <h2 className="text-xl md:text-2xl font-bold">费用管理</h2>
        </div>
        <Skeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">费用管理</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="min-h-[44px]"><Plus size={16} className="mr-1" />新增缴费</Button>} />
          <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[90dvh] max-md:!rounded-lg">
            <DialogHeader><DialogTitle>新增缴费记录</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>学生 *</Label>
                <Select value={studentId} onValueChange={(v) => setStudentId(v ?? "")}>
                  <SelectTrigger>
                    <span className={studentId ? "" : "text-muted-foreground"}>
                      {students.find(s => s.id === studentId)?.name || "选择学生"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>日期</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>金额（元）*</Label>
                  <Input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setFormErrors(prev => ({ ...prev, amount: undefined })); }} placeholder="0" required />
                  {formErrors.amount && <ErrorMessage message={formErrors.amount} />}
                </div>
                <div className="space-y-2">
                  <Label>课时数 *</Label>
                  <Input type="number" value={lessonCount} onChange={(e) => { setLessonCount(e.target.value); setFormErrors(prev => ({ ...prev, lessonCount: undefined })); }} placeholder="0" required />
                  {formErrors.lessonCount && <ErrorMessage message={formErrors.lessonCount} />}
                </div>
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="如：2024年春季学期费用" />
              </div>
              <Button type="submit" className="w-full">保存记录</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-primary">¥{totalAmount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">总缴费金额</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{totalPaidLessons}</div>
            <div className="text-sm text-muted-foreground mt-1">总购买课时</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{remainingLessons}</div>
            <div className="text-sm text-muted-foreground mt-1">剩余课时</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="mb-6">
          <TabsTrigger value="payments">缴费记录</TabsTrigger>
          <TabsTrigger value="consumption">消课记录</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="space-y-2 md:space-y-3">
            {payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-semibold">
                      {new Date(p.date).toLocaleDateString("zh-CN")} · {p.student.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      缴费 ¥{p.amount.toLocaleString()} · {p.lessonCount} 课时
                    </div>
                    {p.notes && (
                      <div className="text-sm text-muted-foreground mt-0.5">备注：{p.notes}</div>
                    )}
                  </div>
                  <Badge variant="default">+{p.lessonCount} 课时</Badge>
                </CardContent>
              </Card>
            ))}
            {payments.length === 0 && (
              <EmptyState icon={<CreditCard size={48} />} title="暂无缴费记录" description="点击右上角「新增缴费」添加第一笔缴费记录" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="consumption">
          <div className="space-y-2 md:space-y-3">
            {consumedLessons.map((l) => (
              <Card key={l.id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-semibold">
                      {new Date(l.date).toLocaleDateString("zh-CN")} · {l.student.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">已上课，消耗 1 课时</div>
                  </div>
                  <Badge variant="secondary">-1 课时</Badge>
                </CardContent>
              </Card>
            ))}
            {consumedLessons.length === 0 && (
              <p className="text-center text-muted-foreground py-12">暂无消课记录</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
