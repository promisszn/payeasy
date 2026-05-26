export const ONBOARDING_STORAGE_KEY = "payeasy_onboarded";

export interface OnboardingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveStorage(storage?: OnboardingStorage): OnboardingStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function isOnboarded(storage?: OnboardingStorage): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;
  return target.getItem(ONBOARDING_STORAGE_KEY) === "1";
}

export function markOnboarded(storage?: OnboardingStorage): void {
  const target = resolveStorage(storage);
  if (!target) return;
  target.setItem(ONBOARDING_STORAGE_KEY, "1");
}
