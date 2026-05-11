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
    <aside className="hidden md:flex w-56 h-screen bg-card border-r flex flex-col">
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
