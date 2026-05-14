import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请提供要删除的 ID 列表" }, { status: 400 });
  }
  await db.lesson.deleteMany({
    where: { id: { in: ids }, student: { userId: session.user.id } },
  });
  return NextResponse.json({ success: true, count: ids.length });
}
