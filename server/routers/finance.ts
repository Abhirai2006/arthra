import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getFinancialYearRange } from "../../shared/finance";
import { storagePut } from "../storage";
import { suggestReceiptFields } from "../receiptAssist";
import { createAiFinancialSummary } from "../aiInsights";
import {
  acceptInvite,
  attachReceipt,
  canAccessSpace,
  createCategory,
  createCaShareLink,
  createSpace,
  createSpaceInvite,
  createTransaction,
  deleteTransaction,
  ensureFinanceWorkspace,
  getAccessibleSpaces,
  getAnalyticsData,
  getBudgetsWithSpend,
  getCaShareLink,
  getDashboardData,
  getDigestPreferences,
  getInvitePreview,
  getLedgerRows,
  listCaShareLinks,
  getSpaceAccounts,
  getSpaceCategories,
  getSpaceMembers,
  getTransactionDetail,
  getUserCategories,
  listTransactions,
  revokeCaShareLink,
  saveDigestPreferences,
  setBudget,
  updateTransaction,
} from "../financeDb";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const spaceIdSchema = z.object({ spaceId: z.number().int().positive() });

const transactionSchema = z.object({
  accountId: z.number().int().positive().nullable().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  kind: z.enum(["expense", "income"]),
  amountPaise: z.number().int().positive().max(100_000_000_000),
  description: z.string().trim().min(1).max(180),
  note: z.string().trim().max(4_000).nullable().optional(),
  occurredAt: z.date(),
  isGstApplicable: z.boolean(),
  gstKind: z.enum(["cgst_sgst", "igst"]).nullable().optional(),
  gstRateBasisPoints: z.number().int().min(0).max(10_000).nullable().optional(),
  recurringRule: z.enum(["weekly", "monthly", "yearly"]).nullable().optional(),
});

async function requireSpaceAccess(userId: number, spaceId: number, access: "read" | "write" | "owner") {
  const membership = await canAccessSpace(userId, spaceId, access);
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission to access this Expense Space" });
  }
  return membership;
}

async function requireTransactionAccess(userId: number, transactionId: number, access: "read" | "write") {
  const transaction = await getTransactionDetail(transactionId);
  if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found" });
  await requireSpaceAccess(userId, transaction.spaceId, access);
  return transaction;
}

function normalizeReceiptDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Receipt data is invalid" });
  return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
}

