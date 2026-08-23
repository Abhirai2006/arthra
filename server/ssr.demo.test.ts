import { describe, expect, it } from "vitest";
import { render } from "../client/src/entry-server";

describe("demo route SSR", () => {
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
});
