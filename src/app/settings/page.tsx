"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setSaved(true);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">设置</h2>
      <Card className="max-w-md">
        <CardHeader><CardTitle>个人资料</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={session?.user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit">保存</Button>
            {saved && <p className="text-sm text-green-600">已保存</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
