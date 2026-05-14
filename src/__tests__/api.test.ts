import { describe, it, expect } from "vitest";

// ==================== calcRemainingLessons ====================

function calcRemainingLessons(
  payments: { lessonCount: number }[],
  attendedLessons: number
): number {
  const totalPaid = payments.reduce((sum, p) => sum + p.lessonCount, 0);
  return totalPaid - attendedLessons;
}

describe("calcRemainingLessons", () => {
  it("returns 0 with no payments and no lessons", () => {
    expect(calcRemainingLessons([], 0)).toBe(0);
  });

  it("returns total paid minus attended", () => {
    expect(calcRemainingLessons([{ lessonCount: 10 }, { lessonCount: 5 }], 8)).toBe(7);
  });

  it("returns 0 when all lessons consumed", () => {
    expect(calcRemainingLessons([{ lessonCount: 10 }], 10)).toBe(0);
  });

  it("returns negative when more attended than paid", () => {
    expect(calcRemainingLessons([{ lessonCount: 5 }], 8)).toBe(-3);
  });

  it("handles single large payment", () => {
    expect(calcRemainingLessons([{ lessonCount: 100 }], 50)).toBe(50);
  });

  it("handles zero-value payments", () => {
    expect(calcRemainingLessons([{ lessonCount: 0 }, { lessonCount: 0 }], 0)).toBe(0);
  });

  it("handles large attendance count", () => {
    expect(calcRemainingLessons([{ lessonCount: 200 }], 199)).toBe(1);
  });

  it("handles many small payments", () => {
    const payments = Array.from({ length: 50 }, () => ({ lessonCount: 2 }));
    expect(calcRemainingLessons(payments, 30)).toBe(70);
  });
});

// ==================== calculateBatchDates ====================

function calculateBatchDates(startDate: string, endDate: string, weekdays: number[]): string[] {
  const dates: string[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) {
      dates.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

describe("calculateBatchDates", () => {
  it("returns Saturdays in May 2026", () => {
    const result = calculateBatchDates("2026-05-01", "2026-05-31", [6]);
    expect(result).toEqual(["2026-05-02", "2026-05-09", "2026-05-16", "2026-05-23", "2026-05-30"]);
  });

  it("returns Mon+Wed for a week", () => {
    const result = calculateBatchDates("2026-05-04", "2026-05-10", [1, 3]);
    expect(result).toEqual(["2026-05-04", "2026-05-06"]);
  });

  it("returns empty for no matching days", () => {
    const result = calculateBatchDates("2026-05-04", "2026-05-04", [0]);
    expect(result).toEqual([]);
  });

  // === Additional boundary / cross-year / leap-year cases ===

  it("cross-year boundary (Dec 31 to Jan 2)", () => {
    const result = calculateBatchDates("2025-12-31", "2026-01-02", [3]); // Wed only
    // Dec 31 2025 is Wed (3), Jan 1 is Thu, Jan 2 is Fri
    expect(result).toEqual(["2025-12-31"]);
  });

  it("leap year February (2028 is leap year)", () => {
    const result = calculateBatchDates("2028-02-01", "2028-02-29", [1, 2, 3, 4, 5]);
    // Feb 2028: 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat ...
    // Weekdays 1-5 = Mon-Fri
    // Mon: 7, 14, 21, 28
    // Tue: 1, 8, 15, 22, 29
    // Wed: 2, 9, 16, 23
    // Thu: 3, 10, 17, 24
    // Fri: 4, 11, 18, 25
    // Total = 21 weekdays
    expect(result.length).toBe(21);
  });

  it("non-leap year February", () => {
    const result = calculateBatchDates("2026-02-01", "2026-02-28", [1, 2, 3, 4, 5]);
    // Feb 2026 has 28 days, starts on Sun
    // Weekdays 1-5 = Mon-Fri = 20 days
    expect(result.length).toBe(20);
  });

  it("single date range", () => {
    const result = calculateBatchDates("2026-05-10", "2026-05-10", [0]); // Sunday
    expect(result).toEqual(["2026-05-10"]);
  });

  it("all 7 days of the week", () => {
    const result = calculateBatchDates("2026-05-04", "2026-05-10", [0, 1, 2, 3, 4, 5, 6]);
    expect(result.length).toBe(7);
  });

  it("full year range (all Mondays in 2026)", () => {
    const result = calculateBatchDates("2026-01-01", "2026-12-31", [1]);
    // 2026 has 52 Mondays
    expect(result.length).toBe(52);
  });

  it("handles start date after end date gracefully", () => {
    const result = calculateBatchDates("2026-05-10", "2026-05-01", [1]);
    expect(result).toEqual([]);
  });
});

// ==================== shouldConsumeCredit ====================

function shouldConsumeCredit(status: string): boolean {
  return status === "ATTENDED";
}

describe("shouldConsumeCredit", () => {
  it("consumes credit for ATTENDED", () => {
    expect(shouldConsumeCredit("ATTENDED")).toBe(true);
  });

  it("does not consume credit for ABSENT", () => {
    expect(shouldConsumeCredit("ABSENT")).toBe(false);
  });

  it("does not consume credit for LEAVE", () => {
    expect(shouldConsumeCredit("LEAVE")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(shouldConsumeCredit("attended")).toBe(false);
  });

  it("handles empty string", () => {
    expect(shouldConsumeCredit("")).toBe(false);
  });
});
