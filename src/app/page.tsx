"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Percent,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface TodaySchedule {
  id: string;
  time: string;
  studentName: string;
  durationMinutes: number;
}

interface MonthStats {
  lessonCount: number;
  attendedCount: number;
  income: number;
  studentCount: number;
  attendanceRate: number;
}

interface RecentLesson {
  id: string;
  date: string;
  studentName: string;
  repertoire: string | null;
}

interface DashboardData {
  today: {
    lessonCount: number;
    attendedCount: number;
    pendingCount: number;
    schedules: TodaySchedule[];
  };
  month: MonthStats;
  recentLessons: RecentLesson[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">数据看板</h1>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          <Skeleton type="card" count={3} />
        </div>
        <Skeleton type="card" count={3} />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<BarChart3 size={48} />}
        title="暂无数据"
        description="开始添加学生和课程记录吧"
      />
    );
  }

  const { today, month, recentLessons } = data;

  return (
    <div className="space-y-8">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">数据看板</h1>

      {/* 今日概览 */}
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
              <p className="text-2xl font-bold">{today.lessonCount}</p>
              <p className="text-xs text-muted-foreground">
                已记录 {today.attendedCount} 节
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
                {today.attendedCount}
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
                {today.pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">等待课程记录</p>
            </CardContent>
          </Card>
        </div>

        {/* 今日课程安排 */}
        {today.schedules.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                今日课程安排
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {today.schedules.map((s) => (
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

      {/* 本月概览 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">本月概览</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月课程
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{month.lessonCount}</p>
              <p className="text-xs text-muted-foreground">
                出勤 {month.attendedCount} 节
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月收入
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                ¥{month.income.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">课时费收入</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                学生人数
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{month.studentCount}</p>
              <p className="text-xs text-muted-foreground">在读学生</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                出勤率
              </CardTitle>
              <Percent className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {month.attendanceRate}%
              </p>
              <p className="text-xs text-muted-foreground">本月出勤率</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 最近记录 */}
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
                    href={`/lessons`}
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
              className="text-sm text-primary hover:underline"
            >
              查看全部课程记录 →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
