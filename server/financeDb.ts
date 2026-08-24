import { and, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import {
  accounts,
  budgets,
  caShareLinks,
  categories,
  spaceInvites,
  spaceMembers,
  spaces,
  transactionReceipts,
  transactions,
  users,
  userStreaks,
  weeklyDigestPreferences,
} from "../drizzle/schema";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  detectUnusualTransaction,
  getMonthKey,
} from "../shared/finance";
import { canWriteExpenseSpace, hasExpenseSpaceAccess } from "../shared/permissions";
import { calculateSpendingSignals } from "../shared/spendingSignals";
import { getDb } from "./db";

export type SpaceRole = "owner" | "editor" | "viewer";

type SpaceWriteRole = Exclude<SpaceRole, "viewer">;

export async function ensureFinanceWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const ownedSpaces = await db.select().from(spaces).where(eq(spaces.ownerId, userId));
  if (ownedSpaces.length > 0) return;

  await db.insert(spaces).values([
    { ownerId: userId, name: "Home", color: "violet", icon: "home" },
    { ownerId: userId, name: "Office", color: "amber", icon: "briefcase" },
  ]);

  const currentSpaces = await db.select().from(spaces).where(eq(spaces.ownerId, userId));
  for (const space of currentSpaces) {
    await db
      .insert(spaceMembers)
      .values({ spaceId: space.id, userId, role: "owner" })
      .onDuplicateKeyUpdate({ set: { role: "owner" } });
  }

  const currentCategories = await db.select({ id: categories.id }).from(categories).where(eq(categories.ownerId, userId));
  if (currentCategories.length === 0) {
    await db.insert(categories).values([
      ...DEFAULT_EXPENSE_CATEGORIES.map(category => ({ ...category, ownerId: userId, kind: "expense" as const })),
      ...DEFAULT_INCOME_CATEGORIES.map(category => ({ ...category, ownerId: userId, kind: "income" as const })),
    ]);
  }

  const existingAccounts = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.ownerId, userId));
  if (existingAccounts.length === 0 && currentSpaces.length > 0) {
    await db.insert(accounts).values(
      currentSpaces.slice(0, 2).map(space => ({
        ownerId: userId,
        spaceId: space.id,
        name: space.name === "Office" ? "Business account" : "Primary account",
        kind: "bank" as const,
      }))
    );
  }

  await db
    .insert(userStreaks)
    .values({ userId })
    .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });

  const [profile] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  await db
    .insert(weeklyDigestPreferences)
    .values({ userId, destinationEmail: profile?.email ?? null })
    .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
}

export async function getAccessibleSpaces(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({
      id: spaces.id,
      name: spaces.name,
      color: spaces.color,
      icon: spaces.icon,
      ownerId: spaces.ownerId,
      role: spaceMembers.role,
      createdAt: spaces.createdAt,
    })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
    .where(eq(spaceMembers.userId, userId))
    .orderBy(desc(spaces.createdAt));
}

export async function getSpaceMembership(userId: number, spaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [membership] = await db
    .select({ role: spaceMembers.role, spaceId: spaceMembers.spaceId, ownerId: spaces.ownerId, name: spaces.name })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
    .where(and(eq(spaceMembers.userId, userId), eq(spaceMembers.spaceId, spaceId)))
    .limit(1);
  return membership ?? null;
}

export async function canAccessSpace(userId: number, spaceId: number, requiredRole: "read" | "write" | "owner" = "read") {
  const membership = await getSpaceMembership(userId, spaceId);
  if (!membership) return null;
  if (!hasExpenseSpaceAccess(membership.role, requiredRole)) return null;
  return membership as typeof membership & { role: SpaceRole };
}

export async function getUserCategories(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.ownerId, userId), eq(categories.isArchived, false)))
    .orderBy(categories.kind, categories.name);
}

export async function createCategory(userId: number, input: { name: string; kind: "expense" | "income"; color: string; icon: string; spaceId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.spaceId) {
    const membership = await getSpaceMembership(userId, input.spaceId);
    if (!membership || !canWriteExpenseSpace(membership.role)) throw new Error("You do not have permission to add a category here");
  }
  const [created] = await db.insert(categories).values({ ownerId: userId, ...input }).$returningId();
  return created;
}

