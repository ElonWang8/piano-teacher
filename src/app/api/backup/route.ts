import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  // Check for backup secret (used by docker backup service)
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const backupSecret = process.env.BACKUP_SECRET;

  if (backupSecret && secret === backupSecret) {
    // Service-level backup: export all data
    const students = await db.student.findMany({
      include: {
        lessons: { orderBy: { date: "desc" } },
        payments: { orderBy: { date: "desc" } },
        schedules: { orderBy: { date: "desc" } },
      },
    });

    const user = await db.user.findFirst({
      select: { name: true, email: true, phone: true },
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      user,
      students,
    });
  }

  // Normal session-based access
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const students = await db.student.findMany({
    where: { userId: session.user.id },
    include: {
      lessons: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      schedules: { orderBy: { date: "desc" } },
    },
  });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  const backup = {
    exportedAt: new Date().toISOString(),
    user,
    students,
  };

  return NextResponse.json(backup);
}
