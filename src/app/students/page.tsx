"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentForm } from "@/components/students/student-form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Search, Plus, Users, Trash2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number | null;
  level: string | null;
  remainingLessons: number;
  createdAt: string;
}

export default function StudentsPage() {
  const toast = useToast();
  const [data, setData] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const statusOptions = [
    { value: "", label: "全部" },
    { value: "ACTIVE", label: "在读" },
    { value: "GRADUATED", label: "毕业" },
    { value: "DROPPED", label: "肄业" },
  ];

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students${statusFilter ? `?status=${statusFilter}` : ""}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudents(); }, [statusFilter]);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`确定删除学生「${name}」？`)) return;
    setDeleteLoading(id);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`已删除学生「${name}」`);
        fetchStudents();
      } else {
        toast.error("删除失败，请重试");
      }
    } catch {
      toast.error("删除失败，请重试");
    } finally {
      setDeleteLoading(null);
    }
  }

  const filtered = data?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">学生管理</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
          <DialogTrigger render={<Button><Plus size={16} className="mr-1" />添加学生</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>添加学生</DialogTitle></DialogHeader>
            <ErrorMessage message={error} />
            <StudentForm onSuccess={() => { setOpen(false); fetchStudents(); toast.success("学生添加成功"); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="搜索学生姓名..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 mb-4">
        {statusOptions.map(opt => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(opt.value); }}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3">
        {loading && !data ? (
          <Skeleton type="card" count={3} />
        ) : data && data.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="暂无学生"
            description="点击右上角「添加学生」录入第一个学生"
          />
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="relative group">
              <Link href={`/students/${s.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {s.level || "未设置级别"} {s.age ? `· ${s.age}岁` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={s.remainingLessons > 0 ? "default" : "destructive"}>
                        剩余 {s.remainingLessons} 课时
                      </Badge>
                      <span className="text-sm text-muted-foreground">›</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={deleteLoading === s.id}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(s.id, s.name); }}
              >
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          ))
        )}
        {data && data.length > 0 && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">未找到匹配的学生</p>
        )}
      </div>
    </div>
  );
}