export async function getSpaceCategories(userId: number, spaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = await getSpaceMembership(userId, spaceId);
  if (!membership) throw new Error("Expense Space not found");
  const categoryOwners = Array.from(new Set([userId, membership.ownerId]));
  return db
    .select()
    .from(categories)
    .where(and(or(inArray(categories.ownerId, categoryOwners), eq(categories.spaceId, spaceId)), eq(categories.isArchived, false)))
    .orderBy(categories.kind, categories.name);
}

export async function getSpaceAccounts(userId: number, spaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select()
    .from(accounts)
    .where(and(eq(accounts.spaceId, spaceId), eq(accounts.isArchived, false)))
    .orderBy(accounts.name);
}

export async function getSpaceMembers(userId: number, spaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = await getSpaceMembership(userId, spaceId);
  if (!membership) throw new Error("Expense Space not found");
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: spaceMembers.role, joinedAt: spaceMembers.joinedAt })
    .from(spaceMembers)
    .innerJoin(users, eq(spaceMembers.userId, users.id))
    .where(eq(spaceMembers.spaceId, spaceId))
    .orderBy(spaceMembers.joinedAt);
}

export async function createSpace(userId: number, input: { name: string; color: string; icon: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const ownSpaces = await db.select({ id: spaces.id }).from(spaces).where(eq(spaces.ownerId, userId));
  if (ownSpaces.length >= 3) throw new Error("Each account can own up to three Expense Spaces");
  const [created] = await db.insert(spaces).values({ ownerId: userId, ...input }).$returningId();
  await db.insert(spaceMembers).values({ spaceId: created.id, userId, role: "owner" });
  await db.insert(accounts).values({ ownerId: userId, spaceId: created.id, name: "Primary account", kind: "bank" });
  return created;
}

export async function createSpaceInvite(
  userId: number,
  spaceId: number,
  input: { email?: string; role: "editor" | "viewer"; expiresAt: Date }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const [created] = await db
    .insert(spaceInvites)
    .values({ spaceId, createdById: userId, token, ...input })
    .$returningId();
  return { ...created, token };
}

export async function getInvitePreview(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [invite] = await db
    .select({
      id: spaceInvites.id,
      token: spaceInvites.token,
      role: spaceInvites.role,
      expiresAt: spaceInvites.expiresAt,
      revokedAt: spaceInvites.revokedAt,
      acceptedAt: spaceInvites.acceptedAt,
      spaceName: spaces.name,
      spaceColor: spaces.color,
    })
    .from(spaceInvites)
    .innerJoin(spaces, eq(spaceInvites.spaceId, spaces.id))
    .where(eq(spaceInvites.token, token))
    .limit(1);
  return invite ?? null;
}

export async function acceptInvite(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [invite] = await db.select().from(spaceInvites).where(eq(spaceInvites.token, token)).limit(1);
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error("This invitation is no longer available");
  }
  await db
    .insert(spaceMembers)
    .values({ spaceId: invite.spaceId, userId, role: invite.role })
    .onDuplicateKeyUpdate({ set: { role: invite.role } });
  await db.update(spaceInvites).set({ acceptedAt: new Date() }).where(eq(spaceInvites.id, invite.id));
  return { spaceId: invite.spaceId };
}

async function validateTransactionReferences(
  userId: number,
  spaceId: number,
  categoryId?: number | null,
  accountId?: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = await getSpaceMembership(userId, spaceId);
  if (!membership) throw new Error("Expense Space not found");
  if (categoryId) {
    const [category] = await db
      .select({ id: categories.id, ownerId: categories.ownerId, spaceId: categories.spaceId })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!category) throw new Error("Select a category available to this space");
    const visibleToSpace = category.spaceId === spaceId || category.ownerId === userId || category.ownerId === membership.ownerId;
    if (!visibleToSpace) throw new Error("Select a category available to this space");
  }
  if (accountId) {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.spaceId, spaceId)))
      .limit(1);
    if (!account) throw new Error("Select an account that belongs to this space");
  }
}

export async function listTransactions(
  userId: number,
  input: { spaceId: number; start?: Date; end?: Date; limit?: number; categoryId?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(transactions.spaceId, input.spaceId)];
  if (input.start) conditions.push(gte(transactions.occurredAt, input.start));
  if (input.end) conditions.push(lt(transactions.occurredAt, input.end));
  if (input.categoryId) conditions.push(eq(transactions.categoryId, input.categoryId));
  return db
    .select({
      id: transactions.id,
      spaceId: transactions.spaceId,
      kind: transactions.kind,
      amountPaise: transactions.amountPaise,
      description: transactions.description,
      note: transactions.note,
      occurredAt: transactions.occurredAt,
      isGstApplicable: transactions.isGstApplicable,
      gstKind: transactions.gstKind,
      gstRateBasisPoints: transactions.gstRateBasisPoints,
      isUnusual: transactions.isUnusual,
      recurringRule: transactions.recurringRule,
      createdById: transactions.createdById,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      accountId: transactions.accountId,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))
    .limit(input.limit ?? 100);
}

