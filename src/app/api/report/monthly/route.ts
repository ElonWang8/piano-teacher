import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get("month");
  if (!monthStr) return NextResponse.json({ error: "请指定月份，如 ?month=2026-05" }, { status: 400 });

  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return NextResponse.json({ error: "月份格式应为 YYYY-MM" }, { status: 400 });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // 获取该用户所有学生
  const students = await db.student.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });

  const studentIds = students.map(s => s.id);

  // 获取本月所有课程记录
  const lessons = await db.lesson.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: {
      studentId: true,
      status: true,
    },
  });

  // 获取本月所有缴费记录
  const payments = await db.payment.findMany({
    where: {
      studentId: { in: studentIds },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: {
      studentId: true,
      amount: true,
      lessonCount: true,
    },
  });

  // 构建学生维度报表
  const report = students.map(s => {
    const sLessons = lessons.filter(l => l.studentId === s.id);
    const sPayments = payments.filter(p => p.studentId === s.id);

    const totalLessons = sLessons.length;
    const attended = sLessons.filter(l => l.status === "ATTENDED").length;
    const absent = sLessons.filter(l => l.status === "ABSENT").length;
    const leave = sLessons.filter(l => l.status === "LEAVE").length;
    const totalPayment = sPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalLessonCount = sPayments.reduce((sum, p) => sum + p.lessonCount, 0);
    const attendanceRate = totalLessons > 0 ? Math.round((attended / totalLessons) * 100) : 0;

    return {
      studentId: s.id,
      studentName: s.name,
      totalLessons,
      attended,
      absent,
      leave,
      attendanceRate,
      totalPayment,
      totalLessonCount,
    };
  });

  return NextResponse.json({ month: monthStr, report });
}
