import { withRetry } from "./retry.ts";

export type NetworkStatus = "healthy" | "degraded" | "down";

export interface NetworkHealth {
  status: NetworkStatus;
  checkedAt: Date;
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const TIMEOUT_MS = 6000;

export async function getNetworkHealth(): Promise<NetworkHealth> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await withRetry(() => fetch(HORIZON_URL, { signal: controller.signal }));
    clearTimeout(timer);

    if (!res.ok) {
      return { status: "degraded", checkedAt: new Date() };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const ingestLatest = data.ingest_latest_ledger as number | undefined;

    // If the ledger sequence is stale or missing, treat as degraded.
    const status: NetworkStatus =
      typeof ingestLatest === "number" && ingestLatest > 0
        ? "healthy"
        : "degraded";

    return { status, checkedAt: new Date() };
  } catch {
    clearTimeout(timer);
    return { status: "down", checkedAt: new Date() };
  }
}
import { rpcServer } from "./config.ts";

export type NetworkHealthStatus = "healthy" | "degraded" | "offline";

export interface HealthReport {
  status: NetworkHealthStatus;
  latestLedger: number;
  timestamp: number;
}

/**
 * Checks the health of the Soroban RPC node.
 * Performs a getHealth call and fetches the latest ledger sequence.
 */
export async function getNetworkStatus(): Promise<HealthReport> {
  const timestamp = Date.now();
  try {
    const health = await withRetry(() => rpcServer.getHealth());
    const ledger = await withRetry(() => rpcServer.getLatestLedger());

    let status: NetworkHealthStatus = "healthy";

    if (health.status !== "healthy") {
      status = "degraded";
    }

    return {
      status,
      latestLedger: ledger.sequence,
      timestamp,
    };
  } catch (error) {
    console.error("RPC Health Check Failed:", error);
    return {
      status: "offline",
      latestLedger: 0,
      timestamp,
    };
  }
}

/**
 * Helper to determine if a connection is stale based on ledger sequence.
 * Typically, Stellar ledgers are closed every ~5 seconds.
 */
export function isConnectionStale(lastLedger: number, currentLedger: number): boolean {
  // If the ledger hasn't advanced in a significant number of sequences, it's stale
  // For this utility, we simply compare the two values.
  return currentLedger <= lastLedger && lastLedger !== 0;
}
