import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const schedule = await db.schedule.findFirst({
    where: { id, student: { userId: session.user.id } },
  });
  if (!schedule)
    return NextResponse.json({ error: "排课不存在" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  await db.lesson.create({
    data: {
      studentId: schedule.studentId,
      date: schedule.date,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
      status: action === "ATTEND" ? "ATTENDED" : "LEAVE",
    },
  });

  await db.schedule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const schedule = await db.schedule.findFirst({
    where: { id, student: { userId: session.user.id } },
  });
  if (!schedule)
    return NextResponse.json({ error: "排课不存在" }, { status: 404 });

  const body = await req.json();
  const { startTime, durationMinutes, date } = body;

  const updated = await db.schedule.update({
    where: { id },
    data: {
      ...(startTime !== undefined ? { startTime } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}