export type TransactionImportCandidate = {
  occurredAt: Date;
  kind: "expense" | "income";
  amountPaise: number;
  description: string;
};

export function getTransactionImportFingerprint(input: TransactionImportCandidate) {
  const description = input.description.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return [input.occurredAt.toISOString().slice(0, 10), input.kind, input.amountPaise, description].join("|");
}

export async function getExistingTransactionImportFingerprints(spaceId: number, candidates: TransactionImportCandidate[]) {
  if (!candidates.length) return new Set<string>();
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const occurredAtValues = candidates.map(item => item.occurredAt.getTime());
  const start = new Date(Math.min(...occurredAtValues));
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(Math.max(...occurredAtValues));
  end.setUTCHours(24, 0, 0, 0);
  const existing = await db
    .select({ occurredAt: transactions.occurredAt, kind: transactions.kind, amountPaise: transactions.amountPaise, description: transactions.description })
    .from(transactions)
    .where(and(eq(transactions.spaceId, spaceId), gte(transactions.occurredAt, start), lt(transactions.occurredAt, end)));
  return new Set(existing.map(getTransactionImportFingerprint));
}

export async function createTransaction(
  userId: number,
  input: {
    spaceId: number;
    accountId?: number | null;
    categoryId?: number | null;
    kind: "expense" | "income";
    amountPaise: number;
    description: string;
    note?: string | null;
    occurredAt: Date;
    isGstApplicable: boolean;
    gstKind?: "cgst_sgst" | "igst" | null;
    gstRateBasisPoints?: number | null;
    recurringRule?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await validateTransactionReferences(userId, input.spaceId, input.categoryId, input.accountId);
  const recentExpenses = await db
    .select({ amountPaise: transactions.amountPaise })
    .from(transactions)
    .where(and(eq(transactions.spaceId, input.spaceId), eq(transactions.kind, "expense")))
    .orderBy(desc(transactions.occurredAt))
    .limit(30);
  const isUnusual = input.kind === "expense" && detectUnusualTransaction(input.amountPaise, recentExpenses.map(item => item.amountPaise));
  const [created] = await db
    .insert(transactions)
    .values({ ...input, createdById: userId, isUnusual })
    .$returningId();
  await updateLoggingStreak(userId, input.occurredAt);
  return { ...created, isUnusual };
}

export async function updateTransaction(
  userId: number,
  transactionId: number,
  input: {
    accountId?: number | null;
    categoryId?: number | null;
    kind: "expense" | "income";
    amountPaise: number;
    description: string;
    note?: string | null;
    occurredAt: Date;
    isGstApplicable: boolean;
    gstKind?: "cgst_sgst" | "igst" | null;
    gstRateBasisPoints?: number | null;
    recurringRule?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [transaction] = await db.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
  if (!transaction) throw new Error("Transaction not found");
  await validateTransactionReferences(userId, transaction.spaceId, input.categoryId, input.accountId);
  await db.update(transactions).set(input).where(eq(transactions.id, transactionId));
  return { id: transactionId };
}

export async function deleteTransaction(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(transactions).where(eq(transactions.id, transactionId));
  return { id: transactionId };
}

export async function getTransactionDetail(transactionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [transaction] = await db
    .select({
      id: transactions.id,
      spaceId: transactions.spaceId,
      kind: transactions.kind,
      amountPaise: transactions.amountPaise,
      description: transactions.description,
      note: transactions.note,
      occurredAt: transactions.occurredAt,
      isGstApplicable: transactions.isGstApplicable,
      gstKind: transactions.gstKind,
      gstRateBasisPoints: transactions.gstRateBasisPoints,
      isUnusual: transactions.isUnusual,
      recurringRule: transactions.recurringRule,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      accountId: transactions.accountId,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(transactions.id, transactionId))
    .limit(1);
  if (!transaction) return null;
  const receipts = await db.select().from(transactionReceipts).where(eq(transactionReceipts.transactionId, transactionId));
  return { ...transaction, receipts };
}

export async function attachReceipt(
  userId: number,
  transactionId: number,
  receipt: { storageKey: string; storageUrl: string; originalName: string; mimeType: string; byteSize: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [created] = await db
    .insert(transactionReceipts)
    .values({ transactionId, uploadedById: userId, ...receipt })
    .$returningId();
  return created;
}

export async function setBudget(
  userId: number,
  input: { spaceId: number; categoryId: number; monthKey: string; amountPaise: number; alertAtPercent: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = await getSpaceMembership(userId, input.spaceId);
  if (!membership) throw new Error("Expense Space not found");
  await validateTransactionReferences(userId, input.spaceId, input.categoryId);
  await db
    .insert(budgets)
    .values({ ownerId: membership.ownerId, ...input })
    .onDuplicateKeyUpdate({ set: { amountPaise: input.amountPaise, alertAtPercent: input.alertAtPercent, updatedAt: new Date() } });
}

export async function getBudgetsWithSpend(userId: number, spaceId: number, monthKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const membership = await getSpaceMembership(userId, spaceId);
  if (!membership) throw new Error("Expense Space not found");
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const budgetRows = await db
    .select({
      id: budgets.id,
      categoryId: budgets.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      amountPaise: budgets.amountPaise,
      alertAtPercent: budgets.alertAtPercent,
    })
    .from(budgets)
    .innerJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.ownerId, membership.ownerId), eq(budgets.spaceId, spaceId), eq(budgets.monthKey, monthKey)));
  const spends = await db
    .select({ categoryId: transactions.categoryId, amountPaise: sql<number>`sum(${transactions.amountPaise})` })
    .from(transactions)
    .where(and(eq(transactions.spaceId, spaceId), eq(transactions.kind, "expense"), gte(transactions.occurredAt, start), lt(transactions.occurredAt, end)))
    .groupBy(transactions.categoryId);
  const spendsByCategory = new Map(spends.map(item => [item.categoryId, Number(item.amountPaise)]));
  return budgetRows.map(budget => ({ ...budget, spentPaise: spendsByCategory.get(budget.categoryId) ?? 0 }));
}

export async function getDashboardData(userId: number, spaceId: number, monthKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const monthTransactions = await listTransactions(userId, { spaceId, start, end, limit: 250 });
  const allTransactions = await listTransactions(userId, { spaceId, limit: 250 });
  const incomePaise = monthTransactions.filter(item => item.kind === "income").reduce((sum, item) => sum + item.amountPaise, 0);
  const expensePaise = monthTransactions.filter(item => item.kind === "expense").reduce((sum, item) => sum + item.amountPaise, 0);
  const balancePaise = allTransactions.reduce((sum, item) => sum + (item.kind === "income" ? item.amountPaise : -item.amountPaise), 0);
  const categorySpend = new Map<string, { name: string; color: string | null; amountPaise: number }>();
  for (const item of monthTransactions.filter(item => item.kind === "expense")) {
    const key = item.categoryId?.toString() ?? "uncategorized";
    const previous = categorySpend.get(key) ?? { name: item.categoryName ?? "Uncategorized", color: item.categoryColor, amountPaise: 0 };
    previous.amountPaise += item.amountPaise;
    categorySpend.set(key, previous);
  }
  const streak = (await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1))[0];
  const budgetsWithSpend = await getBudgetsWithSpend(userId, spaceId, monthKey);
  return {
    summary: { incomePaise, expensePaise, balancePaise, netPaise: incomePaise - expensePaise },
    recentTransactions: monthTransactions.slice(0, 8),
    categorySpend: Array.from(categorySpend.values()).sort((a, b) => b.amountPaise - a.amountPaise),
    budgets: budgetsWithSpend,
    streak: streak ?? { currentStreak: 0, longestStreak: 0, lastLoggedOn: null },
  };
}

export async function getAnalyticsData(userId: number, spaceId: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const data = await listTransactions(userId, { spaceId, start, limit: 500 });
  const currentBudgets = await getBudgetsWithSpend(userId, spaceId, getMonthKey(now));
  const months = new Map<string, { monthKey: string; incomePaise: number; expensePaise: number }>();
  const categoryMap = new Map<string, { name: string; color: string | null; amountPaise: number }>();
  for (const item of data) {
    const monthKey = getMonthKey(item.occurredAt);
    const monthly = months.get(monthKey) ?? { monthKey, incomePaise: 0, expensePaise: 0 };
    if (item.kind === "income") monthly.incomePaise += item.amountPaise;
    else monthly.expensePaise += item.amountPaise;
    months.set(monthKey, monthly);
    if (item.kind === "expense") {
      const key = item.categoryId?.toString() ?? "uncategorized";
      const category = categoryMap.get(key) ?? { name: item.categoryName ?? "Uncategorized", color: item.categoryColor, amountPaise: 0 };
      category.amountPaise += item.amountPaise;
      categoryMap.set(key, category);
    }
  }
  return {
    monthlyTrend: Array.from(months.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.amountPaise - a.amountPaise),
    transactions: data,
    signals: calculateSpendingSignals({
      transactions: data.map(transaction => ({ description: transaction.description, amountPaise: transaction.amountPaise, kind: transaction.kind, occurredAt: transaction.occurredAt, categoryName: transaction.categoryName })),
      budgets: currentBudgets.map(budget => ({ categoryName: budget.categoryName, amountPaise: budget.amountPaise, spentPaise: budget.spentPaise })),
      referenceDate: now,
    }),
  };
}

export async function getLedgerRows(userId: number, spaceId: number | null, start: Date, end: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const accessible = await getAccessibleSpaces(userId);
  const allowedSpaceIds = spaceId ? [spaceId] : accessible.map(space => space.id);
  if (allowedSpaceIds.length === 0) return [];
  return db
    .select({
      id: transactions.id,
      occurredAt: transactions.occurredAt,
      description: transactions.description,
      kind: transactions.kind,
      amountPaise: transactions.amountPaise,
      note: transactions.note,
      isGstApplicable: transactions.isGstApplicable,
      gstKind: transactions.gstKind,
      gstRateBasisPoints: transactions.gstRateBasisPoints,
      categoryName: categories.name,
      spaceName: spaces.name,
    })
    .from(transactions)
    .innerJoin(spaces, eq(transactions.spaceId, spaces.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(inArray(transactions.spaceId, allowedSpaceIds), gte(transactions.occurredAt, start), lt(transactions.occurredAt, end)))
    .orderBy(desc(transactions.occurredAt));
}

export async function createCaShareLink(userId: number, input: { spaceId?: number | null; financialYear: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const [created] = await db.insert(caShareLinks).values({ ownerId: userId, token, ...input }).$returningId();
  return { ...created, token };
}

export async function getCaShareLink(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [link] = await db.select().from(caShareLinks).where(eq(caShareLinks.token, token)).limit(1);
  return link ?? null;
}

export async function listCaShareLinks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db
    .select({ id: caShareLinks.id, token: caShareLinks.token, financialYear: caShareLinks.financialYear, spaceId: caShareLinks.spaceId, expiresAt: caShareLinks.expiresAt, revokedAt: caShareLinks.revokedAt, createdAt: caShareLinks.createdAt, spaceName: spaces.name })
    .from(caShareLinks)
    .leftJoin(spaces, eq(caShareLinks.spaceId, spaces.id))
    .where(eq(caShareLinks.ownerId, userId))
    .orderBy(desc(caShareLinks.createdAt));
}

export async function revokeCaShareLink(userId: number, linkId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(caShareLinks).set({ revokedAt: new Date() }).where(and(eq(caShareLinks.id, linkId), eq(caShareLinks.ownerId, userId)));
}

export async function getDigestPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [preferences] = await db.select().from(weeklyDigestPreferences).where(eq(weeklyDigestPreferences.userId, userId)).limit(1);
  return preferences ?? null;
}

export async function saveDigestPreferences(userId: number, input: { enabled: boolean; destinationEmail?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .insert(weeklyDigestPreferences)
    .values({ userId, ...input })
    .onDuplicateKeyUpdate({ set: { ...input, updatedAt: new Date() } });
}

async function updateLoggingStreak(userId: number, occurredAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const today = occurredAt.toISOString().slice(0, 10);
  const [streak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId)).limit(1);
  if (!streak) {
    await db.insert(userStreaks).values({ userId, currentStreak: 1, longestStreak: 1, lastLoggedOn: today });
    return;
  }
  if (streak.lastLoggedOn === today) return;
  const previous = new Date(occurredAt);
  previous.setUTCDate(previous.getUTCDate() - 1);
  const expectedPreviousDay = previous.toISOString().slice(0, 10);
  const currentStreak = streak.lastLoggedOn === expectedPreviousDay ? streak.currentStreak + 1 : 1;
  await db
    .update(userStreaks)
    .set({ currentStreak, longestStreak: Math.max(streak.longestStreak, currentStreak), lastLoggedOn: today })
    .where(eq(userStreaks.userId, userId));
}
