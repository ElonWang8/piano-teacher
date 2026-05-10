"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentForm } from "@/components/students/student-form";
import { Search, Plus } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number | null;
  level: string | null;
  remainingLessons: number;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  async function fetchStudents() {
    const res = await fetch("/api/students");
    const data = await res.json();
    setStudents(data);
  }

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">学生管理</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus size={16} className="mr-1" />添加学生
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加学生</DialogTitle></DialogHeader>
            <StudentForm onSuccess={() => { setOpen(false); fetchStudents(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="搜索学生姓名..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered.map((s) => (
          <Link key={s.id} href={`/students/${s.id}`}>
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
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">暂无学生</p>
        )}
      </div>
    </div>
  );
}
