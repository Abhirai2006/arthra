import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { contactMessages, waitlistEntries } from "../drizzle/schema";
import { publicProcedure, router } from "./_core/trpc";
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
    }).onDuplicateKeyUpdate({ set: { source: input.source, consentedAt: new Date() } });
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
    });
    return { accepted: true } as const;
  }),
});
