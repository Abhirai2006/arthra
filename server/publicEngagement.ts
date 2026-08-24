import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { contactMessages, waitlistEntries } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 3;
const attempts = new Map<string, number[]>();

function requestKey(req: { headers: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `visitor:${address || "unknown"}`;
}

function assertRateLimit(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter(timestamp => now - timestamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a few minutes before submitting again." });
  }
  recent.push(now);
  attempts.set(key, recent);
}

export function resetPublicEngagementRateLimitForTests() {
  attempts.clear();
}

export const waitlistInput = z.object({
  email: z.string().trim().email().max(320),
  consent: z.literal(true),
  source: z.string().trim().min(1).max(80).default("website"),
  website: z.string().max(0).optional(),
});

export const contactInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(12).max(2_000),
  consentToReply: z.literal(true),
  website: z.string().max(0).optional(),
});

const recordIdInput = z.object({ id: z.number().int().positive() });
const contactStatusInput = recordIdInput.extend({ status: z.enum(["new", "in_progress", "resolved", "archived"]) });
const waitlistStatusInput = recordIdInput.extend({ status: z.enum(["new", "reviewed", "archived"]) });

function assertEngagementOwner(user: { openId: string } | null) {
  if (!user || !ENV.ownerOpenId || user.openId !== ENV.ownerOpenId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the site owner can access private engagement records." });
  }
}

async function alertOwner(title: string) {
  try {
    await notifyOwner({ title, content: "A new private website submission is ready in Arthra Owner Operations. No submission content is included in this alert." });
  } catch (error) {
    console.warn("[Public engagement] Owner alert could not be sent.", error);
  }
}

export const publicEngagementRouter = router({
  joinWaitlist: publicProcedure.input(waitlistInput).mutation(async ({ ctx, input }) => {
    if (input.website) return { accepted: true } as const;
    assertRateLimit(requestKey(ctx.req));
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The waitlist is unavailable right now. Please try again later." });
    await db.insert(waitlistEntries).values({
      email: input.email.toLowerCase(),
      source: input.source,
      consentedAt: new Date(),
      status: "new",
      lastActionAt: null,
    }).onDuplicateKeyUpdate({ set: { source: input.source, consentedAt: new Date(), status: "new", lastActionAt: null } });
    await alertOwner("New Arthra waitlist submission");
    return { accepted: true } as const;
  }),
  submitContact: publicProcedure.input(contactInput).mutation(async ({ ctx, input }) => {
    if (input.website) return { accepted: true } as const;
    assertRateLimit(requestKey(ctx.req));
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Messages are unavailable right now. Please try again later." });
    await db.insert(contactMessages).values({
      name: input.name,
      email: input.email.toLowerCase(),
      subject: input.subject,
      message: input.message,
      consentedToReply: input.consentToReply,
      status: "new",
    });
    await alertOwner("New Arthra contact message");
    return { accepted: true } as const;
  }),
  operationsAccess: publicProcedure.query(({ ctx }) => ({ canManage: Boolean(ctx.user && ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId) })),
  operationsInbox: protectedProcedure.query(async ({ ctx }) => {
    assertEngagementOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner operations are unavailable right now." });
    const [messages, waitlist] = await Promise.all([
      db.select({ id: contactMessages.id, name: contactMessages.name, email: contactMessages.email, subject: contactMessages.subject, message: contactMessages.message, consentedToReply: contactMessages.consentedToReply, status: contactMessages.status, lastActionAt: contactMessages.lastActionAt, createdAt: contactMessages.createdAt }).from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100),
      db.select({ id: waitlistEntries.id, email: waitlistEntries.email, source: waitlistEntries.source, status: waitlistEntries.status, consentedAt: waitlistEntries.consentedAt, lastActionAt: waitlistEntries.lastActionAt, createdAt: waitlistEntries.createdAt }).from(waitlistEntries).orderBy(desc(waitlistEntries.createdAt)).limit(100),
    ]);
    return { messages, waitlist };
  }),
  setContactStatus: protectedProcedure.input(contactStatusInput).mutation(async ({ ctx, input }) => {
    assertEngagementOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner operations are unavailable right now." });
    const result = await db.update(contactMessages).set({ status: input.status, lastActionAt: new Date() }).where(eq(contactMessages.id, input.id));
    if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "That contact message no longer exists." });
    return { updated: true, status: input.status } as const;
  }),
  setWaitlistStatus: protectedProcedure.input(waitlistStatusInput).mutation(async ({ ctx, input }) => {
    assertEngagementOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner operations are unavailable right now." });
    const result = await db.update(waitlistEntries).set({ status: input.status, lastActionAt: new Date() }).where(eq(waitlistEntries.id, input.id));
    if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "That waitlist entry no longer exists." });
    return { updated: true, status: input.status } as const;
  }),
  deleteContactRecord: protectedProcedure.input(recordIdInput).mutation(async ({ ctx, input }) => {
    assertEngagementOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner operations are unavailable right now." });
    const result = await db.delete(contactMessages).where(eq(contactMessages.id, input.id));
    if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "That contact message no longer exists." });
    return { deleted: true } as const;
  }),
  deleteWaitlistRecord: protectedProcedure.input(recordIdInput).mutation(async ({ ctx, input }) => {
    assertEngagementOwner(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner operations are unavailable right now." });
    const result = await db.delete(waitlistEntries).where(eq(waitlistEntries.id, input.id));
    if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "That waitlist entry no longer exists." });
    return { deleted: true } as const;
  }),
});
