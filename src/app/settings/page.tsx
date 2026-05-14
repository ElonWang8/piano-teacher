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

  // 用户设置（从 API 加载，兼容 localStorage 旧数据）
  const [barkUrl, setBarkUrl] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiApiUrl, setAiApiUrl] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [barkSaved, setBarkSaved] = useState(false);
  const [, setSettingsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.barkUrl) setBarkUrl(data.barkUrl);
          else {
            const saved = localStorage.getItem("barkUrl") || "";
            if (saved) setBarkUrl(saved);
          }
          if (data.aiApiKey) setAiApiKey(data.aiApiKey);
          if (data.aiApiUrl) setAiApiUrl(data.aiApiUrl);
          if (data.aiModel) setAiModel(data.aiModel);
        } else {
          const saved = localStorage.getItem("barkUrl") || "";
          if (saved) setBarkUrl(saved);
        }
      } catch {
        const saved = localStorage.getItem("barkUrl") || "";
        if (saved) setBarkUrl(saved);
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  async function saveSettings() {
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barkUrl, aiApiKey, aiApiUrl, aiModel }),
      });
      if (res.ok) {
        if (barkUrl) localStorage.setItem("barkUrl", barkUrl);
        else localStorage.removeItem("barkUrl");
        setBarkSaved(true);
        toast.success("设置已保存");
        setTimeout(() => setBarkSaved(false), 2000);
      } else {
        toast.error("保存失败");
      }
    } catch {
      toast.error("保存失败，请重试");
    }
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
            <Button onClick={saveSettings}>{barkSaved ? "已保存" : "保存"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🤖 AI 整理配置</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label>接口地址</Label>
              <Input value={aiApiUrl} onChange={e => setAiApiUrl(e.target.value)}
                placeholder="https://api.deepseek.com/chat/completions" />
            </div>
            <div className="space-y-2">
              <Label>模型名称</Label>
              <Input value={aiModel} onChange={e => setAiModel(e.target.value)}
                placeholder="deepseek-chat" />
            </div>
            <p className="text-xs text-muted-foreground">兼容 OpenAI 格式的 API。支持 DeepSeek / OpenAI / Groq / Ollama 等。留空则使用默认值。</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>常用：</span>
              <button type="button" className="underline hover:text-foreground"
                onClick={() => { setAiApiUrl("https://api.deepseek.com/chat/completions"); setAiModel("deepseek-chat"); }}>DeepSeek</button>
              <span>·</span>
              <button type="button" className="underline hover:text-foreground"
                onClick={() => { setAiApiUrl("https://api.openai.com/v1/chat/completions"); setAiModel("gpt-4o-mini"); }}>OpenAI</button>
              <span>·</span>
              <button type="button" className="underline hover:text-foreground"
                onClick={() => { setAiApiUrl("https://api.groq.com/openai/v1/chat/completions"); setAiModel("llama-3.1-8b-instant"); }}>Groq</button>
              <span>·</span>
              <button type="button" className="underline hover:text-foreground"
                onClick={() => { setAiApiUrl("http://localhost:11434/v1/chat/completions"); setAiModel("qwen2.5"); }}>Ollama</button>
            </div>
            <Button onClick={saveSettings}>{barkSaved ? "已保存" : "保存"}</Button>
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
