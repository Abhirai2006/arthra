import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { appRouter } from "./routers";
import { createTransaction, ensureFinanceWorkspace, getAccessibleSpaces, listTransactions } from "./financeDb";
import { getDb } from "./db";

const integration = process.env.DATABASE_URL ? describe : describe.skip;

integration("transaction history import", () => {
  const openId = `transaction-import-test-${Date.now()}`;
  let user: any; let spaceId = 0;

  beforeAll(async () => {
    const db = await getDb(); if (!db) throw new Error("Database unavailable for import integration test");
    const [created] = await db.insert(users).values({ openId, name: "Import test", email: `${openId}@example.com` }).$returningId();
    await ensureFinanceWorkspace(created.id);
    const [stored] = await db.select().from(users).where(eq(users.id, created.id)).limit(1); user = stored;
    const [space] = await getAccessibleSpaces(created.id); if (!space) throw new Error("Expected workspace"); spaceId = space.id;
  });

  afterAll(async () => { const db = await getDb(); if (db && user?.id) await db.delete(users).where(eq(users.id, user.id)); });

  function caller() {
    return appRouter.createCaller({ user, req: { headers: {} } as any, res: {} as any });
  }

  it("flags existing rows and imports only the confirmed non-duplicate rows", async () => {
    const duplicateDate = new Date(Date.UTC(2026, 4, 7, 12));
    await createTransaction(user.id, { spaceId, kind: "expense", amountPaise: 1_250, description: "Metro ride", occurredAt: duplicateDate, isGstApplicable: false });
    const rows = [
      { sourceIndex: 0, kind: "expense" as const, amountPaise: 1_250, description: "Metro ride", occurredAt: duplicateDate },
      { sourceIndex: 1, kind: "income" as const, amountPaise: 55_000, description: "May salary", occurredAt: new Date(Date.UTC(2026, 4, 8, 12)), note: "CSV verification" },
    ];
    const preview = await caller().finance.transactions.importPreview({ spaceId, rows });
    expect(preview).toEqual([{ sourceIndex: 0, duplicate: true }, { sourceIndex: 1, duplicate: false }]);

    const result = await caller().finance.transactions.importCommit({ spaceId, confirm: true, rows });
    expect(result).toMatchObject({ importedCount: 1, skippedDuplicates: 1 });
    const saved = await listTransactions(user.id, { spaceId, limit: 20 });
    expect(saved.filter(item => item.description === "Metro ride")).toHaveLength(1);
    expect(saved).toEqual(expect.arrayContaining([expect.objectContaining({ description: "May salary", kind: "income", amountPaise: 55_000 })]));
  });

  it("rejects invalid import rows before they reach transaction persistence", async () => {
    await expect(caller().finance.transactions.importPreview({ spaceId, rows: [{ sourceIndex: 2, kind: "expense", amountPaise: 0, description: "Invalid", occurredAt: new Date() }] })).rejects.toThrow();
  });
});
