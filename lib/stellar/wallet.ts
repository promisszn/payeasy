import freighterApi from "@stellar/freighter-api";

const {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} = freighterApi;
import { getCurrentNetwork } from "./config.ts";

/**
 * Checks if the Freighter extension is installed in the browser.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Checks if the user is currently connected to Freighter.
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Attempts to connect to Freighter.
 * If not already allowed, it will trigger the Freighter permission popup.
 */
export async function connectFreighter(): Promise<string | null> {
  try {
    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) {
      const setResult = await setAllowed();
      if (!setResult.isAllowed) return null;
    }

    const accessResult = await requestAccess();
    if ("error" in accessResult && accessResult.error) return null;
    return accessResult.address || null;
  } catch (error) {
    console.error("Failed to connect to Freighter:", error);
    return null;
  }
}

/**
 * Gets the connected user's public key.
 */
export async function getPublicKey(): Promise<string | null> {
  try {
    const result = await getAddress();
    if ("error" in result && result.error) return null;
    return result.address || null;
  } catch {
    return null;
  }
}

/**
 * Signs a transaction XDR using Freighter.
 */
export async function signTx(xdr: string, network?: string): Promise<string | null> {
  try {
    const networkToUse = network || getCurrentNetwork().toUpperCase();
    const result = await signTransaction(xdr, {
      networkPassphrase:
        networkToUse === "TESTNET"
          ? "Test SDF Network ; September 2015"
          : "Public Global Stellar Network ; September 2015",
    });

    if ("error" in result && result.error) {
      throw new Error(String(result.error));
    }

    return result.signedTxXdr;
  } catch (error) {
    console.error("Freighter signing failed:", error);
    return null;
  }
}


export async function getFreighterVersion(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const win = window as Window & {
      freighter?: { version?: string; getVersion?: () => string };
    };
    if (!win.freighter) return null;

    if (typeof win.freighter.version === "string") {
      return win.freighter.version;
    }
    if (typeof win.freighter.getVersion === "function") {
      return win.freighter.getVersion() ?? null;
    }

    const freighterModule = await import("@stellar/freighter-api");
    if (typeof (freighterModule as Record<string, unknown>).getVersion === "function") {
      const result = await (freighterModule as unknown as { getVersion: () => Promise<{ version: string }> }).getVersion();
      return result?.version ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

const MINIMUM_FREIGHTER_VERSION = [10, 0, 0] as const;

function parseVersion(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export async function isFreighterVersionSupported(): Promise<boolean | null> {
  const version = await getFreighterVersion();
  if (!version) return null;

  const [major, minor, patch] = parseVersion(version);
  const [minMajor, minMinor, minPatch] = MINIMUM_FREIGHTER_VERSION;

  if (major !== minMajor) return major > minMajor;
  if (minor !== minMinor) return minor > minMinor;
  return patch >= minPatch;
}

export async function getFreighterNetwork(): Promise<"TESTNET" | "MAINNET" | null> {
  if (typeof window === "undefined") return null;
  try {
    const connected = await isConnected();
    if (!connected.isConnected) return null;

    const freighterModule = await import("@stellar/freighter-api");
    if (typeof freighterModule.getNetwork === "function") {
      const networkResult = await freighterModule.getNetwork();
      return normalizeFreighterNetwork(networkResult.network);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Failed to get Freighter network:", error);
    return null;
  }
}

export function normalizeFreighterNetwork(
  network: string | null | undefined
): "TESTNET" | "MAINNET" | null {
  const normalized = String(network ?? "").trim().toLowerCase();

  if (normalized === "testnet") return "TESTNET";
  if (normalized === "mainnet" || normalized === "public" || normalized === "pubnet") {
    return "MAINNET";
  }

  return null;
}

export function isWalletNetworkMismatch(
  walletNetwork: "TESTNET" | "MAINNET" | null,
  appNetwork: "testnet" | "mainnet"
): boolean {
  if (!walletNetwork) return false;
  const app = appNetwork === "testnet" ? "TESTNET" : "MAINNET";
  return walletNetwork !== app;
}
