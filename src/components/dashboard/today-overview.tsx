"use client";

import Link from "next/link";
import { Clock, CheckCircle2, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TodaySchedule } from "@/types";

interface Props {
  lessonCount: number;
  attendedCount: number;
  pendingCount: number;
  schedules: TodaySchedule[];
}

export function TodayOverview({ lessonCount, attendedCount, pendingCount, schedules }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">今日概览</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Link href="/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今日课程
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{schedules.length + attendedCount}</p>
              <p className="text-xs text-muted-foreground">
                今日排课(已签到 + 待签到)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lessons">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已签到
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {attendedCount}
              </p>
              <p className="text-xs text-muted-foreground">今日已完成</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                待签到
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-500">
                {pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">剩余待签到</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {schedules.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              今日课程安排
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{s.time}</span>
                    <span>{s.studentName}</span>
                  </div>
                  <Badge variant="secondary">
                    {s.durationMinutes} 分钟
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
