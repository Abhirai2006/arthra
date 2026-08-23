import { describe, expect, it } from "vitest";
import { ONBOARDING_STORAGE_PREFIX, onboardingStorageKey } from "./onboarding";

describe("onboardingStorageKey", () => {
  it("creates a stable, versioned completion key for each user", () => {
    expect(onboardingStorageKey(42)).toBe(`${ONBOARDING_STORAGE_PREFIX}:42`);
    expect(onboardingStorageKey("42")).toBe(`${ONBOARDING_STORAGE_PREFIX}:42`);
  });

  it("does not share completion state between users", () => {
    expect(onboardingStorageKey(42)).not.toBe(onboardingStorageKey(43));
  });
});
