import { describe, expect, it } from "vitest";
import { deterministicInsightProvider } from "./insights";

describe("deterministicInsightProvider", () => {
  it("grounds an observation in the supplied category and monthly trend", () => {
    const insight = deterministicInsightProvider({
      categories: [{ name: "Food & dining", amountPaise: 245000 }],
      monthlyTrend: [
        { monthKey: "2026-06", incomePaise: 0, expensePaise: 100000 },
        { monthKey: "2026-07", incomePaise: 0, expensePaise: 125000 },
      ],
    });
    expect(insight).toContain("Food & dining");
    expect(insight).toContain("25% above");
  });

  it("does not invent a pattern when the required live inputs are absent", () => {
    expect(deterministicInsightProvider({ categories: [], monthlyTrend: [] })).toContain("Log a few entries");
  });
});
