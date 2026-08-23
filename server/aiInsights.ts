import { listLLMModels, invokeLLM } from "./_core/llm";

type AnalyticsSummaryInput = {
  monthlyTrend: Array<{ monthKey: string; incomePaise: number; expensePaise: number }>;
  categoryBreakdown: Array<{ name: string; amountPaise: number }>;
  signals: {
    monthChangePercent: number | null;
    threeMonthAverageChangePercent: number | null;
    recurringExpenses: Array<{ merchant: string; frequency: string; monthlyPaise: number }>;
    budgetRisks: Array<{ categoryName: string; amountPaise: number; projectedPaise: number }>;
  };
};

export async function createAiFinancialSummary(input: AnalyticsSummaryInput) {
  if (!input.monthlyTrend.length && !input.categoryBreakdown.length) {
    return "There is not enough workspace history for an AI summary yet. Add a few records first; calculated cards will become available as patterns emerge.";
  }
  const models = await listLLMModels();
  const model = models.data.find(item => item.id === "gemini-3-flash-preview")?.id ?? models.data.find(item => item.id === "gpt-5-mini")?.id;
  if (!model) throw new Error("AI financial summaries are temporarily unavailable.");

  const facts = {
    monthlyTrend: input.monthlyTrend.slice(-6),
    topCategories: input.categoryBreakdown.slice(0, 5),
    calculatedSignals: input.signals,
  };
  const result = await invokeLLM({
    model,
    maxTokens: 250,
    messages: [
      { role: "system", content: "You write concise financial-record summaries. Use only supplied facts. Do not invent values or dates, give investment/tax/legal advice, predict with certainty, or make guarantees. Write at most 3 plain-language sentences. Clearly call any projection a calculated projection, not a certainty." },
      { role: "user", content: `Summarise these authorised, aggregated workspace facts for the account holder:\n${JSON.stringify(facts)}` },
    ],
  });
  const content = result.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI financial summaries returned an unreadable response.");
  return content.trim();
}
