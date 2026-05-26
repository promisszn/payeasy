export interface UserPreferences {
  version: 1;
  budget: {
    minMonthly: number | null;
    maxMonthly: number | null;
    currency: "XLM" | "USDC" | "USD";
  };
  location: {
    city: string;
    region: string;
    maxCommuteMins: number | null;
  };
  amenities: {
    petFriendly: boolean;
    parking: boolean;
    laundryInUnit: boolean;
    furnished: boolean;
  };
  notifications: {
    escrowContributions: boolean;
    escrowReleased: boolean;
    deadlineReminders: boolean;
    reminderDaysAhead: 1 | 3 | 7 | 14;
  };
  privacy: {
    showPublicKeyInProfile: boolean;
    shareActivityWithRoommates: boolean;
    analyticsOptIn: boolean;
  };
  updatedAt: string;
}

export type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const VALID_CURRENCIES = ["XLM", "USDC", "USD"] as const;
const VALID_REMINDER_DAYS = [1, 3, 7, 14] as const;

export function storageKey(publicKey: string): string {
  return `payeasy_prefs_${publicKey}`;
}

export function defaultPreferences(): UserPreferences {
  return {
    version: 1,
    budget: {
      minMonthly: null,
      maxMonthly: null,
      currency: "USD",
    },
    location: {
      city: "",
      region: "",
      maxCommuteMins: null,
    },
    amenities: {
      petFriendly: false,
      parking: false,
      laundryInUnit: false,
      furnished: false,
    },
    notifications: {
      escrowContributions: true,
      escrowReleased: true,
      deadlineReminders: true,
      reminderDaysAhead: 3,
    },
    privacy: {
      showPublicKeyInProfile: false,
      shareActivityWithRoommates: true,
      analyticsOptIn: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

function getStorage(): MinimalStorage | null {
  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export function loadPreferences(
  publicKey: string,
  storage?: MinimalStorage
): UserPreferences {
  const store = storage ?? getStorage();
  if (!store) return defaultPreferences();

  try {
    const raw = store.getItem(storageKey(publicKey));
    if (!raw) return defaultPreferences();

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== 1
    ) {
      return defaultPreferences();
    }

    return parsed as UserPreferences;
  } catch {
    return defaultPreferences();
  }
}

export function savePreferences(
  publicKey: string,
  prefs: UserPreferences,
  storage?: MinimalStorage
): void {
  const store = storage ?? getStorage();
  if (!store) return;

  const withTimestamp: UserPreferences = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };
  store.setItem(storageKey(publicKey), JSON.stringify(withTimestamp));
}

export function clearPreferences(
  publicKey: string,
  storage?: MinimalStorage
): void {
  const store = storage ?? getStorage();
  if (!store) return;
  store.removeItem(storageKey(publicKey));
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePreferences(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { valid: false, errors: ["Preferences must be an object"] };
  }

  const prefs = input as Record<string, unknown>;

  // Budget
  const budget = prefs.budget as Record<string, unknown> | undefined;
  if (budget) {
    if (
      budget.currency !== undefined &&
      !VALID_CURRENCIES.includes(budget.currency as (typeof VALID_CURRENCIES)[number])
    ) {
      errors.push(`Invalid currency "${budget.currency}". Must be one of: ${VALID_CURRENCIES.join(", ")}`);
    }

    const min = budget.minMonthly;
    const max = budget.maxMonthly;

    if (min !== null && typeof min === "number" && min < 0) {
      errors.push("minMonthly must not be negative");
    }
    if (max !== null && typeof max === "number" && max < 0) {
      errors.push("maxMonthly must not be negative");
    }
    if (
      min !== null &&
      max !== null &&
      typeof min === "number" &&
      typeof max === "number" &&
      max < min
    ) {
      errors.push("maxMonthly must be greater than or equal to minMonthly");
    }
  }

  // Notifications
  const notifications = prefs.notifications as Record<string, unknown> | undefined;
  if (notifications) {
    const days = notifications.reminderDaysAhead;
    if (
      days !== undefined &&
      !VALID_REMINDER_DAYS.includes(days as (typeof VALID_REMINDER_DAYS)[number])
    ) {
      errors.push(`Invalid reminderDaysAhead "${days}". Must be one of: ${VALID_REMINDER_DAYS.join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
