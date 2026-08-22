export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & dining", color: "orange", icon: "utensils" },
  { name: "Transport", color: "sky", icon: "car" },
  { name: "Shopping", color: "pink", icon: "bag" },
  { name: "Bills & utilities", color: "violet", icon: "receipt" },
  { name: "Health", color: "rose", icon: "heart" },
  { name: "Entertainment", color: "amber", icon: "sparkles" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "emerald", icon: "briefcase" },
  { name: "Freelance", color: "cyan", icon: "laptop" },
  { name: "Investment", color: "indigo", icon: "chart" },
  { name: "Other income", color: "slate", icon: "plus" },
] as const;

export function formatInrFromPaise(amountPaise: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(amountPaise / 100);
}

export function getMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getIndianFinancialYear(date: Date) {
  const year = date.getUTCFullYear();
  const startsThisApril = date.getUTCMonth() >= 3;
  const startYear = startsThisApril ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export function getFinancialYearRange(financialYear: string) {
  const startYear = Number(financialYear.slice(0, 4));
  if (!Number.isInteger(startYear)) throw new Error("Invalid financial year");
  return {
    start: new Date(Date.UTC(startYear, 3, 1)),
    end: new Date(Date.UTC(startYear + 1, 3, 1)),
  };
}

export function detectUnusualTransaction(amountPaise: number, recentExpensePaise: number[]) {
  if (recentExpensePaise.length < 4) return false;
  const sorted = [...recentExpensePaise].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return median > 0 && amountPaise >= median * 2.5;
}

export function calculateBudgetHealth(spentPaise: number, budgetPaise: number) {
  if (budgetPaise <= 0) return { percent: 0, state: "unplanned" as const };
  const percent = Math.round((spentPaise / budgetPaise) * 100);
  if (spentPaise > budgetPaise) return { percent, state: "over" as const };
  if (percent >= 80) return { percent, state: "watch" as const };
  return { percent, state: "healthy" as const };
}
