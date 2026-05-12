import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    let students: { name: string; age?: number; level?: string; parentPhone?: string; status?: string; notes?: string }[] = [];

    if (file.name.endsWith(".json")) {
      const text = await file.text();
      students = JSON.parse(text);
      if (!Array.isArray(students)) {
        return NextResponse.json({ error: "JSON 文件内容应为数组" }, { status: 400 });
      }
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
      students = data.map(row => ({
        name: String(row["姓名"] || row["name"] || ""),
        age: row["年龄"] || row["age"] ? Number(row["年龄"] || row["age"]) : undefined,
        level: row["级别"] || row["level"] ? String(row["级别"] || row["level"]) : undefined,
        parentPhone: row["家长手机号"] || row["parentPhone"] ? String(row["家长手机号"] || row["parentPhone"]) : undefined,
        status: row["状态"] || row["status"] ? String(row["状态"] || row["status"]) : undefined,
        notes: row["备注"] || row["notes"] ? String(row["备注"] || row["notes"]) : undefined,
      }));
    }

    // 验证必填字段
    const invalid = students.filter(s => !s.name || s.name.trim() === "");
    if (invalid.length > 0) {
      return NextResponse.json({ error: `第 ${students.indexOf(invalid[0]) + 1} 行缺少学生姓名` }, { status: 400 });
    }

    // 批量创建
    let created = 0;
    let skipped = 0;
    for (const s of students) {
      const existing = await db.student.findFirst({
        where: { name: s.name.trim(), userId: session.user.id },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await db.student.create({
        data: {
          userId: session.user.id,
          name: s.name.trim(),
          age: s.age || null,
          level: s.level || null,
          parentPhone: String(s.parentPhone || ""),
          status: s.status || "ACTIVE",
          notes: s.notes || null,
        },
      });
      created++;
    }

    return NextResponse.json({ created, skipped, total: students.length });
  } catch {
    return NextResponse.json({ error: "文件解析失败，请检查文件格式" }, { status: 400 });
  }
}
