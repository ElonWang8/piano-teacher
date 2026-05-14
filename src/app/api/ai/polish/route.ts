import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { text } = await req.json();
  if (!text || text.length < 5) return NextResponse.json({ error: "内容太短" }, { status: 400 });

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://api.deepseek.com/chat/completions";
  const model = process.env.AI_MODEL || "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json({
      repertoire: text,
      notes: "",
      homework: "",
      _raw: true,
    });
  }

  const prompt = `你是一位经验丰富的钢琴教师。请将学生家长/老师用大白话描述的上课情况，整理成专业的钢琴教学记录。

请输出 JSON 格式，包含三个字段：
- repertoire: 本节课练习的曲目（用顿号分隔）
- notes: 掌握情况和存在的问题（专业术语，简洁）
- homework: 本周作业（具体、可执行）

大白话内容：${text}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return NextResponse.json({
      repertoire: result.repertoire || text,
      notes: result.notes || "",
      homework: result.homework || "",
    });
  } catch {
    return NextResponse.json({ repertoire: text, notes: "", homework: "", _error: true });
  }
}
