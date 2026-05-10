import { describe, it, expect } from "vitest";

function calcRemainingLessons(
  payments: { lessonCount: number }[],
  attendedLessons: number
): number {
  const totalPaid = payments.reduce((sum, p) => sum + p.lessonCount, 0);
  return totalPaid - attendedLessons;
}

function shouldConsumeCredit(status: string): boolean {
  return status === "ATTENDED";
}

describe("calcRemainingLessons", () => {
  it("returns correct remaining when no payments", () => {
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
});

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
});
