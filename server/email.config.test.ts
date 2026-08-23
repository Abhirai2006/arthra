import { describe, expect, it } from "vitest";

describe("Resend digest configuration", () => {
  const configured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  (configured ? it : it.skip)("accepts the configured API key for a lightweight domains request", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();
    expect(process.env.RESEND_FROM_EMAIL).toMatch(/^(?:.+<)?[^<>\s]+@[^<>\s]+>?(?:\s*)$/);

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.ok).toBe(true);
  }, 20_000);
});
