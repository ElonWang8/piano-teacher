"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ErrorMessage } from "@/components/ui/error-message";
import { X } from "lucide-react";

const statusLabels: Record<string, string> = {
  ATTENDED: "已上课",
  ABSENT: "旷课",
  LEAVE: "请假",
};

const PIANO_TAGS = ["小汤1","小汤2","小汤3","拜厄","车尔尼599","车尔尼849","车尔尼299","哈农","音阶练习"];

export interface LessonFormEditTarget {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
  studentName: string;
}

interface LessonFormProps {
  students: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editLesson?: LessonFormEditTarget | null;
}

export function LessonForm({
  students,
  open,
  onOpenChange,
  onSuccess,
  editLesson,
}: LessonFormProps) {
  const toast = useToast();
  const isEdit = !!editLesson;

  // ---------- form state ----------
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("45");
  const [repertoire, setRepertoire] = useState("");
  const [notes, setNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState("ATTENDED");
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // 检查是否配置了 AI API Key
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.aiApiKey) setHasAiKey(true);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // ---------- AI polish ----------
  async function handleAIPolish() {
    const input = repertoire.trim();
    if (!input || input.length < 5) {
      toast.error("请先输入至少5个字的上课情况描述");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (data.repertoire) setRepertoire(data.repertoire);
      if (data.notes) setNotes(data.notes);
      if (data.homework) setHomework(data.homework);
      if (data._error) {
        toast.error("AI 整理失败，请检查 API 配置");
      } else {
        toast.success("AI 整理完成");
      }
    } catch {
      toast.error("AI 整理失败，请重试");
    } finally {
      setAiLoading(false);
    }
  }

  // ---------- initialize on open ----------
  useEffect(() => {
    if (!open) return;
    setError("");
    setSubmitLoading(false);
    if (editLesson) {
      setStartTime(editLesson.startTime);
      setDuration(String(editLesson.durationMinutes));
      setRepertoire(editLesson.repertoire || "");
      setNotes(editLesson.notes || "");
      setHomework(editLesson.homework || "");
      setStatus(editLesson.status);
    } else {
      setStudentId("");
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setDuration("45");
      setRepertoire("");
      setNotes("");
      setHomework("");
      setStatus("ATTENDED");
    }
  }, [open, editLesson?.id]);

  // ---------- submit ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isEdit && !studentId) {
      setError("请选择学生");
      return;
    }
    if (!isEdit && !date) {
      setError("请选择日期");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/lessons/${editLesson!.id}` : "/api/lessons",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isEdit
              ? {
                  startTime,
                  durationMinutes: parseInt(duration),
                  repertoire,
                  notes,
                  homework,
                  status,
                }
              : {
                  studentId,
                  date,
                  startTime,
                  durationMinutes: parseInt(duration),
                  repertoire,
                  notes,
                  homework,
                  status,
                }
          ),
        }
      );
      if (res.ok) {
        toast.success(isEdit ? "课程记录已更新" : "课程记录已保存");
        onOpenChange(false);
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || (isEdit ? "更新失败" : "保存失败"));
      }
    } catch {
      toast.error(isEdit ? "更新失败，请重试" : "保存失败，请重试");
    } finally {
      setSubmitLoading(false);
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("zh-CN");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setError("");
      }}
    >
      <DialogContent className="max-w-md max-md:!max-w-[calc(100vw-2rem)] max-md:!max-h-[90dvh] max-md:!rounded-lg">
        <button onClick={() => onOpenChange(false)} className="absolute top-3 right-3 z-50 p-1 rounded-full hover:bg-muted md:hidden" aria-label="关闭">
          <X size={20} />
        </button>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "编辑课程记录" : "新增课程记录"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage message={error} />

          {/* Edit mode: read-only date + student */}
          {isEdit && (
            <div className="text-sm text-muted-foreground">
              {formatDate(editLesson!.date)} · {editLesson!.studentName}
            </div>
          )}

          {/* New mode: student + date fields */}
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>学生 *</Label>
                <Select
                  value={studentId}
                  onValueChange={(v) => setStudentId(v ?? "")}
                >
                  <SelectTrigger>
                    <span
                      className={studentId ? "" : "text-muted-foreground"}
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
              <div className="space-y-2">
                <Label>日期 *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Time + duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Status */}
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

          {/* Repertoire */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>曲目/练习内容</Label>
              {isEdit && hasAiKey && (
                <Button type="button" variant="outline" size="sm" onClick={handleAIPolish} disabled={aiLoading}>
                  {aiLoading ? "整理中..." : "AI 整理"}
                </Button>
              )}
            </div>
            <Textarea
              value={repertoire}
              onChange={(e) => setRepertoire(e.target.value)}
              placeholder={isEdit && hasAiKey ? "输入上课情况描述，点击 AI 整理自动填充" : "如：拜厄 No.45、哈农 No.3"}
            />
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PIANO_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => {
                    const prev = repertoire;
                    const parts = prev.split(/[、，,\n]/).map((s: string) => s.trim()).filter(Boolean);
                    setRepertoire(parts.includes(tag) ? prev : (prev ? prev + "、" + tag : tag));
                  }}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>掌握情况/备注</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Homework */}
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
            {submitLoading
              ? "保存中..."
              : isEdit
                ? "保存修改"
                : "保存记录"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
