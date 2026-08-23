export type SignalTransaction = {
  description: string;
  amountPaise: number;
  kind: "income" | "expense";
  occurredAt: Date | string;
  categoryName?: string | null;
};

export type SignalBudget = {
  categoryName: string;
  amountPaise: number;
  spentPaise: number;
};

export type RecurringExpense = {
  merchant: string;
  frequency: "weekly" | "monthly";
  averagePaise: number;
  monthlyPaise: number;
};

export type BudgetRisk = {
  categoryName: string;
  spentPaise: number;
  amountPaise: number;
  projectedPaise: number;
};

export type SpendingSignals = {
  monthChangePercent: number | null;
  threeMonthAverageChangePercent: number | null;
  recurringExpenses: RecurringExpense[];
  budgetRisks: BudgetRisk[];
};

const monthKey = (value: Date | string) => {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const normalizeMerchant = (description: string) => description.trim().toLowerCase().replace(/\s+/g, " ");

export function calculateSpendingSignals(input: { transactions: SignalTransaction[]; budgets: SignalBudget[]; referenceDate: Date }): SpendingSignals {
  const currentKey = monthKey(input.referenceDate);
  const currentMonth = input.referenceDate.getUTCMonth();
  const currentYear = input.referenceDate.getUTCFullYear();
  const monthlyExpenses = new Map<string, number>();
  const merchantGroups = new Map<string, SignalTransaction[]>();

  for (const transaction of input.transactions) {
    if (transaction.kind !== "expense") continue;
    const key = monthKey(transaction.occurredAt);
    monthlyExpenses.set(key, (monthlyExpenses.get(key) ?? 0) + transaction.amountPaise);
    const merchant = normalizeMerchant(transaction.description);
    if (merchant) merchantGroups.set(merchant, [...(merchantGroups.get(merchant) ?? []), transaction]);
  }

  const previousMonthDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const previousKey = monthKey(previousMonthDate);
  const currentExpense = monthlyExpenses.get(currentKey) ?? 0;
  const previousExpense = monthlyExpenses.get(previousKey) ?? 0;
  const monthChangePercent = currentExpense > 0 && previousExpense > 0 ? Math.round(((currentExpense - previousExpense) / previousExpense) * 100) : null;

  const priorValues = [1, 2, 3].map(offset => monthlyExpenses.get(monthKey(new Date(Date.UTC(currentYear, currentMonth - offset, 1)))) ?? 0).filter(value => value > 0);
  const priorAverage = priorValues.length ? priorValues.reduce((sum, value) => sum + value, 0) / priorValues.length : 0;
  const threeMonthAverageChangePercent = currentExpense > 0 && priorAverage > 0 ? Math.round(((currentExpense - priorAverage) / priorAverage) * 100) : null;

  const recurringExpenses = Array.from(merchantGroups.entries()).flatMap(([merchant, entries]) => {
    if (entries.length < 2) return [];
    const dates = entries.map(entry => new Date(entry.occurredAt).getTime()).sort((a, b) => a - b);
    const gaps = dates.slice(1).map((date, index) => Math.round((date - dates[index]) / 86_400_000));
    const averageGap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
    const frequency: RecurringExpense["frequency"] | null = averageGap >= 5 && averageGap <= 10 ? "weekly" : averageGap >= 20 && averageGap <= 40 ? "monthly" : null;
    if (!frequency) return [];
    const averagePaise = Math.round(entries.reduce((sum, entry) => sum + entry.amountPaise, 0) / entries.length);
    return [{ merchant: entries[0].description, frequency, averagePaise, monthlyPaise: frequency === "weekly" ? averagePaise * 4 : averagePaise }];
  }).sort((a, b) => b.monthlyPaise - a.monthlyPaise);

  const elapsedDays = Math.max(1, input.referenceDate.getUTCDate());
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
  const budgetRisks = input.budgets.flatMap(budget => {
    if (budget.spentPaise <= 0 || budget.amountPaise <= budget.spentPaise) return [];
    const projectedPaise = Math.round((budget.spentPaise / elapsedDays) * daysInMonth);
    return projectedPaise > budget.amountPaise ? [{ categoryName: budget.categoryName, spentPaise: budget.spentPaise, amountPaise: budget.amountPaise, projectedPaise }] : [];
  }).sort((a, b) => b.projectedPaise - a.projectedPaise);

  return { monthChangePercent, threeMonthAverageChangePercent, recurringExpenses, budgetRisks };
}
