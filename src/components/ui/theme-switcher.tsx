"use client";
import { useEffect, useState } from "react";

const themes = [
  { key: "github", label: "GitHub", color: "#f6f8fa" },
  { key: "dark", label: "暗色", color: "#0d1117" },
  { key: "warm", label: "暖阳", color: "#fef7ed" },
  { key: "ocean", label: "海洋", color: "#f0f7ff" },
  { key: "forest", label: "森林", color: "#f1f8e9" },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("github");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "github";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function switchTheme(key: string) {
    setTheme(key);
    localStorage.setItem("theme", key);
    document.documentElement.setAttribute("data-theme", key);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {themes.map((t) => (
        <button
          key={t.key}
          onClick={() => switchTheme(t.key)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${theme === t.key ? "border-[#2da44e] scale-110" : "border-gray-300"}`}
          style={{ background: t.color }}
          title={t.label}
        />
      ))}
    </div>
  );
}
