import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { websiteFeedback } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const FEEDBACK_WINDOW_MS = 15 * 60 * 1000;
const FEEDBACK_LIMIT = 3;
const feedbackAttempts = new Map<string, number[]>();

export const feedbackInputSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(12).max(1_200),
  permissionToContact: z.boolean().default(false),
  permissionToPublish: z.boolean().default(false),
  website: z.string().max(0).optional(),
});

function getFeedbackRateLimitKey(req: { headers: Record<string, string | string[] | undefined> }, userId?: number) {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `visitor:${address || "unknown"}`;
}

function assertFeedbackRateLimit(key: string) {
  const now = Date.now();
  const recent = (feedbackAttempts.get(key) ?? []).filter(timestamp => now - timestamp < FEEDBACK_WINDOW_MS);
  if (recent.length >= FEEDBACK_LIMIT) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a few minutes before sending more feedback." });
  }
  recent.push(now);
  feedbackAttempts.set(key, recent);
}

export function resetFeedbackRateLimitForTests() {
  feedbackAttempts.clear();
}

function assertFeedbackOwner(user: { openId: string } | null) {
  if (!user || !ENV.ownerOpenId || user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the site owner can moderate feedback." });
  }
}

const moderationInputSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["approved", "archived"]),
});

export const feedbackRouter = router({
  listApproved: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ id: websiteFeedback.id, displayName: websiteFeedback.displayName, rating: websiteFeedback.rating, message: websiteFeedback.message, createdAt: websiteFeedback.createdAt })
      .from(websiteFeedback)
      .where(and(eq(websiteFeedback.status, "approved"), eq(websiteFeedback.permissionToPublish, true)))
      .orderBy(desc(websiteFeedback.createdAt))
      .limit(6);
    return rows.map(row => ({ ...row, displayName: row.displayName?.trim() || "Arthra visitor" }));
  }),
  moderationAccess: publicProcedure.query(({ ctx }) => ({ canModerate: Boolean(ctx.user && ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId) })),
  moderationQueue: protectedProcedure.query(async ({ ctx }) => {
    assertFeedbackOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Feedback is unavailable right now." });
    return db
      .select({ id: websiteFeedback.id, displayName: websiteFeedback.displayName, email: websiteFeedback.email, rating: websiteFeedback.rating, message: websiteFeedback.message, permissionToContact: websiteFeedback.permissionToContact, permissionToPublish: websiteFeedback.permissionToPublish, createdAt: websiteFeedback.createdAt })
      .from(websiteFeedback)
      .where(eq(websiteFeedback.status, "pending"))
      .orderBy(desc(websiteFeedback.createdAt));
  }),
  moderate: protectedProcedure.input(moderationInputSchema).mutation(async ({ ctx, input }) => {
    assertFeedbackOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Feedback is unavailable right now." });
    const [submission] = await db.select({ id: websiteFeedback.id, permissionToPublish: websiteFeedback.permissionToPublish }).from(websiteFeedback).where(eq(websiteFeedback.id, input.id)).limit(1);
    if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "That feedback submission no longer exists." });
    if (input.status === "approved" && !submission.permissionToPublish) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This reviewer did not consent to public publication." });
    }
    await db.update(websiteFeedback).set({ status: input.status }).where(eq(websiteFeedback.id, input.id));
    return { updated: true, status: input.status };
  }),
  submit: publicProcedure.input(feedbackInputSchema).mutation(async ({ ctx, input }) => {
    // A populated honeypot is acknowledged without persisting spam.
    if (input.website) return { accepted: true, private: true } as const;

    assertFeedbackRateLimit(getFeedbackRateLimitKey(ctx.req, ctx.user?.id));
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Feedback is unavailable right now. Please try again later." });

    await db.insert(websiteFeedback).values({
      displayName: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      rating: input.rating,
      message: input.message.trim(),
      permissionToContact: input.permissionToContact && Boolean(input.email?.trim()),
      permissionToPublish: input.permissionToPublish,
      status: "pending",
    });

    return { accepted: true, private: true } as const;
  }),
});
