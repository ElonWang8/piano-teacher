// ==================== 共享类型定义 ====================

export interface Student {
  id: string;
  name: string;
  age: number | null;
  level: string | null;
  remainingLessons: number;
  createdAt: string;
  parentPhone?: string | null;
  status?: string;
  notes?: string | null;
  startDate?: string | null;
  pendingSchedules?: number;
  totalLessons?: number;
}

export interface Lesson {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repertoire: string | null;
  notes: string | null;
  homework: string | null;
  status: string;
  student: { name: string };
}

export interface Schedule {
  id: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  repeatRule: string | null;
  student: { name: string };
  studentId: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  lessonCount: number;
  notes: string | null;
  student: { name: string };
}

export interface StudentDetail extends Student {
  lessons: Lesson[];
  payments: Payment[];
  totalLessons: number;
  attendedLessons: number;
}

export interface DashboardData {
  today: {
    lessonCount: number;
    attendedCount: number;
    pendingCount: number;
    schedules: TodaySchedule[];
  };
  month: MonthStats;
  recentLessons: RecentLesson[];
}

export interface TodaySchedule {
  id: string;
  time: string;
  studentName: string;
  durationMinutes: number;
}

export interface MonthStats {
  lessonCount: number;
  attendedCount: number;
  income: number;
  studentCount: number;
  attendanceRate: number;
  scheduleCount?: number;
}

export interface RecentLesson {
  id: string;
  date: string;
  studentName: string;
  repertoire: string | null;
}

export interface MonthlyReportItem {
  studentId: string;
  studentName: string;
  totalLessons: number;
  attended: number;
  absent: number;
  leave: number;
  attendanceRate: number;
  totalPayment: number;
  totalLessonCount: number;
}
