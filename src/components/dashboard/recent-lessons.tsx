"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RecentLesson } from "@/types";

interface Props {
  recentLessons: RecentLesson[];
}

export function RecentLessons({ recentLessons }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">最近记录</h2>
      <Card>
        <CardContent className="p-0">
          {recentLessons.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              暂无课程记录
            </div>
          ) : (
            <div className="divide-y">
              {recentLessons.map((l) => (
                <Link
                  key={l.id}
                  href="/lessons"
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium">{l.studentName}</span>
                      {l.repertoire && (
                        <span className="text-muted-foreground ml-2">
                          — {l.repertoire}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(l.date).toLocaleDateString("zh-CN")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {recentLessons.length > 0 && (
        <div className="mt-3 text-right">
          <Link
            href="/lessons"
            className="text-sm text-[#2da44e] hover:underline"
          >
            查看全部课程记录 →
          </Link>
        </div>
      )}
    </section>
  );
}
