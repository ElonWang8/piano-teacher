import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const todayLessons = await db.lesson.count({
    where: { student: { userId: session.user.id }, date: { gte: todayStart, lt: todayEnd } },
  });

  const todayAttended = await db.lesson.count({
    where: { student: { userId: session.user.id }, date: { gte: todayStart, lt: todayEnd }, status: "ATTENDED" },
  });

  const todaySchedules = await db.schedule.findMany({
    where: { student: { userId: session.user.id }, date: { gte: todayStart, lt: todayEnd } },
    include: { student: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  const monthLessons = await db.lesson.count({
    where: { student: { userId: session.user.id }, date: { gte: monthStart, lte: monthEnd } },
  });

  const monthAttended = await db.lesson.count({
    where: { student: { userId: session.user.id }, date: { gte: monthStart, lte: monthEnd }, status: "ATTENDED" },
  });

  const monthSchedules = await db.schedule.count({
    where: { student: { userId: session.user.id }, date: { gte: monthStart, lte: monthEnd } },
  });

  const monthPayments = await db.payment.aggregate({
    where: { student: { userId: session.user.id }, date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });

  const studentCount = await db.student.count({ where: { userId: session.user.id } });

  const recentLessons = await db.lesson.findMany({
    where: { student: { userId: session.user.id } },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  const attendanceRate = monthLessons > 0 ? Math.round((monthAttended / monthLessons) * 100) : 0;

  return NextResponse.json({
    today: {
      lessonCount: todayLessons,
      attendedCount: todayAttended,
      pendingCount: todaySchedules.length,
      schedules: todaySchedules.map((s) => ({
        id: s.id, time: s.startTime, studentName: s.student.name, durationMinutes: s.durationMinutes,
      })),
    },
    month: {
      lessonCount: monthLessons, attendedCount: monthAttended,
      income: monthPayments._sum.amount || 0, studentCount, attendanceRate,
      scheduleCount: monthSchedules + monthAttended,
    },
    recentLessons: recentLessons.map((l) => ({
      id: l.id, date: l.date, studentName: l.student.name, repertoire: l.repertoire,
    })),
  });
}
