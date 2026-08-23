import { describe, expect, it } from "vitest";
import { createAiFinancialSummary } from "./aiInsights";
import { suggestReceiptFields } from "./receiptAssist";

describe("optional assist boundaries", () => {
  it("keeps PDF receipt attachment on the manual fallback path without calling a model", async () => {
    await expect(suggestReceiptFields("data:application/pdf;base64,ZmFrZQ==")).rejects.toThrow("currently support JPG, PNG, and WEBP");
  });

  it("returns a useful insufficient-history AI state without calling an external model", async () => {
    await expect(createAiFinancialSummary({ monthlyTrend: [], categoryBreakdown: [], signals: { monthChangePercent: null, threeMonthAverageChangePercent: null, recurringExpenses: [], budgetRisks: [] } })).resolves.toContain("not enough workspace history");
  });
});
