export const ONBOARDING_STORAGE_PREFIX = "arthra-onboarding-v1";

/** Keeps first-run completion local to the signed-in person and browser. */
export function onboardingStorageKey(userId: number | string) {
  return `${ONBOARDING_STORAGE_PREFIX}:${String(userId)}`;
}
