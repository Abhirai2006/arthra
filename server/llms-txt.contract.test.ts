import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const llmsTxtPath = path.resolve(import.meta.dirname, "../client/public/llms.txt");
const llmsTxt = fs.readFileSync(llmsTxtPath, "utf8");

describe("public llms.txt", () => {
  it("uses the project heading, concise summary, and curated public-resource lists", () => {
    expect(llmsTxt).toMatch(/^# Arthra\n\n> /);
    expect(llmsTxt).toContain("## Public product and policy pages");
    expect(llmsTxt).toContain("## Product and operational context");
    expect(llmsTxt).toContain("## Usage constraints");
    expect(llmsTxt).toContain("https://arthrafin-7qakibfj.manus.space/privacy");
    expect(llmsTxt).toContain("https://arthrafin-7qakibfj.manus.space/contact");
  });

  it("preserves Arthra’s factual privacy and beta-launch boundaries", () => {
    expect(llmsTxt).toContain("not a bank, payment service");
    expect(llmsTxt).toContain("Do not invent an email address");
    expect(llmsTxt).toContain("controlled beta");
    expect(llmsTxt).toContain("private data");
  });
});
