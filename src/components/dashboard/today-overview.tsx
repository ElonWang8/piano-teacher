"use client";

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今日课程
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lessonCount}</p>
            <p className="text-xs text-muted-foreground">
              已记录 {attendedCount} 节
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已出勤
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {attendedCount}
            </p>
            <p className="text-xs text-muted-foreground">今日完成课程</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待上课
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {pendingCount}
            </p>
            <p className="text-xs text-muted-foreground">等待课程记录</p>
          </CardContent>
        </Card>
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
