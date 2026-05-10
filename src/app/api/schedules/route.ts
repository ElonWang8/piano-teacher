import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const schedules = await db.schedule.findMany({
    where: {
      student: { userId: session.user.id },
      ...(month ? {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-31`),
        },
      } : {}),
    },
    include: { student: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, date, startTime, durationMinutes, repeatRule } = body;

  if (!studentId || !date) {
    return NextResponse.json({ error: "请选择学生和日期" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const schedule = await db.schedule.create({
    data: {
      studentId,
      date: new Date(date),
      startTime: startTime || "09:00",
      durationMinutes: durationMinutes || 45,
      repeatRule: repeatRule || null,
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(schedule, { status: 201 });
}
