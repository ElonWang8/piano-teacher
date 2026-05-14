"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { MonthOverview } from "@/components/dashboard/month-overview";
import { RecentLessons } from "@/components/dashboard/recent-lessons";
import { MonthlyReport } from "@/components/dashboard/monthly-report";
import { BarChart3, FileText } from "lucide-react";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">数据看板</h1>
        <Button variant="outline" onClick={() => setReportOpen(true)}>
          <FileText size={16} className="mr-2" />
          月度报表
        </Button>
      </div>

      <TodayOverview
        lessonCount={today.lessonCount}
        attendedCount={today.attendedCount}
        pendingCount={today.pendingCount}
        schedules={today.schedules}
      />

      <MonthOverview month={month} />

      <RecentLessons recentLessons={recentLessons} />

      <MonthlyReport open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
