import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const polishPath = path.resolve(import.meta.dirname, "../client/src/arthra-polish.css");
const homePath = path.resolve(import.meta.dirname, "../client/src/pages/Home.tsx");
const polishCss = fs.readFileSync(polishPath, "utf8");
const homeSource = fs.readFileSync(homePath, "utf8");

function relativeLuminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)?.map(value => Number.parseInt(value, 16) / 255) ?? [];
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

describe("public visual polish", () => {
  it("keeps the custom selection treatment above normal-text contrast", () => {
    const foreground = relativeLuminance("ffffff");
    const background = relativeLuminance("155f66");
    const contrastRatio = (foreground + 0.05) / (background + 0.05);

    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(polishCss).toContain("::selection");
    expect(polishCss).toContain("background: #155f66");
    expect(polishCss).toContain("color: #ffffff");
  });

  it("keeps visual decoration non-interactive and honors reduced motion", () => {
    expect(homeSource).toContain('className="hero-constellation" aria-hidden="true"');
    expect(polishCss).toContain("pointer-events: none");
    expect(polishCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(polishCss).toContain("scrollbar-color");
  });
});
