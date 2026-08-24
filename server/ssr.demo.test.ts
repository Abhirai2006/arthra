import { describe, expect, it } from "vitest";
import { render } from "../client/src/entry-server";

describe("demo route SSR", () => {
  it("renders grouped public footer navigation instead of a single crowded link cluster", async () => {
    const result = await render("/", {
      authMe: async () => null,
      previewInvite: async () => { throw new Error("home must not load invitation data"); },
      publicCaReport: async () => { throw new Error("home must not load report data"); },
    });

    expect(result.html).toContain('aria-label="Footer navigation"');
    expect(result.html).toContain("Explore Arthra");
    expect(result.html).toContain("Product principles");
    expect(result.html).toContain("Abhishek Rai’s portfolio");
    expect(result.html).toContain("Projects &amp; case studies");
    expect(result.html).toContain("Arthra on GitHub");
    expect(result.html).toContain("Open-source code");
    expect(result.html).toContain("Back to top");
  });

  it("renders labelled fictional demo content without invoking an authenticated prefetch", async () => {
    const result = await render("/demo", {
      authMe: async () => { throw new Error("demo must not load auth data"); },
      previewInvite: async () => { throw new Error("demo must not load invitation data"); },
      publicCaReport: async () => { throw new Error("demo must not load report data"); },
    });

    expect(result.head.noindex).toBe(true);
    expect(result.html).toContain("DEMO DATA");
    expect(result.html).toContain("Explore Arthra in two minutes.");
    expect(result.html).toContain("static, isolated, and read-only");
  });

  it("renders the consent-gated public feedback route with its portfolio pathway", async () => {
    const result = await render("/feedback", {
      authMe: async () => { throw new Error("feedback must not load auth data"); },
      previewInvite: async () => { throw new Error("feedback must not load invitation data"); },
      publicCaReport: async () => { throw new Error("feedback must not load report data"); },
    });

    expect(result.head).toMatchObject({ title: "Share feedback · Arthra", canonicalPath: "/feedback", noindex: true });
    expect(result.html).toContain("Built with people, not placeholders.");
    expect(result.html).toContain("Open portfolio");
    expect(result.html).toContain("Public reviews are real submissions only: the reviewer must consent and the site owner must approve each one.");
  });
});
