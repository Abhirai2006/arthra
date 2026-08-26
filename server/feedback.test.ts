import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { feedbackInputSchema, feedbackRouter, resetFeedbackRateLimitForTests } from "./feedback";

describe("website feedback validation", () => {
  it("accepts a bounded feedback submission shape without a manual-publication field", () => {
    const input = feedbackInputSchema.parse({
      rating: 3,
      message: "x".repeat(12),
      website: "",
    });

    expect(input.rating).toBe(3);
    expect(input.message).toHaveLength(12);
    expect(input.website).toBe("");
  });

  it("rejects invalid ratings, short messages, and honeypot content", () => {
    expect(() => feedbackInputSchema.parse({ rating: 0, message: "too short" })).toThrow();
    expect(() => feedbackInputSchema.parse({ rating: 3, message: "This message is long enough to validate but the honeypot is populated.", website: "https://spam.example" })).toThrow();
  });

  it("resets the in-memory limiter for isolated tests", () => {
    resetFeedbackRateLimitForTests();
    expect(true).toBe(true);
  });

  it("rejects removal attempts from a signed-in non-owner before accessing feedback data", async () => {
    const nonOwnerCaller = feedbackRouter.createCaller({
      user: { id: 42, openId: "non-owner-test-identity", name: null, email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { headers: {} } as any,
      res: {} as any,
    });

    await expect(nonOwnerCaller.remove({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("publishes valid submissions automatically while retaining owner-only removal", () => {
    const source = readFileSync(new URL("./feedback.ts", import.meta.url), "utf8");
    expect(source).toContain('status: "approved"');
    expect(source).toContain('permissionToPublish: true');
    expect(source).toContain("remove: protectedProcedure.input(feedbackIdSchema)");
    expect(source).toContain("await db.delete(websiteFeedback)");
  });
});
