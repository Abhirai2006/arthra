export type SpendingSeriesPoint = { monthKey: string; incomePaise: number; expensePaise: number };
export type SpendingCategory = { name: string; amountPaise: number };

export type InsightProvider = (input: { categories: SpendingCategory[]; monthlyTrend: SpendingSeriesPoint[] }) => string;

/**
 * A transparent deterministic provider. It deliberately avoids financial advice
 * while leaving a stable interface for a future opt-in server-side LLM provider.
 */
export const deterministicInsightProvider: InsightProvider = ({ categories, monthlyTrend }) => {
  const top = categories[0]; const latest = monthlyTrend.at(-1); const prior = monthlyTrend.at(-2);
  if (!top || !latest) return "Log a few entries and Arthra will start surfacing spending rhythm, category pressure, and unusual moments—without pretending that it knows more than your records show.";
  const formattedAmount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(top.amountPaise / 100);
  const change = prior?.expensePaise ? Math.round(((latest.expensePaise - prior.expensePaise) / prior.expensePaise) * 100) : null;
  return `${top.name} is currently the largest spending category at ${formattedAmount}. ${change === null ? "Keep adding context to compare it month by month." : change > 0 ? `Your latest month is ${change}% above the previous one.` : change < 0 ? `Your latest month is ${Math.abs(change)}% below the previous one.` : "Your latest month is level with the previous one."}`;
};
