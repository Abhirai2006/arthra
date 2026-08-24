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

  it("requires explicit consent and rejects malformed public form data before persistence", () => {
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: true, source: "waitlist" }).success).toBe(true);
    expect(waitlistInput.safeParse({ email: "person@example.com", consent: false, source: "waitlist" }).success).toBe(false);
    expect(contactInput.safeParse({ name: "Asha Rao", email: "asha@example.com", subject: "Research", message: "I would like to discuss the product research process.", consentToReply: true }).success).toBe(true);
    expect(contactInput.safeParse({ name: "A", email: "bad", subject: "x", message: "short", consentToReply: false }).success).toBe(false);
  });
});
