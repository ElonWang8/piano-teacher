import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const students = await db.student.findMany({
    where: { userId: session.user.id },
    include: {
      payments: true,
      _count: { select: { lessons: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = students.map((s) => {
    const totalPaid = s.payments.reduce((sum, p) => sum + p.lessonCount, 0);
    const attendedCount = s._count.lessons;
    return {
      id: s.id,
      name: s.name,
      age: s.age,
      level: s.level,
      parentPhone: s.parentPhone,
      startDate: s.startDate,
      notes: s.notes,
      totalLessons: totalPaid,
      attendedLessons: attendedCount,
      remainingLessons: totalPaid - attendedCount,
      createdAt: s.createdAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { name, age, parentPhone, startDate, level, notes } = body;
  if (!name)
    return NextResponse.json({ error: "学生姓名不能为空" }, { status: 400 });

  const student = await db.student.create({
    data: {
      userId: session.user.id,
      name,
      age: age || null,
      parentPhone: parentPhone || null,
      startDate: startDate ? new Date(startDate) : null,
      level: level || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
