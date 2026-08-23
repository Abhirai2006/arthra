import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { createCaLedgerCsv } from "../shared/caCsv";
import { getDb } from "./db";
import { acceptInvite, attachReceipt, createCaShareLink, createSpaceInvite, createTransaction, ensureFinanceWorkspace, getBudgetsWithSpend, getCaShareLink, getInvitePreview, getLedgerRows, getSpaceCategories, getAccessibleSpaces, getSpaceMembers, getTransactionDetail, revokeCaShareLink, setBudget } from "./financeDb";

const integration = process.env.DATABASE_URL ? describe : describe.skip;

integration("finance persistence integration", () => {
  const openId = `finance-test-${Date.now()}`; let userId = 0; let invitedUserId = 0; let spaceId = 0; let categoryId = 0; let transactionId = 0;

  beforeAll(async () => {
    const db = await getDb(); if (!db) throw new Error("Database unavailable for integration test");
    const [created] = await db.insert(users).values({ openId, name: "Finance test", email: `${openId}@example.com` }).$returningId(); userId = created.id;
    await ensureFinanceWorkspace(userId);
    const [space] = await getAccessibleSpaces(userId); if (!space) throw new Error("Expected default space"); spaceId = space.id;
    const [category] = await getSpaceCategories(userId, spaceId); if (!category) throw new Error("Expected default category"); categoryId = category.id;
  });

  afterAll(async () => { const db = await getDb(); if (db && invitedUserId) await db.delete(users).where(eq(users.id, invitedUserId)); if (db && userId) await db.delete(users).where(eq(users.id, userId)); });

  it("persists a GST transaction, attached receipt metadata, monthly budget, and Apr–Mar CA ledger row", async () => {
    const created = await createTransaction(userId, { spaceId, categoryId, kind: "expense", amountPaise: 12_345, description: "Integration invoice", note: "Recorded for verification", occurredAt: new Date(Date.UTC(2026, 3, 1, 9)), isGstApplicable: true, gstKind: "cgst_sgst", gstRateBasisPoints: 1800 });
    transactionId = created.id;
    await attachReceipt(userId, transactionId, { storageKey: `integration/${transactionId}/receipt.pdf`, storageUrl: "https://example.invalid/receipt.pdf", originalName: "receipt.pdf", mimeType: "application/pdf", byteSize: 128 });
    await setBudget(userId, { spaceId, categoryId, monthKey: "2026-04", amountPaise: 10_000, alertAtPercent: 80 });
    const detail = await getTransactionDetail(transactionId);
    expect(detail).toMatchObject({ description: "Integration invoice", isGstApplicable: true, gstKind: "cgst_sgst" });
    expect(detail?.receipts).toHaveLength(1);
    const budgets = await getBudgetsWithSpend(userId, spaceId, "2026-04");
    expect(budgets[0]).toMatchObject({ categoryId, spentPaise: 12_345, amountPaise: 10_000 });
    const rows = await getLedgerRows(userId, spaceId, new Date(Date.UTC(2026, 3, 1)), new Date(Date.UTC(2027, 3, 1)));
    expect(rows.some(row => row.id === transactionId && row.gstKind === "cgst_sgst")).toBe(true);
    const csv = createCaLedgerCsv(rows, "2026-27");
    expect(csv).toContain("Financial Year");
    expect(csv).toContain("Integration invoice");
    expect(csv).toContain("123.45");
  });

  it("creates a time-limited CA link and makes revocation immediately visible", async () => {
    const link = await createCaShareLink(userId, { spaceId, financialYear: "2026-27", expiresAt: new Date(Date.now() + 86_400_000) });
    expect(link.token).toHaveLength(64);
    expect(await getCaShareLink(link.token)).toMatchObject({ id: link.id, financialYear: "2026-27", revokedAt: null });
    await revokeCaShareLink(userId, link.id);
    expect((await getCaShareLink(link.token))?.revokedAt).not.toBeNull();
  });

  it("creates, accepts, and exposes a shared Expense Space only to the invited member", async () => {
    const db = await getDb(); if (!db) throw new Error("Database unavailable");
    const [invited] = await db.insert(users).values({ openId: `${openId}-invitee`, name: "Invited member", email: `${openId}-invitee@example.com` }).$returningId(); invitedUserId = invited.id;
    await ensureFinanceWorkspace(invitedUserId);
    const invite = await createSpaceInvite(userId, spaceId, { role: "editor", expiresAt: new Date(Date.now() + 86_400_000) });
    expect((await getInvitePreview(invite.token))?.spaceName).toBe("Home");
    await acceptInvite(invitedUserId, invite.token);
    const members = await getSpaceMembers(userId, spaceId);
    expect(members).toEqual(expect.arrayContaining([expect.objectContaining({ id: invitedUserId, role: "editor" })]));
    const accessible = await getAccessibleSpaces(invitedUserId);
    expect(accessible).toEqual(expect.arrayContaining([expect.objectContaining({ id: spaceId, role: "editor" })]));
    expect((await getSpaceCategories(invitedUserId, spaceId)).length).toBeGreaterThan(0);
  }, 15_000);
});
