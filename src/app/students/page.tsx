"use client";

import { useState, useEffect, useRef } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, Plus, Users, Trash2, Download, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  name: string;
  age: number | null;
  level: string | null;
  remainingLessons: number;
  createdAt: string;
  parentPhone?: string | null;
  status?: string;
  notes?: string | null;
  totalLessons?: number;
  pendingSchedules?: number;
}

export default function StudentsPage() {
  const toast = useToast();
  const [data, setData] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function promptDelete(id: string, name: string) {
    setDeleteConfirm({ id, name });
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
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
      setDeleteConfirm(null);
    }
  }

  function handleExport() {
    if (!data || data.length === 0) {
      toast.error("暂无数据可导出");
      return;
    }
    const rows = data.map(s => ({
      "姓名": s.name,
      "年龄": s.age || "",
      "级别": s.level || "",
      "家长手机号": s.parentPhone || "",
      "状态": s.status || "",
      "备注": s.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "学生列表");
    XLSX.writeFile(wb, `学生列表-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("导出成功");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportResult("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok) {
        setImportResult(`成功导入 ${json.created} 人，跳过 ${json.skipped} 人（已存在）`);
        toast.success(`导入完成：新增 ${json.created} 人`);
        fetchStudents();
      } else {
        setImportResult(json.error || "导入失败");
        toast.error(json.error || "导入失败");
      }
    } catch {
      console.error("学生导入失败");
      setImportResult("导入失败，请重试");
      toast.error("导入失败，请重试");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const filtered = data?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <h2 className="text-xl md:text-2xl font-bold">学生管理</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="min-h-[44px]" onClick={handleExport}>
            <Download size={16} className="mr-1" />
            导出 Excel
          </Button>
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger render={<Button variant="outline" className="min-h-[44px]"><Upload size={16} className="mr-1" />导入</Button>} />
            <DialogContent className="max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
              <button onClick={() => setImportOpen(false)} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
                <X size={20} />
              </button>
              <DialogHeader><DialogTitle>导入学生</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  支持 Excel (.xlsx/.xls) 或 JSON 文件。Excel 列：姓名(必填)、年龄、级别、家长手机号、状态、备注
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.json"
                  onChange={handleImport}
                  disabled={importLoading}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#2da44e] file:text-white hover:file:bg-[#2da44e]/90"
                />
                {importLoading && <p className="text-sm text-muted-foreground">导入中...</p>}
                {importResult && <p className="text-sm text-muted-foreground">{importResult}</p>}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
            <DialogTrigger render={<Button className="min-h-[44px]"><Plus size={16} className="mr-1" />添加学生</Button>} />
            <DialogContent className="max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[85dvh] max-md:!rounded-lg">
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
                <X size={20} />
              </button>
              <DialogHeader><DialogTitle>添加学生</DialogTitle></DialogHeader>
              <ErrorMessage message={error} />
              <StudentForm onSuccess={() => { setOpen(false); fetchStudents(); toast.success("学生添加成功"); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="搜索" />
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

      <div className="grid gap-2 md:gap-3">
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
                      <div className="w-10 h-10 rounded-full bg-[#2da44e] flex items-center justify-center text-white font-bold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {s.level || "未设置级别"} {s.age ? `· ${s.age}岁` : ""}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>📋 {s.totalLessons || 0} 节已上</span>
                          <span>📅 {s.pendingSchedules || 0} 节待上</span>
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
                aria-label="删除"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); promptDelete(s.id, s.name); }}
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

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}
        title="确认删除"
        message={`确定删除学生「${deleteConfirm?.name || ""}」？此操作不可撤销。`}
        onConfirm={handleDelete}
        loading={!!deleteConfirm && deleteLoading === deleteConfirm.id}
      />
    </div>
  );
}
