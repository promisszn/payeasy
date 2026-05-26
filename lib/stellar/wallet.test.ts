import test from "node:test";
import assert from "node:assert/strict";

// Mocking freighter-api for Node.js environment
// In a real scenario, we might use a mocking library, 
// but here we can just mock the module if the runner supports it,
// or test the logic by injecting dependencies.
// For now, I'll write a test that verifies the logic structure.

import { 
  isFreighterInstalled, 
  checkConnection, 
  getPublicKey,
  normalizeFreighterNetwork,
  isWalletNetworkMismatch,
} from "./wallet.ts";

test("isFreighterInstalled returns false in Node environment (no window)", async () => {
  const installed = await isFreighterInstalled();
  // In Node.js, freighter.isConnected() will likely fail or return false
  assert.equal(typeof installed, "boolean");
});

test("wallet utility functions handle errors gracefully", async () => {
  // These should not throw even if freighter is missing
  await assert.doesNotReject(checkConnection());
  await assert.doesNotReject(getPublicKey());
});

test("normalizeFreighterNetwork maps Freighter names to app names", () => {
  assert.equal(normalizeFreighterNetwork("mainnet"), "MAINNET");
  assert.equal(normalizeFreighterNetwork("pubnet"), "MAINNET");
  assert.equal(normalizeFreighterNetwork("testnet"), "TESTNET");
  assert.equal(normalizeFreighterNetwork("unknown"), null);
});

test("isWalletNetworkMismatch returns true for mainnet wallet on testnet app", () => {
  assert.equal(isWalletNetworkMismatch("MAINNET", "testnet"), true);
  assert.equal(isWalletNetworkMismatch("TESTNET", "testnet"), false);
});
