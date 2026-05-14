"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export default function SettingsPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const [name, setName] = useState(session?.user?.name || "");
  const [backupLoading, setBackupLoading] = useState(false);

  // Bark 通知配置
  const [barkUrl, setBarkUrl] = useState("");
  const [barkSaved, setBarkSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("barkUrl") || "";
    setBarkUrl(saved);
  }, []);

  function saveBark() {
    localStorage.setItem("barkUrl", barkUrl);
    setBarkSaved(true);
    toast.success("Bark 通知已配置");
    setTimeout(() => setBarkSaved(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.info("此功能即将上线");
  }

  async function handleBackup() {
    setBackupLoading(true);
    try {
      const res = await fetch("/api/backup");
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `piano-teacher-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("备份已下载");
      } else {
        toast.error("备份失败");
      }
    } catch {
      toast.error("备份失败，请重试");
    } finally {
      setBackupLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold mb-6">设置</h2>
      <div className="space-y-6 max-w-md">
        <Card>
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
              <Button type="submit" className="min-h-[44px]">保存</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bark 通知</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bark URL</Label>
              <Input value={barkUrl} onChange={e => setBarkUrl(e.target.value)}
                placeholder="https://api.day.app/your-key/" />
              <p className="text-xs text-muted-foreground">签到、排课等操作完成后推送通知到手机</p>
            </div>
            <Button onClick={saveBark}>{barkSaved ? "已保存" : "保存"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>主题切换</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              选择你喜欢的界面配色方案
            </p>
            <ThemeSwitcher />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>数据备份</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              导出所有学生、课程和缴费记录的 JSON 备份文件
            </p>
            <Button onClick={handleBackup} disabled={backupLoading} variant="outline">
              <Download size={16} className="mr-2" />
              {backupLoading ? "导出中..." : "导出备份"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
