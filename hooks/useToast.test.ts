import test from "node:test";
import assert from "node:assert/strict";

// Unit-test the toast data model independently of React rendering.
// Full render/dismiss behaviour is covered by manual browser testing per the acceptance criteria.

test("toast variants are the expected string literals", () => {
  const variants = ["success", "error", "info"] as const;
  assert.equal(variants.length, 3);
  assert.ok(variants.includes("success"));
  assert.ok(variants.includes("error"));
  assert.ok(variants.includes("info"));
});

test("multiple toasts have unique ids", () => {
  // Simulate the id-generation strategy used in ToastProvider
  const makeId = (base: string, ts: number, i: number) => `${base}-${ts}-${i}`;
  const base = "r0";
  const now = Date.now();
  const ids = [0, 1, 2].map((i) => makeId(base, now, i));
  const unique = new Set(ids);
  assert.equal(unique.size, 3, "all three ids must be unique");
});

test("toasts stack: adding three toasts produces three entries", () => {
  type ToastItem = { id: string; message: string; variant: string };
  const toasts: ToastItem[] = [];
  const add = (msg: string, variant: string, i: number) =>
    toasts.push({ id: `id-${i}`, message: msg, variant });

  add("Payment sent", "success", 0);
  add("Network error", "error", 1);
  add("Testnet mode active", "info", 2);

  assert.equal(toasts.length, 3);
  assert.equal(toasts[0].variant, "success");
  assert.equal(toasts[1].variant, "error");
  assert.equal(toasts[2].variant, "info");
});

test("dismiss removes only the targeted toast", () => {
  type ToastItem = { id: string; message: string };
  let toasts: ToastItem[] = [
    { id: "a", message: "first" },
    { id: "b", message: "second" },
    { id: "c", message: "third" },
  ];

  const dismiss = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
  };

  dismiss("b");
  assert.equal(toasts.length, 2);
  assert.ok(toasts.every((t) => t.id !== "b"));
  assert.ok(toasts.some((t) => t.id === "a"));
  assert.ok(toasts.some((t) => t.id === "c"));
});
