import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { barkUrl: true, aiApiKey: true } });
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = await req.json();
  const user = await db.user.update({ where: { id: session.user.id }, data: { barkUrl: body.barkUrl, aiApiKey: body.aiApiKey }, select: { barkUrl: true, aiApiKey: true } });
  return NextResponse.json(user);
}
