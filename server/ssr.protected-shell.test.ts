import { describe, expect, it } from "vitest";
import { render } from "../client/src/entry-server";

describe("protected-route SSR", () => {
  it("renders the semantic private workspace shell instead of the client auth skeleton", async () => {
    const result = await render("/dashboard", {
      authMe: async () => null,
      previewInvite: async () => null,
      publicCaReport: async () => null,
    });

    expect(result.head.noindex).toBe(true);
    expect(result.html).toContain('class="ssr-protected-shell"');
    expect(result.html).toContain("Your money, with context");
    expect(result.html).not.toContain("DashboardLayoutSkeleton");
  });
});
