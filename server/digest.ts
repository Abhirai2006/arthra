import type { Request, Response } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import { getMonthKey, calculateBudgetHealth, formatInrFromPaise } from "../shared/finance";
import { users, weeklyDigestPreferences } from "../drizzle/schema";
import { getDb } from "./db";
import { getAccessibleSpaces, getBudgetsWithSpend, listTransactions } from "./financeDb";
import { sdk } from "./_core/sdk";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function mondayKey(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

async function sendDigestEmail(input: { to: string; totalSpendPaise: number; topCategory: string; budgetHealth: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Weekly digest email is not configured");
  const amount = formatInrFromPaise(input.totalSpendPaise);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `arthra-weekly-${input.to}-${new Date().toISOString().slice(0, 10)}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Your Arthra weekly view: ${amount} spent`,
      text: `Your weekly Arthra snapshot: You spent ${amount} in the past 7 days. Your biggest category was ${input.topCategory}. Budget health: ${input.budgetHealth}.`,
      html: `<main style="font-family:Arial,sans-serif;color:#181426;max-width:560px;margin:auto;padding:28px"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7250ff">Arthra · Weekly view</p><h1 style="font-size:28px">Your week in one calm glance.</h1><p>You spent <strong>${escapeHtml(amount)}</strong> over the last 7 days.</p><div style="padding:18px;border-radius:16px;background:#f4f0ff"><p style="margin:0 0 8px">Top category</p><strong>${escapeHtml(input.topCategory)}</strong><p style="margin:16px 0 8px">Budget health</p><strong>${escapeHtml(input.budgetHealth)}</strong></div><p style="color:#6f6b7f;margin-top:24px">You are receiving this because weekly digest is enabled in Arthra.</p></main>`,
    }),
  });
  if (!response.ok) throw new Error(`Email delivery failed with status ${response.status}`);
}

async function sendAllWeeklyDigests() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const sentForWeek = mondayKey(new Date());
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const recipients = await db
    .select({ userId: users.id, destinationEmail: weeklyDigestPreferences.destinationEmail, lastSentForWeek: weeklyDigestPreferences.lastSentForWeek })
    .from(weeklyDigestPreferences)
    .innerJoin(users, eq(weeklyDigestPreferences.userId, users.id))
    .where(and(eq(weeklyDigestPreferences.enabled, true), isNotNull(weeklyDigestPreferences.destinationEmail)));

  let sent = 0;
  let skipped = 0;
  for (const recipient of recipients) {
    if (!recipient.destinationEmail || recipient.lastSentForWeek === sentForWeek) {
      skipped += 1;
      continue;
    }
    const accessibleSpaces = await getAccessibleSpaces(recipient.userId);
    const spaceDigests = await Promise.all(
      accessibleSpaces.map(async space => {
        const [recentTransactions, budgets] = await Promise.all([
          listTransactions(recipient.userId, { spaceId: space.id, start: weekStart, limit: 500 }),
          getBudgetsWithSpend(recipient.userId, space.id, getMonthKey(new Date())),
        ]);
        return { recentTransactions, budgets };
      })
    );
    const expenses = spaceDigests.flatMap(item => item.recentTransactions).filter(item => item.kind === "expense");
    const totalSpendPaise = expenses.reduce((sum, item) => sum + item.amountPaise, 0);
    const categorySpend = new Map<string, number>();
    for (const expense of expenses) {
      const label = expense.categoryName ?? "Uncategorized";
      categorySpend.set(label, (categorySpend.get(label) ?? 0) + expense.amountPaise);
    }
    const topCategory = Array.from(categorySpend.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No spending logged";
    const monthlyBudget = spaceDigests.flatMap(item => item.budgets).reduce((sum, item) => sum + item.amountPaise, 0);
    const monthlySpend = spaceDigests.flatMap(item => item.budgets).reduce((sum, item) => sum + item.spentPaise, 0);
    const health = calculateBudgetHealth(monthlySpend, monthlyBudget);
    const budgetHealth = health.state === "unplanned" ? "No budgets set yet" : health.state === "over" ? `${health.percent}% of budget — over plan` : health.state === "watch" ? `${health.percent}% of budget — keep an eye on it` : `${health.percent}% of budget — on track`;
    await sendDigestEmail({ to: recipient.destinationEmail, totalSpendPaise, topCategory, budgetHealth });
    await db.update(weeklyDigestPreferences).set({ lastSentForWeek: sentForWeek }).where(eq(weeklyDigestPreferences.userId, recipient.userId));
    sent += 1;
  }
  return { sent, skipped };
}

export async function weeklyDigestHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await sendAllWeeklyDigests();
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown weekly digest error";
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
