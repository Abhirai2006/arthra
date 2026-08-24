import { describe, expect, it, vi } from "vitest";
import { normalizeHealthBaseUrl, runHealthCheck, summarizeHealthChecks } from "./healthMonitor";

describe("daily public health monitor", () => {
  it("requires an HTTPS production target", () => {
    expect(normalizeHealthBaseUrl("https://arthra.example/")).toBe("https://arthra.example");
    expect(() => normalizeHealthBaseUrl("http://arthra.example")).toThrow("HTTPS");
  });

  it("passes only when the home, sitemap, and unknown-route contracts all match", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/sitemap.xml")) return new Response("<urlset></urlset>", { status: 200 });
      if (url.endsWith("/does-not-exist")) return new Response("<title>Page not found</title>", { status: 404 });
      return new Response("Sign in", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const results = await runHealthCheck("https://arthra.example");
    expect(results.every(result => result.ok)).toBe(true);
    expect(summarizeHealthChecks(results)).toBe("All public health checks passed.");
    vi.unstubAllGlobals();
  });

  it("produces a concise actionable failure summary", () => {
    expect(summarizeHealthChecks([{ label: "unknown route", ok: false, detail: "503; expected content missing: Page not found" }])).toContain("unknown route: 503");
  });
});
