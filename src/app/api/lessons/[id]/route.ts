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

  const lesson = await db.lesson.findFirst({
    where: { id, student: { userId: session.user.id } },
  });
  if (!lesson)
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const body = await req.json();
  const updated = await db.lesson.update({
    where: { id },
    data: {
      repertoire: body.repertoire,
      notes: body.notes,
      homework: body.homework,
      status: body.status,
      startTime: body.startTime,
      durationMinutes: body.durationMinutes,
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}
