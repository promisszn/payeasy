import test from "node:test";
import assert from "node:assert/strict";
import {
  storageKey,
  defaultPreferences,
  loadPreferences,
  savePreferences,
  clearPreferences,
  validatePreferences,
  type MinimalStorage,
} from "./preferences.ts";

function makeStorage(): MinimalStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

const KEY = "GABC123XYZ";

test("storageKey returns correct namespaced key", () => {
  assert.equal(storageKey(KEY), `payeasy_prefs_${KEY}`);
});

test("loadPreferences returns defaults when storage is empty", () => {
  const storage = makeStorage();
  const result = loadPreferences(KEY, storage);
  const defaults = defaultPreferences();
  assert.equal(result.version, defaults.version);
  assert.deepEqual(result.budget, defaults.budget);
  assert.deepEqual(result.location, defaults.location);
  assert.deepEqual(result.amenities, defaults.amenities);
  assert.deepEqual(result.notifications, defaults.notifications);
  assert.deepEqual(result.privacy, defaults.privacy);
});

test("savePreferences and loadPreferences round-trip all fields", () => {
  const storage = makeStorage();
  const prefs = defaultPreferences();
  prefs.budget.minMonthly = 500;
  prefs.budget.maxMonthly = 2000;
  prefs.budget.currency = "XLM";
  prefs.location.city = "Austin";
  prefs.location.region = "TX";
  prefs.location.maxCommuteMins = 30;
  prefs.amenities.petFriendly = true;
  prefs.notifications.deadlineReminders = false;
  prefs.privacy.analyticsOptIn = true;

  savePreferences(KEY, prefs, storage);
  const loaded = loadPreferences(KEY, storage);

  assert.equal(loaded.budget.minMonthly, 500);
  assert.equal(loaded.budget.maxMonthly, 2000);
  assert.equal(loaded.budget.currency, "XLM");
  assert.equal(loaded.location.city, "Austin");
  assert.equal(loaded.location.region, "TX");
  assert.equal(loaded.location.maxCommuteMins, 30);
  assert.equal(loaded.amenities.petFriendly, true);
  assert.equal(loaded.notifications.deadlineReminders, false);
  assert.equal(loaded.privacy.analyticsOptIn, true);
});

test("loadPreferences returns defaults on corrupt JSON (no throw)", () => {
  const storage = makeStorage();
  storage.setItem(storageKey(KEY), "{bad json");
  const result = loadPreferences(KEY, storage);
  assert.deepEqual(result.budget, defaultPreferences().budget);
});

test("loadPreferences returns defaults on wrong schema version", () => {
  const storage = makeStorage();
  storage.setItem(storageKey(KEY), JSON.stringify({ version: 0, budget: {} }));
  const result = loadPreferences(KEY, storage);
  assert.equal(result.version, 1);
  assert.deepEqual(result.budget, defaultPreferences().budget);
});

test("savePreferences stamps version 1 and valid ISO updatedAt", () => {
  const storage = makeStorage();
  const before = Date.now();
  savePreferences(KEY, defaultPreferences(), storage);
  const loaded = loadPreferences(KEY, storage);
  const after = Date.now();

  assert.equal(loaded.version, 1);
  const ts = new Date(loaded.updatedAt).getTime();
  assert.ok(!isNaN(ts), "updatedAt should be a valid date");
  assert.ok(ts >= before && ts <= after, "updatedAt should be close to now");
});

test("clearPreferences removes key and loadPreferences returns defaults", () => {
  const storage = makeStorage();
  const prefs = defaultPreferences();
  prefs.location.city = "Portland";
  savePreferences(KEY, prefs, storage);

  clearPreferences(KEY, storage);
  const loaded = loadPreferences(KEY, storage);
  assert.equal(loaded.location.city, "");
});

test("validatePreferences rejects negative minMonthly", () => {
  const prefs = defaultPreferences();
  prefs.budget.minMonthly = -1;
  const result = validatePreferences(prefs);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("minMonthly")));
});

test("validatePreferences rejects maxMonthly less than minMonthly", () => {
  const prefs = defaultPreferences();
  prefs.budget.minMonthly = 2000;
  prefs.budget.maxMonthly = 500;
  const result = validatePreferences(prefs);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("max")));
});

test("validatePreferences rejects unknown currency", () => {
  const prefs = defaultPreferences();
  (prefs.budget as { currency: string }).currency = "DOGE";
  const result = validatePreferences(prefs);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("currency")));
});

test("validatePreferences accepts defaultPreferences() as valid", () => {
  const result = validatePreferences(defaultPreferences());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validatePreferences rejects reminderDaysAhead outside allowed set", () => {
  const prefs = defaultPreferences();
  (prefs.notifications as { reminderDaysAhead: number }).reminderDaysAhead = 5;
  const result = validatePreferences(prefs);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("reminderDaysAhead")));
});

test("loadPreferences scopes per publicKey", () => {
  const storage = makeStorage();
  const prefsA = defaultPreferences();
  prefsA.location.city = "Seattle";
  savePreferences("GABC", prefsA, storage);

  const loadedB = loadPreferences("GXYZ", storage);
  assert.equal(loadedB.location.city, "");
});
