import { describe, expect, it } from "vitest";
import { calculateBudgetHealth, detectUnusualTransaction, formatInrFromPaise, getFinancialYearRange, getIndianFinancialYear } from "./finance";

describe("Indian finance helpers", () => {
  it("uses the Apr–Mar financial year boundary", () => {
    expect(getIndianFinancialYear(new Date(Date.UTC(2026, 2, 31)))).toBe("2025-26");
    expect(getIndianFinancialYear(new Date(Date.UTC(2026, 3, 1)))).toBe("2026-27");
    expect(getFinancialYearRange("2026-27")).toEqual({ start: new Date(Date.UTC(2026, 3, 1)), end: new Date(Date.UTC(2027, 3, 1)) });
  });

  it("formats paise in Indian currency notation", () => {
    expect(formatInrFromPaise(123456700)).toContain("12,34,567");
  });

  it("classifies planned spending as healthy, watch, and over", () => {
    expect(calculateBudgetHealth(7_000, 10_000)).toEqual({ percent: 70, state: "healthy" });
    expect(calculateBudgetHealth(8_000, 10_000)).toEqual({ percent: 80, state: "watch" });
    expect(calculateBudgetHealth(10_001, 10_000)).toEqual({ percent: 100, state: "over" });
  });

  it("flags expense outliers only after a useful history exists", () => {
    expect(detectUnusualTransaction(10_000, [1_000, 1_200, 1_300])).toBe(false);
    expect(detectUnusualTransaction(5_000, [1_000, 1_200, 1_300, 1_400])).toBe(true);
    expect(detectUnusualTransaction(2_000, [1_000, 1_200, 1_300, 1_400])).toBe(false);
  });
});
