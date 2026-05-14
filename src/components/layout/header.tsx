"use client";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  return (
    <header className="hidden md:flex items-center justify-between h-12 px-4 bg-[#24292e] text-white shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm">PianoRecord</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8b949e]">{session.user.name}</span>
        <div className="w-6 h-6 rounded-full bg-[#2da44e] flex items-center justify-center text-white text-xs font-bold">
          {(session.user.name || "?")[0]}
        </div>
      </div>
    </header>
  );
}
