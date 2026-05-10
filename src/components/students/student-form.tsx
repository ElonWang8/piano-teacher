"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  student?: {
    id: string;
    name: string;
    age: number | null;
    parentPhone: string | null;
    level: string | null;
    notes: string | null;
  };
  onSuccess: () => void;
}

export function StudentForm({ student, onSuccess }: Props) {
  const [name, setName] = useState(student?.name || "");
  const [age, setAge] = useState(student?.age?.toString() || "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone || "");
  const [level, setLevel] = useState(student?.level || "");
  const [notes, setNotes] = useState(student?.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = student ? `/api/students/${student.id}` : "/api/students";
    const method = student ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age: age ? parseInt(age) : null, parentPhone, level, notes }),
    });
    if (res.ok) onSuccess();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">姓名 *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">年龄</Label>
          <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">级别/阶段</Label>
          <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="如：拜厄、车尔尼599" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">家长手机号</Label>
        <Input id="phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "保存中..." : student ? "更新学生" : "添加学生"}
      </Button>
    </form>
  );
}
