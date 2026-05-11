import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, startDate, endDate, weekdays, startTime, durationMinutes } =
    body;

  if (!studentId || !startDate || !endDate || !weekdays?.length) {
    return NextResponse.json({ error: "请填写必填字段" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student)
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const dates: Date[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length === 0) {
    return NextResponse.json(
      { error: "所选日期范围内没有匹配的星期" },
      { status: 400 },
    );
  }

  await db.schedule.createMany({
    data: dates.map((d) => ({
      studentId,
      date: d,
      startTime: startTime || "18:00",
      durationMinutes: durationMinutes || 45,
    })),
  });

  return NextResponse.json({ count: dates.length });
}
