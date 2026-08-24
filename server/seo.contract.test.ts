import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildHead } from "./_core/vite";

describe("public SEO and consent contracts", () => {
  it("emits unique title, description, canonical, social image, and noindex directives when requested", () => {
    const head = buildHead({ title: "Contact Arthra", description: "Send a private message.", canonicalPath: "/contact", noindex: true });
    expect(head).toContain("<title>Contact Arthra</title>");
    expect(head).toContain('rel="canonical" href="https://arthrafin-7qakibfj.manus.space/contact"');
    expect(head).toContain('property="og:image"');
    expect(head).toContain('property="og:image:alt" content="Arthra — Personal finance, built for India"');
    expect(head).toContain('name="robots" content="noindex, follow"');
  });

  it("keeps analytics out of the static HTML so consent controls runtime loading", () => {
    const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
    expect(html).not.toContain("VITE_ANALYTICS_ENDPOINT");
    expect(html).toContain('rel="icon" type="image/svg+xml" href="/favicon.svg"');
  });
});
