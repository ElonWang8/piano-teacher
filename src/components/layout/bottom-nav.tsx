"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Calendar, Users, CreditCard, Settings, User, Paintbrush, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const tabs = [
  { href: "/", label: "看板", icon: BarChart3 },
  { href: "/lessons", label: "记录", icon: BookOpen },
  { href: "/calendar", label: "排课", icon: Calendar },
  { href: "/students", label: "学生", icon: Users },
  { href: "/payments", label: "费用", icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* 弹出菜单 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute bottom-14 right-2 bg-white border border-[#d0d7de] rounded-lg shadow-lg p-2 w-40"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { router.push("/settings"); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-md hover:bg-[#f6f8fa] text-[#1f2328]">
              <Settings size={16} /> 设置
            </button>
            <button onClick={() => { signOut({ callbackUrl: "/login" }); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-md hover:bg-[#f6f8fa] text-[#cf222e]">
              <LogOut size={16} /> 退出登录
            </button>
          </div>
        </div>
      )}

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

          {/* 更多按钮 */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-[#656d76] hover:text-[#1f2328]"
          >
            <div className="w-5 h-5 rounded-full bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center text-[10px] font-bold text-[#656d76]">
              {(session?.user?.name || "?")[0]}
            </div>
            <span>我</span>
          </button>
        </div>
      </nav>
    </>
  );
}
