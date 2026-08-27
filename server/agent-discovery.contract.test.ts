import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const templatePath = path.resolve(import.meta.dirname, "../client/index.html");
const template = fs.readFileSync(templatePath, "utf8");

describe("agent discovery metadata", () => {
  it("links every server-rendered page to the public llms.txt guide", () => {
    expect(template).toContain('<link rel="describedby" type="text/markdown" href="/llms.txt" />');
  });

  it("provides accurate public software metadata without private finance data", () => {
    expect(template).toContain('"@type": "SoftwareApplication"');
    expect(template).toContain('"applicationCategory": "FinanceApplication"');
    expect(template).toContain('"suggestedMinAge": 18');
    expect(template).toContain('"Protected receipt attachments"');
    expect(template).not.toContain('bank-grade');
  });
});
