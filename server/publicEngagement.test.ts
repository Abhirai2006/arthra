import { describe, expect, it } from "vitest";
import { contactInput, publicEngagementRouter, waitlistInput } from "./publicEngagement";

const nonOwnerContext = {
  user: { id: 42, openId: "non-owner-test-identity", name: null, email: null, loginMethod: null, role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { headers: {} } as any,
  res: {} as any,
};

describe("public engagement owner operations", () => {
  it("retains explicit-consent validation boundaries for public contact and waitlist submissions", () => {
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: true, source: "website" }).success).toBe(true);
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: false, source: "website" }).success).toBe(false);
    expect(contactInput.safeParse({ name: "Asha Rao", email: "asha@example.com", subject: "Research", message: "I would like to discuss Arthra product research.", consentToReply: true }).success).toBe(true);
  });

  it("blocks a signed-in non-owner from reading or changing private engagement records before database access", async () => {
    const caller = publicEngagementRouter.createCaller(nonOwnerContext);
    await expect(caller.operationsInbox()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.setContactStatus({ id: 1, status: "resolved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.deleteWaitlistRecord({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
