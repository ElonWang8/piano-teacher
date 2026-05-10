import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const lessons = await db.lesson.findMany({
    where: {
      student: { userId: session.user.id },
      ...(studentId ? { studentId } : {}),
    },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(lessons);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, date, startTime, durationMinutes, repertoire, notes, homework, status } = body;

  if (!studentId || !date) {
    return NextResponse.json({ error: "请选择学生和日期" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const lesson = await db.lesson.create({
    data: {
      studentId,
      date: new Date(date),
      startTime: startTime || "09:00",
      durationMinutes: durationMinutes || 45,
      repertoire: repertoire || null,
      notes: notes || null,
      homework: homework || null,
      status: status || "ATTENDED",
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(lesson, { status: 201 });
}
