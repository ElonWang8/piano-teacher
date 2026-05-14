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
    <aside className="hidden md:flex w-[180px] h-full bg-white border-r border-[#d0d7de] flex-col shrink-0">
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors border-l-[3px]",
                active
                  ? "border-l-[#0969da] bg-[#ddf4ff] text-[#0969da] font-medium"
                  : "border-l-transparent text-[#656d76] hover:bg-[#f6f8fa] hover:text-[#1f2328]"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-[#d0d7de]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-[#656d76] hover:bg-[#f6f8fa] hover:text-[#1f2328] w-full"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
