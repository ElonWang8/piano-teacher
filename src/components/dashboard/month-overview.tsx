"use client";

import Link from "next/link";
import { CalendarDays, DollarSign, Users, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthStats } from "@/types";

interface Props {
  month: MonthStats;
}

export function MonthOverview({ month }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">本月概览</h2>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Link href="/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                本月排课
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{month.scheduleCount ?? month.lessonCount}</p>
              <p className="text-xs text-muted-foreground">
                本月排课总数
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lessons">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已上课
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{month.attendedCount}</p>
              <p className="text-xs text-muted-foreground">本月已上课</p>
            </CardContent>
          </Card>
        </Link>

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
      </div>
    </section>
  );
}
