import test from "node:test";
import assert from "node:assert/strict";

import {
  validateInitializeParams,
  roommateSharestoScVal,
  initializeEscrow,
  FreighterNotAvailableError,
  WalletMismatchError,
  InvalidInitializeParamsError,
  NETWORK_PASSPHRASE,
  RPC_URL,
  type InitializeEscrowParams,
  type InitializeDependencies,
  type FreighterClient,
} from "./initialize.ts";

import { Account, Keypair, SorobanDataBuilder, StrKey, rpc, xdr } from "@stellar/stellar-sdk";

const VALID_SIM_TRANSACTION_DATA = new SorobanDataBuilder().build().toXDR("base64");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LANDLORD = Keypair.random().publicKey();
const ROOMMATE_A = Keypair.random().publicKey();
const ROOMMATE_B = Keypair.random().publicKey();
const CONTRACT_ID = StrKey.encodeContract(Buffer.alloc(32, 1));
const TOKEN_ADDRESS = StrKey.encodeContract(Buffer.alloc(32, 2));

const BASE_PARAMS: InitializeEscrowParams = {
  contractId: CONTRACT_ID,
  landlord: LANDLORD,
  totalRent: BigInt(1_000_000),
  deadline: BigInt(2_000_000_000),
  tokenAddress: TOKEN_ADDRESS,
  roommates: {
    [ROOMMATE_A]: BigInt(500_000),
    [ROOMMATE_B]: BigInt(500_000),
  },
};

// ─── validateInitializeParams ─────────────────────────────────────────────────

test("validateInitializeParams accepts a valid params object", () => {
  assert.doesNotThrow(() => validateInitializeParams(BASE_PARAMS));
});

test("validateInitializeParams throws when landlord is empty", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, landlord: "" }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when contractId is empty", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, contractId: "" }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when tokenAddress is empty", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, tokenAddress: "" }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when totalRent is zero", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, totalRent: BigInt(0) }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when totalRent is negative", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, totalRent: BigInt(-1) }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when deadline is zero", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, deadline: BigInt(0) }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when roommates map is empty", () => {
  assert.throws(
    () => validateInitializeParams({ ...BASE_PARAMS, roommates: {} }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams throws when share sum exceeds totalRent", () => {
  assert.throws(
    () =>
      validateInitializeParams({
        ...BASE_PARAMS,
        roommates: {
          [ROOMMATE_A]: BigInt(700_000),
          [ROOMMATE_B]: BigInt(500_000),
        },
      }),
    InvalidInitializeParamsError
  );
});

test("validateInitializeParams accepts shares that sum to exactly totalRent", () => {
  assert.doesNotThrow(() =>
    validateInitializeParams({
      ...BASE_PARAMS,
      totalRent: BigInt(1_000_000),
      roommates: {
        [ROOMMATE_A]: BigInt(400_000),
        [ROOMMATE_B]: BigInt(600_000),
      },
    })
  );
});

test("validateInitializeParams accepts shares that sum to less than totalRent", () => {
  assert.doesNotThrow(() =>
    validateInitializeParams({
      ...BASE_PARAMS,
      totalRent: BigInt(1_000_000),
      roommates: {
        [ROOMMATE_A]: BigInt(300_000),
      },
    })
  );
});

// ─── roommateSharestoScVal ────────────────────────────────────────────────────

test("roommateSharestoScVal returns an ScVal of map type", () => {
  const scval = roommateSharestoScVal({
    [ROOMMATE_A]: BigInt(500_000),
  });
  assert.equal(scval.switch(), xdr.ScValType.scvMap());
});

test("roommateSharestoScVal encodes one entry per roommate", () => {
  const scval = roommateSharestoScVal({
    [ROOMMATE_A]: BigInt(300_000),
    [ROOMMATE_B]: BigInt(700_000),
  });
  const entries = scval.map() ?? [];
  assert.equal(entries.length, 2);
});

test("roommateSharestoScVal encodes an empty map when no roommates are given", () => {
  const scval = roommateSharestoScVal({});
  const entries = scval.map() ?? [];
  assert.equal(entries.length, 0);
});

// ─── initializeEscrow unit tests (injected deps) ─────────────────────────────

function makeFreighter(overrides: Partial<FreighterClient> = {}): FreighterClient {
  return {
    getAddress: async () => ({ address: LANDLORD }),
    signTransaction: async (txXdr: string) => ({ signedTxXdr: txXdr }),
    ...overrides,
  };
}

type ServerShape = {
  getAccount: (addr: string) => Promise<unknown>;
  simulateTransaction: (tx: unknown) => Promise<unknown>;
  sendTransaction: (tx: unknown) => Promise<unknown>;
  getTransaction: (hash: string) => Promise<unknown>;
};

function makeServer(overrides: Partial<ServerShape> = {}): rpc.Server {
  return {
    getAccount: async (addr: string) => new Account(addr, "0"),
    simulateTransaction: async () => ({
      results: [{ retval: undefined }],
      transactionData: VALID_SIM_TRANSACTION_DATA,
      minResourceFee: "100",
      latestLedger: 100,
    }),
    sendTransaction: async () => ({
      status: "PENDING",
      hash: "MOCK_TX_HASH",
    }),
    getTransaction: async () => ({
      status: rpc.Api.GetTransactionStatus.SUCCESS,
      createdAt: 1_700_000_000,
      ledger: 1234,
    }),
    ...overrides,
  } as unknown as rpc.Server;
}

test("initializeEscrow throws InvalidInitializeParamsError on bad params", async () => {
  await assert.rejects(
    () =>
      initializeEscrow(
        { ...BASE_PARAMS, totalRent: BigInt(0) },
        { freighter: makeFreighter(), server: makeServer() }
      ),
    InvalidInitializeParamsError
  );
});

test("initializeEscrow throws WalletMismatchError when connected wallet differs from landlord", async () => {
  const wrongFreighter = makeFreighter({
    getAddress: async () => ({ address: ROOMMATE_A }),
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: wrongFreighter,
        server: makeServer(),
        networkPassphrase: NETWORK_PASSPHRASE,
      }),
    WalletMismatchError
  );
});

