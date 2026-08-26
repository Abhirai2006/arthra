import { describe, expect, it } from "vitest";
import { render } from "../client/src/entry-server";
import { contactInput, waitlistInput } from "./publicEngagement";

const publicPrefetch = {
  authMe: async () => null,
  previewInvite: async () => { throw new Error("unexpected invite prefetch"); },
  publicCaReport: async () => { throw new Error("unexpected CA prefetch"); },
};

describe("public-site enhancement contracts", () => {
  it("renders five factual FAQ answers and internal public links on the landing page", async () => {
    const result = await render("/", publicPrefetch);
    expect(result.html).toContain('id="faq"');
    expect(result.html).toContain("Five things people often ask before they begin.");
    expect(result.html).toContain("Are public reviews real?");
    expect(result.html).toContain('href="/about"');
    expect(result.html).toContain('href="/contact"');
    expect(result.html).toContain('href="/waitlist"');
  });

  it("explains the hosted-data boundary and provides privacy support paths before sign-in", async () => {
    const result = await render("/", publicPrefetch);

    expect(result.html).toContain("Arthra is a hosted workspace");
    expect(result.html).toContain("does not claim that your records stay only on your device");
    expect(result.html).toContain('href="/privacy"');
    expect(result.html).toContain('href="/contact"');
  });

  it("gives new public routes distinct SSR titles, canonical paths, and accessible breadcrumbs", async () => {
    const about = await render("/about", publicPrefetch);
    const contact = await render("/contact", publicPrefetch);
    const waitlist = await render("/waitlist", publicPrefetch);
    const thanks = await render("/thank-you", publicPrefetch);

    expect(about.head).toMatchObject({ title: "About Arthra · Personal finance, built for India", canonicalPath: "/about" });
    expect(about.html).toContain('aria-label="Breadcrumb"');
    expect(contact.head).toMatchObject({ title: "Contact Arthra · Private product conversation", canonicalPath: "/contact", noindex: true });
    expect(waitlist.html).toContain("Join the waitlist");
    expect(thanks.html).toContain("Received with care.");
  });

  it("renders the confirmed operator, effective date, retention rules, and 18+ boundary in SSR legal content", async () => {
    const privacy = await render("/privacy", publicPrefetch);
    const terms = await render("/terms", publicPrefetch);

    expect(privacy.html).toContain("Abhishek Rai A, individual operator");
    expect(privacy.html).toContain("25 August 2026");
    expect(privacy.html).toContain("90 days after resolution");
    expect(privacy.html).toContain("12 months of inactivity");
    expect(privacy.html).toContain("aged 18 and over");
    expect(terms.html).toContain("at least 18 years old");
  });

  it("requires explicit consent and rejects malformed public form data before persistence", () => {
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: true, source: "waitlist" }).success).toBe(true);
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: false, source: "waitlist" }).success).toBe(false);
    expect(contactInput.safeParse({ name: "Asha Rao", email: "asha@example.com", subject: "Research", message: "I would like to discuss the product research process.", consentToReply: true }).success).toBe(true);
    expect(contactInput.safeParse({ name: "A", email: "bad", subject: "x", message: "short", consentToReply: false }).success).toBe(false);
  });
});
