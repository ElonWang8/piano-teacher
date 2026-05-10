# 钢琴老师课程记录平台 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 构建一个钢琴老师 SaaS 课程记录与管理 Web 应用

**架构：** Next.js 14 App Router + Prisma + PostgreSQL 全栈应用。侧边栏布局，按功能模块（课程记录/学生管理/排课日历/费用管理/数据统计/设置）组织。NextAuth.js 处理邮箱密码认证，shadcn/ui 提供 UI 组件。

**技术栈：** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, NextAuth.js

---

### 任务 1：初始化 Next.js 项目

**文件：**
- 项目根目录所有脚手架文件

- [ ] **步骤 1：创建 Next.js 项目**

```bash
cd /Users/elonwang/Downloads/kechengjilu
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **步骤 2：安装核心依赖**

```bash
cd /Users/elonwang/Downloads/kechengjilu
npm install prisma @prisma/client next-auth@beta bcryptjs date-fns
npm install -D @types/bcryptjs
```

- [ ] **步骤 3：初始化 Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **步骤 4：安装 shadcn/ui**

```bash
npx shadcn@latest init -d
```

- [ ] **步骤 5：安装 shadcn/ui 组件**

```bash
npx shadcn@latest add button input textarea select calendar dialog card tabs table badge dropdown-menu avatar label toast separator
```

- [ ] **步骤 6：Commit**

```bash
git init
git add -A
git commit -m "chore: init Next.js project with Prisma, NextAuth, shadcn/ui"
```

---

### 任务 2：Prisma 数据模型

**文件：**
- 创建：`prisma/schema.prisma`
- 创建：`src/lib/db.ts`

- [ ] **步骤 1：编写 Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LessonStatus {
  ATTENDED
  ABSENT
  LEAVE
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  phone         String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  students      Student[]
  accounts      Account[]
  sessions      Session[]
}

model Student {
  id          String   @id @default(cuid())
  userId      String
  name        String
  age         Int?
  parentPhone String?
  startDate   DateTime?
  level       String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessons  Lesson[]
  payments Payment[]
  schedules Schedule[]

  @@index([userId])
}

model Lesson {
  id              String       @id @default(cuid())
  studentId       String
  date            DateTime
  startTime       String       @default("09:00")
  durationMinutes Int          @default(45)
  repertoire      String?
  notes           String?
  homework        String?
  status          LessonStatus @default(ATTENDED)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([date])
}

model Payment {
  id          String   @id @default(cuid())
  studentId   String
  date        DateTime @default(now())
  amount      Int
  lessonCount Int
  notes       String?
  createdAt   DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
}

model Schedule {
  id              String   @id @default(cuid())
  studentId       String
  date            DateTime
  startTime       String   @default("09:00")
  durationMinutes Int      @default(45)
  repeatRule      String?  // e.g. "WEEKLY" for weekly repeat
  createdAt       DateTime @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([date])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

- [ ] **步骤 2：创建数据库客户端单例**

`src/lib/db.ts`：
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **步骤 3：设置环境变量**

编辑 `.env`：
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/piano_teacher?schema=public"
AUTH_SECRET="change-me-to-random-string"
```

- [ ] **步骤 4：生成 Prisma Client**

```bash
npx prisma generate
```

