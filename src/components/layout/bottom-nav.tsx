"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Calendar, Users, CreditCard } from "lucide-react";

const tabs = [
  { href: "/", label: "看板", icon: BarChart3 },
  { href: "/lessons", label: "记录", icon: BookOpen },
  { href: "/calendar", label: "排课", icon: Calendar },
  { href: "/students", label: "学生", icon: Users },
  { href: "/payments", label: "费用", icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#d0d7de] md:hidden">
      <div className="flex h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                active ? "text-[#2da44e]" : "text-[#656d76] hover:text-[#1f2328]"
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
