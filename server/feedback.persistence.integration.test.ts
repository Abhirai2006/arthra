import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { websiteFeedback } from "../drizzle/schema";
import { feedbackRouter, resetFeedbackRateLimitForTests } from "./feedback";
import { getDb } from "./db";

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip;
const marker = `feedback-test-${Date.now()}`;

describeDatabase("website feedback persistence", () => {
  afterAll(async () => {
    const db = await getDb();
    await db?.delete(websiteFeedback).where(eq(websiteFeedback.displayName, marker));
  });

  it("stores authentic submissions as automatically published feedback", async () => {
    resetFeedbackRateLimitForTests();
    const caller = feedbackRouter.createCaller({
      user: null,
      req: { headers: { "x-forwarded-for": "127.0.0.1" } } as any,
      res: {} as any,
    });

    await expect(caller.submit({
      displayName: marker,
      email: "reviewer@example.com",
      rating: 4,
      message: "The feedback page is clear and the privacy explanation is reassuring.",
      permissionToContact: true,
      website: "",
    })).resolves.toEqual({ accepted: true, published: true });

    const db = await getDb();
    const [stored] = await db!.select().from(websiteFeedback).where(eq(websiteFeedback.displayName, marker)).limit(1);
    expect(stored).toMatchObject({ rating: 4, status: "approved", permissionToContact: true, permissionToPublish: true });
    expect(stored?.message).toContain("privacy explanation");
  });
});
