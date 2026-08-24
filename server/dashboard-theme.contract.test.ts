import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layoutSource = readFileSync(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url), "utf8");
const onboardingSource = readFileSync(new URL("../client/src/components/OnboardingGuide.tsx", import.meta.url), "utf8");
const themeSource = readFileSync(new URL("../client/src/workspace-theme.css", import.meta.url), "utf8");

describe("dashboard theme contract", () => {
  it("keeps a persisted theme control in the shared authenticated layout", () => {
    expect(layoutSource).toContain('useTheme } from "@/contexts/ThemeContext"');
    expect(layoutSource).toContain("function WorkspaceThemeToggle");
    expect(layoutSource).toContain("Switch workspace to");
    expect(layoutSource).toContain('className="workspace-theme"');
    expect(layoutSource).toContain("<WorkspaceThemeToggle />");
    expect(layoutSource).toContain("<WorkspaceThemeToggle compact />");
    expect(onboardingSource).toContain("workspace-onboarding-content");
    expect(onboardingSource).toContain("workspace-onboarding-header");
  });

  it("defines both light and dark semantic workspace materials", () => {
    expect(themeSource).toContain(".workspace-theme{");
    expect(themeSource).toContain(".dark .workspace-theme{");
    expect(themeSource).toContain("--sidebar:");
    expect(themeSource).toContain("--chart-1:");
    expect(themeSource).toContain("--workspace-hero:");
    expect(themeSource).toContain(".workspace-onboarding-content{");
  });
});
