import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const payments = await db.payment.findMany({
    where: { student: { userId: session.user.id } },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, date, amount, lessonCount, notes } = body;

  if (!studentId || !amount || !lessonCount) {
    return NextResponse.json({ error: "请填写必填字段" }, { status: 400 });
  }
  if (amount <= 0 || lessonCount <= 0) {
    return NextResponse.json({ error: "金额和课时数必须大于0" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const payment = await db.payment.create({
    data: {
      studentId,
      date: date ? new Date(date) : new Date(),
      amount,
      lessonCount,
      notes: notes || null,
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(payment, { status: 201 });
}