export const financeRouter = router({
  bootstrap: protectedProcedure.query(async ({ ctx }) => {
    await ensureFinanceWorkspace(ctx.user.id);
    const [spaces, categories] = await Promise.all([getAccessibleSpaces(ctx.user.id), getUserCategories(ctx.user.id)]);
    return { spaces, categories };
  }),

  spaces: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await ensureFinanceWorkspace(ctx.user.id);
      return getAccessibleSpaces(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(80), color: z.string().trim().min(2).max(16), icon: z.string().trim().min(2).max(32) }))
      .mutation(({ ctx, input }) => createSpace(ctx.user.id, input)),
    accounts: protectedProcedure.input(spaceIdSchema).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getSpaceAccounts(ctx.user.id, input.spaceId);
    }),
    members: protectedProcedure.input(spaceIdSchema).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getSpaceMembers(ctx.user.id, input.spaceId);
    }),
    invite: protectedProcedure
      .input(spaceIdSchema.extend({ email: z.string().email().optional(), role: z.enum(["editor", "viewer"]), expiresAt: z.date() }))
      .mutation(async ({ ctx, input }) => {
        await requireSpaceAccess(ctx.user.id, input.spaceId, "owner");
        if (input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a future expiry date" });
        return createSpaceInvite(ctx.user.id, input.spaceId, input);
      }),
    previewInvite: publicProcedure.input(z.object({ token: z.string().min(32).max(96) })).query(({ input }) => getInvitePreview(input.token)),
    acceptInvite: protectedProcedure.input(z.object({ token: z.string().min(32).max(96) })).mutation(({ ctx, input }) => acceptInvite(ctx.user.id, input.token)),
  }),

  categories: router({
    list: protectedProcedure.query(({ ctx }) => getUserCategories(ctx.user.id)),
    forSpace: protectedProcedure.input(spaceIdSchema).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getSpaceCategories(ctx.user.id, input.spaceId);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(80), kind: z.enum(["expense", "income"]), color: z.string().trim().min(2).max(16), icon: z.string().trim().min(2).max(32), spaceId: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.spaceId) await requireSpaceAccess(ctx.user.id, input.spaceId, "write");
        return createCategory(ctx.user.id, input);
      }),
  }),

  transactions: router({
    list: protectedProcedure
      .input(spaceIdSchema.extend({ start: z.date().optional(), end: z.date().optional(), limit: z.number().int().positive().max(250).optional(), categoryId: z.number().int().positive().optional() }))
      .query(async ({ ctx, input }) => {
        await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
        return listTransactions(ctx.user.id, input);
      }),
    get: protectedProcedure.input(z.object({ transactionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      return requireTransactionAccess(ctx.user.id, input.transactionId, "read");
    }),
    create: protectedProcedure
      .input(spaceIdSchema.merge(transactionSchema))
      .mutation(async ({ ctx, input }) => {
        await requireSpaceAccess(ctx.user.id, input.spaceId, "write");
        return createTransaction(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input(z.object({ transactionId: z.number().int().positive() }).merge(transactionSchema))
      .mutation(async ({ ctx, input }) => {
        await requireTransactionAccess(ctx.user.id, input.transactionId, "write");
        const { transactionId, ...values } = input;
        return updateTransaction(ctx.user.id, transactionId, values);
      }),
    delete: protectedProcedure.input(z.object({ transactionId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await requireTransactionAccess(ctx.user.id, input.transactionId, "write");
      return deleteTransaction(input.transactionId);
    }),
    attachReceipt: protectedProcedure
      .input(z.object({ transactionId: z.number().int().positive(), fileName: z.string().trim().min(1).max(180), dataUrl: z.string().min(32).max(10_000_000) }))
      .mutation(async ({ ctx, input }) => {
        await requireTransactionAccess(ctx.user.id, input.transactionId, "write");
        const { mimeType, bytes } = normalizeReceiptDataUrl(input.dataUrl);
        const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
        if (!allowedTypes.has(mimeType) || bytes.byteLength > 7 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Use a JPG, PNG, WEBP, or PDF receipt under 7 MB" });
        }
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const stored = await storagePut(`receipts/${ctx.user.id}/${input.transactionId}/${safeName}`, bytes, mimeType);
        return attachReceipt(ctx.user.id, input.transactionId, {
          storageKey: stored.key,
          storageUrl: stored.url,
          originalName: input.fileName,
          mimeType,
          byteSize: bytes.byteLength,
        });
      }),
  }),

  receipts: router({
    suggest: protectedProcedure
      .input(spaceIdSchema.extend({ dataUrl: z.string().min(32).max(10_000_000) }))
      .mutation(async ({ ctx, input }) => {
        await requireSpaceAccess(ctx.user.id, input.spaceId, "write");
        try {
          return await suggestReceiptFields(input.dataUrl);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Receipt suggestions are temporarily unavailable." });
        }
      }),
  }),

  dashboard: router({
    get: protectedProcedure.input(spaceIdSchema.extend({ monthKey: z.string().regex(/^\d{4}-\d{2}$/) })).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getDashboardData(ctx.user.id, input.spaceId, input.monthKey);
    }),
  }),

  budgets: router({
    list: protectedProcedure.input(spaceIdSchema.extend({ monthKey: z.string().regex(/^\d{4}-\d{2}$/) })).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getBudgetsWithSpend(ctx.user.id, input.spaceId, input.monthKey);
    }),
    set: protectedProcedure
      .input(spaceIdSchema.extend({ categoryId: z.number().int().positive(), monthKey: z.string().regex(/^\d{4}-\d{2}$/), amountPaise: z.number().int().positive(), alertAtPercent: z.number().int().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        await requireSpaceAccess(ctx.user.id, input.spaceId, "owner");
        return setBudget(ctx.user.id, input);
      }),
  }),

  analytics: router({
    get: protectedProcedure.input(spaceIdSchema).query(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      return getAnalyticsData(ctx.user.id, input.spaceId);
    }),
    aiSummary: protectedProcedure.input(spaceIdSchema).mutation(async ({ ctx, input }) => {
      await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
      const analytics = await getAnalyticsData(ctx.user.id, input.spaceId);
      return { summary: await createAiFinancialSummary(analytics) };
    }),
  }),

  reports: router({
    caShares: protectedProcedure.query(({ ctx }) => listCaShareLinks(ctx.user.id)),
    ledger: protectedProcedure
      .input(z.object({ spaceId: z.number().int().positive().nullable(), financialYear: z.string().regex(/^\d{4}-\d{2}$/) }))
      .query(async ({ ctx, input }) => {
        if (input.spaceId) await requireSpaceAccess(ctx.user.id, input.spaceId, "read");
        const range = getFinancialYearRange(input.financialYear);
        return getLedgerRows(ctx.user.id, input.spaceId, range.start, range.end);
      }),
    createCaShare: protectedProcedure
      .input(z.object({ spaceId: z.number().int().positive().nullable().optional(), financialYear: z.string().regex(/^\d{4}-\d{2}$/), expiresAt: z.date() }))
      .mutation(async ({ ctx, input }) => {
        if (input.spaceId) await requireSpaceAccess(ctx.user.id, input.spaceId, "owner");
        if (input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a future expiry date" });
        return createCaShareLink(ctx.user.id, input);
      }),
    revokeCaShare: protectedProcedure.input(z.object({ linkId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeCaShareLink(ctx.user.id, input.linkId)),
    publicCaReport: publicProcedure.input(z.object({ token: z.string().min(32).max(96) })).query(async ({ input }) => {
      const link = await getCaShareLink(input.token);
      if (!link || link.revokedAt || link.expiresAt <= new Date()) return null;
      const range = getFinancialYearRange(link.financialYear);
      const rows = await getLedgerRows(link.ownerId, link.spaceId, range.start, range.end);
      return { financialYear: link.financialYear, expiresAt: link.expiresAt, rows };
    }),
  }),

  digest: router({
    preferences: protectedProcedure.query(({ ctx }) => getDigestPreferences(ctx.user.id)),
    savePreferences: protectedProcedure
      .input(z.object({ enabled: z.boolean(), destinationEmail: z.string().email().nullable().optional() }))
      .mutation(({ ctx, input }) => saveDigestPreferences(ctx.user.id, input)),
  }),
});
