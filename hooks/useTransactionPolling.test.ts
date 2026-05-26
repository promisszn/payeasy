import test from "node:test";
import assert from "node:assert/strict";

import {
  getNewTransactionsByHash,
  pollForNewTransactions,
} from "./useTransactionPolling.ts";

interface Tx {
  txHash: string;
  id: string;
}

test("getNewTransactionsByHash compares by transaction hash", () => {
  const current: Tx[] = [
    { id: "tx-1", txHash: "hash-1" },
    { id: "tx-2", txHash: "hash-2" },
  ];

  const incoming: Tx[] = [
    { id: "tx-2", txHash: "hash-2" },
    { id: "tx-3", txHash: "hash-3" },
  ];

  const next = getNewTransactionsByHash(current, incoming);

  assert.equal(next.length, 1);
  assert.equal(next[0].txHash, "hash-3");
});

test("pollForNewTransactions prepends newly discovered results on second poll", async () => {
  const firstPollResult: Tx[] = [
    { id: "tx-1", txHash: "hash-1" },
    { id: "tx-2", txHash: "hash-2" },
  ];
  const secondPollResult: Tx[] = [
    { id: "tx-3", txHash: "hash-3" },
    { id: "tx-1", txHash: "hash-1" },
    { id: "tx-2", txHash: "hash-2" },
  ];

  const first = await pollForNewTransactions([], async () => firstPollResult);
  const second = await pollForNewTransactions(first.merged, async () => secondPollResult);

  assert.equal(second.newTransactions.length, 1);
  assert.equal(second.newTransactions[0].txHash, "hash-3");
  assert.deepEqual(
    second.merged.map((tx) => tx.txHash),
    ["hash-3", "hash-1", "hash-2"]
  );
});