test("initializeEscrow throws when Freighter returns an address error", async () => {
  const errorFreighter = makeFreighter({
    getAddress: async () => ({ address: "", error: "not connected" }),
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: errorFreighter,
        server: makeServer(),
        networkPassphrase: NETWORK_PASSPHRASE,
      }),
    /Failed to read connected wallet/
  );
});

test("initializeEscrow throws when simulation returns an error", async () => {
  const errorServer = makeServer({
    simulateTransaction: async () => ({
      error: "HostError: contract panic",
    }),
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: makeFreighter(),
        server: errorServer,
        networkPassphrase: NETWORK_PASSPHRASE,
      }),
    /Simulation failed/
  );
});

test("initializeEscrow throws when sendTransaction returns ERROR status", async () => {
  const errorServer = makeServer({
    simulateTransaction: async () => ({
      results: [{ retval: undefined }],
      transactionData: VALID_SIM_TRANSACTION_DATA,
      minResourceFee: "100",
      latestLedger: 100,
    }),
    sendTransaction: async () => ({
      status: "ERROR",
      hash: "MOCK_TX_HASH",
      errorResult: { msg: "bad sequence" },
    }),
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: makeFreighter(),
        server: errorServer,
        networkPassphrase: NETWORK_PASSPHRASE,
      }),
    /Transaction submission failed/
  );
});

test("initializeEscrow throws when Freighter sign response has no XDR", async () => {
  const badSigner = makeFreighter({
    signTransaction: async () => ({}),
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: badSigner,
        server: makeServer(),
        networkPassphrase: NETWORK_PASSPHRASE,
      }),
    /Freighter did not return a signed transaction XDR/
  );
});

test("initializeEscrow throws when transaction does not reach SUCCESS after retries", async () => {
  let calls = 0;
  const pendingServer = makeServer({
    sendTransaction: async () => ({ status: "PENDING", hash: "HASH" }),
    getTransaction: async () => {
      calls++;
      return { status: rpc.Api.GetTransactionStatus.NOT_FOUND };
    },
  });
  await assert.rejects(
    () =>
      initializeEscrow(BASE_PARAMS, {
        freighter: makeFreighter(),
        server: pendingServer,
        networkPassphrase: NETWORK_PASSPHRASE,
        sleep: async () => {},
      }),
    /Transaction did not succeed/
  );
  assert.ok(calls > 1, "should have polled more than once");
});

// ─── Testnet integration test ─────────────────────────────────────────────────

test("initializeEscrow against Stellar testnet rejects non-existent contract with simulation error", async () => {
  const fakeContractId = "CCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
  const fakeLandlord   = "GBYUUJHG6F4EPJGNLERINATVQL57TCFA4GSRFNZLTQRH7KCXOLK6KJJG";

  const realFreighter: FreighterClient = {
    getAddress: async () => ({ address: fakeLandlord }),
    signTransaction: async () => ({ signedTxXdr: "WILL_NOT_REACH" }),
  };

  const deps: InitializeDependencies = {
    freighter: realFreighter,
    rpcUrl: RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
  };

  try {
    await initializeEscrow(
      {
        contractId: fakeContractId,
        landlord: fakeLandlord,
        totalRent: BigInt(1_000_000),
        deadline: BigInt(2_000_000_000),
        tokenAddress: fakeContractId,
        roommates: { [ROOMMATE_A]: BigInt(500_000) },
      },
      deps
    );
    assert.fail("Should have thrown before submission");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    assert.ok(
      message.includes("Simulation failed") ||
        message.includes("Simulation request failed") ||
        message.includes("accountId is invalid") ||
        message.includes("invalid"),
      `Unexpected error: ${message}`
    );
  }
});
