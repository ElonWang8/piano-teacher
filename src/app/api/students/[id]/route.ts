import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getStudent(id: string, userId: string) {
  const student = await db.student.findFirst({
    where: { id, userId },
    include: {
      lessons: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      _count: { select: { lessons: true } },
    },
  });
  return student;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const student = await getStudent(id, session.user.id);
  if (!student)
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const totalPaid = student.payments.reduce((s, p) => s + p.lessonCount, 0);
  const attendedCount = student.lessons.filter(
    (l) => l.status === "ATTENDED"
  ).length;

  return NextResponse.json({
    ...student,
    totalLessons: totalPaid,
    attendedLessons: attendedCount,
    remainingLessons: totalPaid - attendedCount,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!student)
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const body = await req.json();
  const updated = await db.student.update({
    where: { id },
    data: {
      name: body.name,
      age: body.age,
      parentPhone: body.parentPhone,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      level: body.level,
      notes: body.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  const student = await db.student.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!student)
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  await db.student.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