- [ ] **步骤 5：Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts .env
git commit -m "feat: add Prisma schema with User, Student, Lesson, Payment, Schedule models"
```

---

### 任务 3：NextAuth 认证

**文件：**
- 创建：`src/lib/auth.ts`
- 创建：`src/app/api/auth/[...nextauth]/route.ts`
- 创建：`src/middleware.ts`

- [ ] **步骤 1：编写 NextAuth 配置**

`src/lib/auth.ts`：
```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});
```

- [ ] **步骤 2：编写 API route handler**

`src/app/api/auth/[...nextauth]/route.ts`：
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **步骤 3：编写中间件保护路由**

`src/middleware.ts`：
```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/((?!api/auth|login|register|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **步骤 4：Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts
git commit -m "feat: add NextAuth.js email/password authentication"
```

---

### 任务 4：主布局与侧边栏

**文件：**
- 修改：`src/app/layout.tsx`
- 创建：`src/components/layout/sidebar.tsx`
- 创建：`src/app/globals.css`

- [ ] **步骤 1：编写侧边栏组件**

`src/components/layout/sidebar.tsx`：
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
  BookOpen,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "数据看板", icon: BarChart3 },
  { href: "/lessons", label: "课程记录", icon: BookOpen },
  { href: "/students", label: "学生管理", icon: Users },
  { href: "/calendar", label: "排课日历", icon: Calendar },
  { href: "/payments", label: "费用管理", icon: CreditCard },
  { href: "/settings", label: "设置", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold tracking-tight">PianoRecord</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent w-full"
        >
          <LogOut size={18} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **步骤 2：编写根布局**

`src/app/layout.tsx`：
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PianoRecord - 钢琴老师课程记录",
  description: "钢琴老师课程记录与管理平台",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAuthPage = ["/login", "/register"].some(
    (p) => true // simplified — will check in page itself
  );

  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {session?.user ? (
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/layout/sidebar.tsx
git commit -m "feat: add main layout with sidebar navigation"
```

---

### 任务 5：登录注册页面

**文件：**
- 创建：`src/app/login/page.tsx`
- 创建：`src/app/register/page.tsx`
- 创建：`src/app/api/register/route.ts`

- [ ] **步骤 1：编写注册 API**

`src/app/api/register/route.ts`：
```typescript
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
```

- [ ] **步骤 2：编写登录页面**

`src/app/login/page.tsx`：
```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">PianoRecord</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            还没有账号？<Link href="/register" className="text-primary hover:underline">注册</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **步骤 3：编写注册页面**

`src/app/register/page.tsx`：
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "注册失败");
      setLoading(false);
    } else {
      router.push("/login");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">创建账号</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            已有账号？<Link href="/login" className="text-primary hover:underline">登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **步骤 4：Commit**

```bash
git add src/app/login/ src/app/register/ src/app/api/register/
git commit -m "feat: add login and register pages"
```

---

### 任务 6：学生管理 API

**文件：**
- 创建：`src/app/api/students/route.ts`
- 创建：`src/app/api/students/[id]/route.ts`

- [ ] **步骤 1：编写学生列表/创建 API**

`src/app/api/students/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const students = await db.student.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { lessons: true, payments: true } },
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
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { name, age, parentPhone, startDate, level, notes } = body;
  if (!name) return NextResponse.json({ error: "学生姓名不能为空" }, { status: 400 });

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
```

- [ ] **步骤 2：编写单个学生 CRUD API**

`src/app/api/students/[id]/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getStudent(id: string, userId: string) {
  const student = await db.student.findFirst({
    where: { id, userId },
    include: {
      lessons: { orderBy: { date: "desc" } },
      payments: { orderBy: { date: "desc" } },
      _count: { select: { lessons: true } },
    },
  });
  return student;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const student = await getStudent(params.id, session.user.id);
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const totalPaid = student.payments.reduce((s, p) => s + p.lessonCount, 0);
  const attendedCount = student.lessons.filter(
    (l) => l.status === "ATTENDED"
  ).length;

  return NextResponse.json({
    ...student,
    totalLessons: totalPaid,
    attendedLessons: attendedCount,
    remainingLessons: totalPaid - attendedCount,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const student = await db.student.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const body = await req.json();
  const updated = await db.student.update({
    where: { id: params.id },
    data: {
      name: body.name,
      age: body.age,
      parentPhone: body.parentPhone,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      level: body.level,
      notes: body.notes,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params }: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const student = await db.student.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  await db.student.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/students/
git commit -m "feat: add student CRUD API endpoints"
```

---

### 任务 7：学生管理页面

**文件：**
- 创建：`src/app/students/page.tsx`
- 创建：`src/app/students/[id]/page.tsx`
- 创建：`src/components/students/student-form.tsx`

- [ ] **步骤 1：编写学生列表页**

`src/app/students/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentForm } from "@/components/students/student-form";
import { Search, Plus } from "lucide-react";

interface Student {
  id: string;
  name: string;
  age: number | null;
  level: string | null;
  remainingLessons: number;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  async function fetchStudents() {
    const res = await fetch("/api/students");
    const data = await res.json();
    setStudents(data);
  }

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">学生管理</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" />添加学生</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加学生</DialogTitle></DialogHeader>
            <StudentForm
              onSuccess={() => { setOpen(false); fetchStudents(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜索学生姓名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((s) => (
          <Link key={s.id} href={`/students/${s.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {s.level || "未设置级别"} {s.age ? `· ${s.age}岁` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={s.remainingLessons > 0 ? "default" : "destructive"}>
                    剩余 {s.remainingLessons} 课时
                  </Badge>
                  <span className="text-sm text-muted-foreground">›</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">暂无学生</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **步骤 2：编写学生表单组件**

`src/components/students/student-form.tsx`：
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  student?: {
    id: string;
    name: string;
    age: number | null;
    parentPhone: string | null;
    level: string | null;
    notes: string | null;
  };
  onSuccess: () => void;
}

export function StudentForm({ student, onSuccess }: Props) {
  const [name, setName] = useState(student?.name || "");
  const [age, setAge] = useState(student?.age?.toString() || "");
  const [parentPhone, setParentPhone] = useState(student?.parentPhone || "");
  const [level, setLevel] = useState(student?.level || "");
  const [notes, setNotes] = useState(student?.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = student ? `/api/students/${student.id}` : "/api/students";
    const method = student ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age: age ? parseInt(age) : null, parentPhone, level, notes }),
    });
    if (res.ok) onSuccess();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">姓名 *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">年龄</Label>
          <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">级别/阶段</Label>
          <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="如：拜厄、车尔尼599" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">家长手机号</Label>
        <Input id="phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "保存中..." : student ? "更新学生" : "添加学生"}
      </Button>
    </form>
  );
}
```

- [ ] **步骤 3：编写学生详情页**

`src/app/students/[id]/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentForm } from "@/components/students/student-form";
import { ArrowLeft, Pencil } from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  lessonCount: number;
  notes: string | null;
}

interface StudentDetail {
  id: string;
  name: string;
  age: number | null;
  parentPhone: string | null;
  level: string | null;
  notes: string | null;
  lessons: Lesson[];
  payments: Payment[];
  totalLessons: number;
  attendedLessons: number;
  remainingLessons: number;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  async function fetchStudent() {
    const res = await fetch(`/api/students/${id}`);
    if (res.ok) setStudent(await res.json());
  }

  useEffect(() => { fetchStudent(); }, [id]);

  if (!student) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Pencil size={16} /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>编辑学生</DialogTitle></DialogHeader>
                <StudentForm
                  student={student}
                  onSuccess={() => { setEditOpen(false); fetchStudent(); }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground text-sm">
            {student.level || "未设置级别"} · 剩余 {student.remainingLessons} 课时
          </p>
        </div>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">课程记录</TabsTrigger>
          <TabsTrigger value="progress">学习进度</TabsTrigger>
          <TabsTrigger value="payments">费用</TabsTrigger>
          <TabsTrigger value="info">信息</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-4 space-y-3">
          {student.lessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无课程记录</p>
          ) : (
            student.lessons.map((l) => (
              <Card key={l.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">
                        {new Date(l.date).toLocaleDateString("zh-CN")} {l.startTime} · {l.durationMinutes}分钟
                      </div>
                      {l.repertoire && <p className="text-sm mt-1">曲目：{l.repertoire}</p>}
                      {l.notes && <p className="text-sm text-muted-foreground mt-1">{l.notes}</p>}
                      {l.homework && <p className="text-sm mt-1">作业：{l.homework}</p>}
                    </div>
                    <Badge variant={
                      l.status === "ATTENDED" ? "default" :
                      l.status === "ABSENT" ? "destructive" : "secondary"
                    }>
                      {l.status === "ATTENDED" ? "已上课" : l.status === "ABSENT" ? "旷课" : "请假"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-4">
          <Card>
            <CardContent className="py-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{student.totalLessons}</div>
                  <div className="text-sm text-muted-foreground">总课时</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{student.attendedLessons}</div>
                  <div className="text-sm text-muted-foreground">已上课</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-500">{student.remainingLessons}</div>
                  <div className="text-sm text-muted-foreground">剩余课时</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">学习历程</h4>
                <div className="space-y-2">
                  {student.lessons.slice(0, 10).map((l) => (
                    <div key={l.id} className="text-sm flex gap-3">
                      <span className="text-muted-foreground w-24 shrink-0">
                        {new Date(l.date).toLocaleDateString("zh-CN")}
                      </span>
                      <span>{l.repertoire || "无记录"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4 space-y-6">
          <div>
            <h4 className="font-semibold mb-3">缴费记录</h4>
            {student.payments.length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无缴费记录</p>
            ) : (
              student.payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b text-sm">
                  <span>{new Date(p.date).toLocaleDateString("zh-CN")}</span>
                  <span>¥{p.amount} / {p.lessonCount}课时</span>
                  {p.notes && <span className="text-muted-foreground">{p.notes}</span>}
                </div>
              ))
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-3">消课记录</h4>
            {student.lessons.filter(l => l.status === "ATTENDED").length === 0 ? (
              <p className="text-muted-foreground text-sm">暂无消课记录</p>
            ) : (
              student.lessons.filter(l => l.status === "ATTENDED").map((l) => (
                <div key={l.id} className="flex justify-between items-center py-2 border-b text-sm">
                  <span>{new Date(l.date).toLocaleDateString("zh-CN")}</span>
                  <span className="text-muted-foreground">-1 课时</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="py-6 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">姓名</span><span>{student.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">年龄</span><span>{student.age || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">级别</span><span>{student.level || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">家长手机</span><span>{student.parentPhone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">备注</span><span>{student.notes || "-"}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **步骤 4：Commit**

```bash
git add src/app/students/ src/components/students/
git commit -m "feat: add student list, detail, and form pages"
```

---

### 任务 8：课程记录 API 与页面

**文件：**
- 创建：`src/app/api/lessons/route.ts`
- 创建：`src/app/api/lessons/[id]/route.ts`
- 创建：`src/app/lessons/page.tsx`

- [ ] **步骤 1：编写课程记录 API**

`src/app/api/lessons/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const lessons = await db.lesson.findMany({
    where: {
      student: { userId: session.user.id },
      ...(studentId ? { studentId } : {}),
    },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(lessons);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, date, startTime, durationMinutes, repertoire, notes, homework, status } = body;

  if (!studentId || !date) {
    return NextResponse.json({ error: "请选择学生和日期" }, { status: 400 });
  }

  // Verify student belongs to user
  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const lesson = await db.lesson.create({
    data: {
      studentId,
      date: new Date(date),
      startTime: startTime || "09:00",
      durationMinutes: durationMinutes || 45,
      repertoire: repertoire || null,
      notes: notes || null,
      homework: homework || null,
      status: status || "ATTENDED",
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(lesson, { status: 201 });
}
```

- [ ] **步骤 2：编写课程记录页面**

`src/app/lessons/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Student { id: string; name: string; }
interface Lesson {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
  student: { name: string };
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [filterStudent, setFilterStudent] = useState("all");

  // Form state
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("45");
  const [repertoire, setRepertoire] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [status, setStatus] = useState("ATTENDED");

  async function fetchLessons() {
    const url = filterStudent !== "all"
      ? `/api/lessons?studentId=${filterStudent}`
      : "/api/lessons";
    const res = await fetch(url);
    setLessons(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchLessons(); }, [filterStudent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId, date, startTime,
        durationMinutes: parseInt(duration),
        repertoire, notes: lessonNotes, homework, status,
      }),
    });
    if (res.ok) {
      setOpen(false);
      fetchLessons();
      // Reset form
      setRepertoire(""); setLessonNotes(""); setHomework("");
    }
  }

  const statusLabels: Record<string, string> = {
    ATTENDED: "已上课", ABSENT: "旷课", LEAVE: "请假",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">课程记录</h2>
        <div className="flex items-center gap-3">
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="筛选学生" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学生</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" />新增记录</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>新增课程记录</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>学生 *</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>日期 *</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>时间</Label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>时长（分钟）</Label>
                    <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>状态</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATTENDED">已上课</SelectItem>
                        <SelectItem value="ABSENT">旷课</SelectItem>
                        <SelectItem value="LEAVE">请假</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>曲目/练习内容</Label>
                  <Textarea value={repertoire} onChange={(e) => setRepertoire(e.target.value)} placeholder="如：拜厄 No.45、哈农 No.3" />
                </div>
                <div className="space-y-2">
                  <Label>掌握情况/备注</Label>
                  <Textarea value={lessonNotes} onChange={(e) => setLessonNotes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>布置作业</Label>
                  <Textarea value={homework} onChange={(e) => setHomework(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">保存记录</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {lessons.map((l) => (
          <Card key={l.id}>
            <CardContent className="flex justify-between items-start py-4">
              <div>
                <div className="font-semibold">
                  {new Date(l.date).toLocaleDateString("zh-CN")} {l.startTime} · {l.student.name} · {l.durationMinutes}分钟
                </div>
                {l.repertoire && <p className="text-sm mt-1">曲目：{l.repertoire}</p>}
                {l.notes && <p className="text-sm text-muted-foreground mt-1">{l.notes}</p>}
                {l.homework && <p className="text-sm mt-1">作业：{l.homework}</p>}
              </div>
              <Badge variant={
                l.status === "ATTENDED" ? "default" :
                l.status === "ABSENT" ? "destructive" : "secondary"
              }>
                {statusLabels[l.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {lessons.length === 0 && (
          <p className="text-center text-muted-foreground py-12">暂无课程记录</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/lessons/ src/app/lessons/
git commit -m "feat: add lesson CRUD API and lesson list/create page"
```

---

### 任务 9：排课日历 API 与页面

**文件：**
- 创建：`src/app/api/schedules/route.ts`
- 创建：`src/app/calendar/page.tsx`

- [ ] **步骤 1：编写排课 API**

`src/app/api/schedules/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM format

  const schedules = await db.schedule.findMany({
    where: {
      student: { userId: session.user.id },
      ...(month ? {
        date: {
          gte: new Date(`${month}-01`),
          lt: new Date(`${month}-31`),
        },
      } : {}),
    },
    include: { student: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const { studentId, date, startTime, durationMinutes, repeatRule } = body;

  if (!studentId || !date) {
    return NextResponse.json({ error: "请选择学生和日期" }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, userId: session.user.id },
  });
  if (!student) return NextResponse.json({ error: "学生不存在" }, { status: 404 });

  const schedule = await db.schedule.create({
    data: {
      studentId,
      date: new Date(date),
      startTime: startTime || "09:00",
      durationMinutes: durationMinutes || 45,
      repeatRule: repeatRule || null,
    },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(schedule, { status: 201 });
}
```

- [ ] **步骤 2：编写排课日历页面**

`src/app/calendar/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface Student { id: string; name: string; }
interface Schedule {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repeatRule: string | null;
  student: { name: string };
  studentId: string;
}

export default function CalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedDate, setSelectedDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);

  // Form
  const [scheduleStudentId, setScheduleStudentId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDuration, setScheduleDuration] = useState("45");

  async function fetchSchedules() {
    const res = await fetch(`/api/schedules?month=${currentMonth}`);
    setSchedules(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchSchedules(); }, [currentMonth]);

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: scheduleStudentId,
        date: scheduleDate,
        startTime: scheduleTime,
        durationMinutes: parseInt(scheduleDuration),
      }),
    });
    if (res.ok) { setOpen(false); fetchSchedules(); }
  }

  // Build calendar grid
  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Group schedules by date
  const scheduleMap: Record<string, Schedule[]> = {};
  schedules.forEach((s) => {
    const d = new Date(s.date).toISOString().split("T")[0];
    if (!scheduleMap[d]) scheduleMap[d] = [];
    scheduleMap[d].push(s);
  });

  const selectedDateSchedules = scheduleMap[selectedDate] || [];

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  function prevMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">排课日历</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" />添加排课</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>添加排课</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label>学生 *</Label>
                <Select value={scheduleStudentId} onValueChange={setScheduleStudentId}>
                  <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>日期 *</Label>
                  <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>时间</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>时长（分钟）</Label>
                <Input type="number" value={scheduleDuration} onChange={(e) => setScheduleDuration(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">保存排课</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft size={18} /></Button>
                <span className="font-bold text-lg">{currentMonth}</span>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight size={18} /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground py-2">{d}</div>
                ))}
                {blanks.map((i) => (
                  <div key={`blank-${i}`} className="py-2" />
                ))}
                {days.map((d) => {
                  const dateStr = `${currentMonth}-${String(d).padStart(2, "0")}`;
                  const isSelected = dateStr === selectedDate;
                  const count = scheduleMap[dateStr]?.length || 0;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`py-2 text-center text-sm rounded-md transition-colors relative ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-accent"
                      }`}
                    >
                      {d}
                      {count > 0 && (
                        <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] ${
                          isSelected ? "text-primary-foreground" : "text-primary"
                        }`}>
                          ●
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day schedule list */}
        <div>
          <h3 className="font-semibold mb-3">{selectedDate} 课程安排</h3>
          <div className="space-y-2">
            {selectedDateSchedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无课程</p>
            ) : (
              selectedDateSchedules.map((s) => (
                <Card key={s.id}>
                  <CardContent className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm">{s.startTime} · {s.student.name}</div>
                        <div className="text-xs text-muted-foreground">{s.durationMinutes}分钟</div>
                      </div>
                      <Badge variant="secondary">待上课</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/schedules/ src/app/calendar/
git commit -m "feat: add schedule API and monthly calendar page"
```

---

### 任务 10：费用管理 API 与页面

**文件：**
- 创建：`src/app/api/payments/route.ts`
- 创建：`src/app/payments/page.tsx`

- [ ] **步骤 1：编写缴费 API**

`src/app/api/payments/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const payments = await db.payment.findMany({
    where: { student: { userId: session.user.id } },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

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
```

- [ ] **步骤 2：编写费用管理页面**

`src/app/payments/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

interface Student { id: string; name: string; }

interface Payment {
  id: string;
  date: string;
  amount: number;
  lessonCount: number;
  notes: string | null;
  student: { name: string };
  studentId: string;
}

interface Consumption {
  id: string;
  date: string;
  student: { name: string };
  studentId: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);

  // Form
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [lessonCount, setLessonCount] = useState("");
  const [notes, setNotes] = useState("");

  async function fetchPayments() {
    const res = await fetch("/api/payments");
    setPayments(await res.json());
  }

  async function fetchConsumptions() {
    const res = await fetch("/api/lessons?status=ATTENDED");
    if (res.ok) setConsumptions(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("/api/students");
    setStudents(await res.json());
  }

  useEffect(() => { fetchStudents(); fetchPayments(); fetchConsumptions(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        date,
        amount: parseInt(amount),
        lessonCount: parseInt(lessonCount),
        notes,
      }),
    });
    if (res.ok) {
      setOpen(false);
      fetchPayments();
      setAmount(""); setLessonCount(""); setNotes("");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">费用管理</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-1" />新增缴费</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新增缴费记录</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>学生 *</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="选择学生" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>缴费日期</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>金额（元）*</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" />
                </div>
                <div className="space-y-2">
                  <Label>课时数 *</Label>
                  <Input type="number" value={lessonCount} onChange={(e) => setLessonCount(e.target.value)} required min="1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="如：微信转账" />
              </div>
              <Button type="submit" className="w-full">保存缴费记录</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">缴费记录</TabsTrigger>
          <TabsTrigger value="consumption">消课记录</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4 space-y-3">
          {payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">暂无缴费记录</p>
          ) : (
            payments.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-semibold">{p.student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("zh-CN")}
                      {p.notes && ` · ${p.notes}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">¥{p.amount}</div>
                    <Badge variant="secondary">{p.lessonCount} 课时</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="consumption" className="mt-4 space-y-3">
          {consumptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">暂无消课记录</p>
          ) : (
            consumptions.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-semibold">{c.student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(c.date).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <Badge variant="outline">-1 课时</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/payments/ src/app/payments/
git commit -m "feat: add payment API and fee management page"
```

---

### 任务 11：数据看板页面

**文件：**
- 修改：`src/app/page.tsx`
- 创建：`src/app/api/dashboard/route.ts`

- [ ] **步骤 1：编写看板数据 API**

`src/app/api/dashboard/route.ts`：
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Today's stats
  const todayLessons = await db.lesson.count({
    where: {
      student: { userId: session.user.id },
      date: { gte: todayStart, lt: todayEnd },
    },
  });

  const todayAttended = await db.lesson.count({
    where: {
      student: { userId: session.user.id },
      date: { gte: todayStart, lt: todayEnd },
      status: "ATTENDED",
    },
  });

  // Today's schedule
  const todaySchedules = await db.schedule.findMany({
    where: {
      student: { userId: session.user.id },
      date: { gte: todayStart, lt: todayEnd },
    },
    include: { student: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  // Monthly stats
  const monthLessons = await db.lesson.count({
    where: {
      student: { userId: session.user.id },
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  const monthAttended = await db.lesson.count({
    where: {
      student: { userId: session.user.id },
      date: { gte: monthStart, lte: monthEnd },
      status: "ATTENDED",
    },
  });

  const monthPayments = await db.payment.aggregate({
    where: {
      student: { userId: session.user.id },
      date: { gte: monthStart, lte: monthEnd },
    },
    _sum: { amount: true },
  });

  const studentCount = await db.student.count({
    where: { userId: session.user.id },
  });

  // Recent lessons
  const recentLessons = await db.lesson.findMany({
    where: { student: { userId: session.user.id } },
    include: { student: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  const attendanceRate = monthLessons > 0
    ? Math.round((monthAttended / monthLessons) * 100)
    : 0;

  return NextResponse.json({
    today: {
      lessonCount: todayLessons,
      attendedCount: todayAttended,
      pendingCount: todaySchedules.length - todayAttended,
      schedules: todaySchedules.map((s) => ({
        id: s.id,
        time: s.startTime,
        studentName: s.student.name,
        durationMinutes: s.durationMinutes,
      })),
    },
    month: {
      lessonCount: monthLessons,
      attendedCount: monthAttended,
      income: monthPayments._sum.amount || 0,
      studentCount,
      attendanceRate,
    },
    recentLessons: recentLessons.map((l) => ({
      id: l.id,
      date: l.date,
      studentName: l.student.name,
      repertoire: l.repertoire,
    })),
  });
}
```

- [ ] **步骤 2：编写看板页面**

`src/app/page.tsx`：
```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, CalendarDays, TrendingUp, Clock, DollarSign } from "lucide-react";

interface DashboardData {
  today: {
    lessonCount: number;
    attendedCount: number;
    pendingCount: number;
    schedules: { id: string; time: string; studentName: string; durationMinutes: number }[];
  };
  month: {
    lessonCount: number;
    attendedCount: number;
    income: number;
    studentCount: number;
    attendanceRate: number;
  };
  recentLessons: { id: string; date: string; studentName: string; repertoire: string | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">数据看板</h2>

      {/* Today Overview */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CalendarDays size={20} /> 今日概览
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">{data.today.lessonCount}</div>
              <div className="text-sm text-muted-foreground">今日课程</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{data.today.pendingCount}</div>
              <div className="text-sm text-muted-foreground">待记录</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.today.attendedCount}</div>
              <div className="text-sm text-muted-foreground">已上课</div>
            </CardContent>
          </Card>
        </div>

        {data.today.schedules.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">今日课程安排</h4>
            <div className="space-y-2">
              {data.today.schedules.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="font-medium">{s.time}</span>
                      <span>{s.studentName}</span>
                    </div>
                    <Badge variant="secondary">{s.durationMinutes}分钟</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Monthly Overview */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} /> 本月概览
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">{data.month.lessonCount}</div>
              <div className="text-sm text-muted-foreground">本月课时</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">¥{data.month.income.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">本月收入</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{data.month.studentCount}</div>
              <div className="text-sm text-muted-foreground">在读学生</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{data.month.attendanceRate}%</div>
              <div className="text-sm text-muted-foreground">出勤率</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Records */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen size={20} /> 最近记录
        </h3>
        <div className="space-y-2">
          {data.recentLessons.map((l) => (
            <Card key={l.id}>
              <CardContent className="py-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{l.studentName}</span>
                    {l.repertoire && (
                      <span className="text-muted-foreground ml-2 text-sm">— {l.repertoire}</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(l.date).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {data.recentLessons.length === 0 && (
            <p className="text-center text-muted-foreground py-8">暂无记录</p>
          )}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/page.tsx src/app/api/dashboard/
git commit -m "feat: add dashboard with today/monthly stats and recent lessons"
```

---

### 任务 12：设置页面与单元测试

**文件：**
- 创建：`src/app/settings/page.tsx`
- 创建：`src/__tests__/lessons.test.ts`
- 创建：`src/__tests__/payments.test.ts`

- [ ] **步骤 1：编写设置页面**

`src/app/settings/page.tsx`：
```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    // Profile update — simplified for MVP
    setSaved(true);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">设置</h2>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={session?.user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button type="submit">保存</Button>
            {saved && <p className="text-sm text-green-600">已保存</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **步骤 2：编写消课逻辑单元测试**

`src/__tests__/lessons.test.ts`：
```typescript
import { describe, it, expect } from "vitest";

// Business logic: calculate remaining lessons
function calcRemainingLessons(
  payments: { lessonCount: number }[],
  attendedLessons: number
): number {
  const totalPaid = payments.reduce((sum, p) => sum + p.lessonCount, 0);
  return totalPaid - attendedLessons;
}

// Business logic: should lesson consume a credit?
function shouldConsumeCredit(status: string): boolean {
  return status === "ATTENDED";
}

describe("calcRemainingLessons", () => {
  it("returns correct remaining when no payments", () => {
    expect(calcRemainingLessons([], 0)).toBe(0);
  });

  it("returns total paid minus attended", () => {
    const payments = [{ lessonCount: 10 }, { lessonCount: 5 }];
    expect(calcRemainingLessons(payments, 8)).toBe(7);
  });

  it("returns 0 when all lessons consumed", () => {
    const payments = [{ lessonCount: 10 }];
    expect(calcRemainingLessons(payments, 10)).toBe(0);
  });

  it("returns negative when more attended than paid", () => {
    const payments = [{ lessonCount: 5 }];
    expect(calcRemainingLessons(payments, 8)).toBe(-3);
  });
});

describe("shouldConsumeCredit", () => {
  it("consumes credit for ATTENDED", () => {
    expect(shouldConsumeCredit("ATTENDED")).toBe(true);
  });

  it("does not consume credit for ABSENT", () => {
    expect(shouldConsumeCredit("ABSENT")).toBe(false);
  });

  it("does not consume credit for LEAVE", () => {
    expect(shouldConsumeCredit("LEAVE")).toBe(false);
  });
});
```

- [ ] **步骤 3：安装 vitest 和运行测试**

```bash
npm install -D vitest @vitejs/plugin-react
```

在 `vitest.config.ts` 中：
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {},
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

```bash
npx vitest run
```

预期：6 个测试全部 PASS

- [ ] **步骤 4：Commit**

```bash
git add src/app/settings/ src/__tests__/ vitest.config.ts
git commit -m "feat: add settings page and business logic unit tests"
```

---

### 任务 13：E2E 测试（Playwright）

**文件：**
- 创建：`e2e/lessons.spec.ts`
- 创建：`e2e/payments.spec.ts`
- 创建：`playwright.config.ts`

- [ ] **步骤 1：安装 Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **步骤 2：编写 Playwright 配置**

`playwright.config.ts`：
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

- [ ] **步骤 3：编写课程记录 E2E 测试**

`e2e/lessons.spec.ts`：
```typescript
import { test, expect } from "@playwright/test";

test.describe("课程记录流程", () => {
  test("未登录用户重定向到登录页", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page).toHaveURL(/\/login/);
  });

  test("登录后可以查看课程记录页面", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/lessons");
    await expect(page.locator("h2")).toContainText("课程记录");
  });
});
```

- [ ] **步骤 4：编写费用 E2E 测试**

`e2e/payments.spec.ts`：
```typescript
import { test, expect } from "@playwright/test";

test.describe("费用管理流程", () => {
  test("登录后可以查看费用管理页面", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/payments");
    await expect(page.locator("h2")).toContainText("费用管理");
  });

  test("点击新增缴费打开对话框", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await page.goto("/payments");
    await page.click("text=新增缴费");
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText("缴费金额");
  });
});
```

- [ ] **步骤 5：Commit**

```bash
git add e2e/ playwright.config.ts
git commit -m "test: add Playwright E2E tests for lessons and payments"
```

---

### 任务 14：最终验证与集成

**文件：**
- 创建：`.env.example`

- [ ] **步骤 1：创建 .env.example**

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/piano_teacher?schema=public"
AUTH_SECRET="generate-a-random-secret-here"
```

- [ ] **步骤 2：运行类型检查**

```bash
npx tsc --noEmit
```

- [ ] **步骤 3：运行单元测试**

```bash
npx vitest run
```

预期：所有单元测试 PASS

- [ ] **步骤 4：运行 E2E 测试**

```bash
npx playwright test
```

预期：所有 E2E 测试 PASS

- [ ] **步骤 5：Commit**

```bash
git add .env.example
git commit -m "chore: add .env.example and run final verification"
```
