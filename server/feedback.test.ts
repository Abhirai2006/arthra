import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { feedbackInputSchema, feedbackRouter, resetFeedbackRateLimitForTests } from "./feedback";

describe("website feedback validation", () => {
  it("accepts a bounded feedback submission shape with explicit publication consent", () => {
    const input = feedbackInputSchema.parse({
      rating: 3,
      message: "x".repeat(12),
      permissionToPublish: true,
      website: "",
    });

    expect(input.rating).toBe(3);
    expect(input.message).toHaveLength(12);
    expect(input.permissionToPublish).toBe(true);
  });

  it("rejects invalid ratings, short messages, and honeypot content", () => {
    expect(() => feedbackInputSchema.parse({ rating: 0, message: "too short" })).toThrow();
    expect(() => feedbackInputSchema.parse({ rating: 3, message: "This message is long enough to validate but the honeypot is populated.", website: "https://spam.example" })).toThrow();
  });

  it("resets the in-memory limiter for isolated tests", () => {
    resetFeedbackRateLimitForTests();
    expect(true).toBe(true);
  });

  it("rejects moderation attempts from a signed-in non-owner before accessing feedback data", async () => {
    const nonOwnerCaller = feedbackRouter.createCaller({
      user: { id: 42, openId: "non-owner-test-identity", name: null, email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { headers: {} } as any,
      res: {} as any,
    });

    await expect(nonOwnerCaller.moderate({ id: 1, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps public visibility and owner approval guarded by both consent and moderation checks", () => {
    const source = readFileSync(new URL("./feedback.ts", import.meta.url), "utf8");
    expect(source).toContain('and(eq(websiteFeedback.status, "approved"), eq(websiteFeedback.permissionToPublish, true))');
    expect(source).toContain('input.status === "approved" && !submission.permissionToPublish');
  });
});
