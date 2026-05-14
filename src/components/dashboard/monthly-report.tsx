"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MonthlyReportItem } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyReport({ open, onOpenChange }: Props) {
  const [reportMonth, setReportMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState<MonthlyReportItem[] | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  async function fetchReport() {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/report/monthly?month=${reportMonth}`);
      if (res.ok) {
        const json = await res.json();
        setReportData(json.report || []);
      }
    } catch {
      // ignore
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-md:!max-w-[calc(100vw-2rem)] max-h-[80dvh] overflow-auto">
        <DialogHeader>
          <DialogTitle>月度学生报表</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground">选择月份：</label>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => {
                setReportMonth(e.target.value);
              }}
              className="border rounded px-2 py-1 text-sm"
            />
            <Button size="sm" onClick={fetchReport} disabled={reportLoading}>
              {reportLoading ? "加载中..." : "查询"}
            </Button>
          </div>

          {reportData && reportData.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              该月份暂无数据
            </p>
          )}

          {reportData && reportData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium">学生</th>
                    <th className="text-center py-2 px-3 font-medium">上课</th>
                    <th className="text-center py-2 px-3 font-medium">请假</th>
                    <th className="text-center py-2 px-3 font-medium">旷课</th>
                    <th className="text-center py-2 px-3 font-medium">出勤率</th>
                    <th className="text-right py-2 px-3 font-medium">缴费</th>
                    <th className="text-right py-2 px-3 font-medium">购课时</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item) => (
                    <tr key={item.studentId} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium">{item.studentName}</td>
                      <td className="text-center py-2 px-3">{item.attended}</td>
                      <td className="text-center py-2 px-3">{item.leave}</td>
                      <td className="text-center py-2 px-3">{item.absent}</td>
                      <td className="text-center py-2 px-3">
                        <Badge variant={item.attendanceRate >= 80 ? "default" : item.attendanceRate >= 60 ? "secondary" : "destructive"}>
                          {item.attendanceRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-3">
                        {item.totalPayment > 0 ? `¥${item.totalPayment}` : "-"}
                      </td>
                      <td className="text-right py-2 px-3">
                        {item.totalLessonCount > 0 ? item.totalLessonCount : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
