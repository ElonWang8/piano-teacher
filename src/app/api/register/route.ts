import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }
    const passwordHash = await hash(password, 12);
    const user = await db.user.create({
      data: { name, email, passwordHash },
    });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
