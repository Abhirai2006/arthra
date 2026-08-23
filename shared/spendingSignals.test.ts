import { describe, expect, it } from "vitest";
import { calculateSpendingSignals } from "./spendingSignals";

const referenceDate = new Date("2026-08-20T12:00:00.000Z");

describe("calculateSpendingSignals", () => {
  it("derives month comparisons, recurring monthly costs, and a budget risk from supplied records only", () => {
    const result = calculateSpendingSignals({
      referenceDate,
      transactions: [
        { description: "StreamFlix", kind: "expense", amountPaise: 64900, occurredAt: "2026-07-18T12:00:00.000Z" },
        { description: "StreamFlix", kind: "expense", amountPaise: 64900, occurredAt: "2026-08-18T12:00:00.000Z" },
        { description: "Food shop", kind: "expense", amountPaise: 240000, occurredAt: "2026-07-10T12:00:00.000Z" },
        { description: "Food shop", kind: "expense", amountPaise: 500000, occurredAt: "2026-08-10T12:00:00.000Z" },
      ],
      budgets: [{ categoryName: "Food", amountPaise: 600000, spentPaise: 500000 }],
    });

    expect(result.monthChangePercent).toBe(85);
    expect(result.recurringExpenses).toContainEqual({ merchant: "StreamFlix", frequency: "monthly", averagePaise: 64900, monthlyPaise: 64900 });
    expect(result.recurringExpenses).toContainEqual({ merchant: "Food shop", frequency: "monthly", averagePaise: 370000, monthlyPaise: 370000 });
    expect(result.budgetRisks).toEqual([{ categoryName: "Food", spentPaise: 500000, amountPaise: 600000, projectedPaise: 775000 }]);
  });

  it("returns no confident comparisons when the necessary history is absent", () => {
    const result = calculateSpendingSignals({ referenceDate, transactions: [], budgets: [] });
    expect(result).toEqual({ monthChangePercent: null, threeMonthAverageChangePercent: null, recurringExpenses: [], budgetRisks: [] });
  });
});
