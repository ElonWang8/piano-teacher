import { describe, it, expect } from "vitest";

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
});
