import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
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

/**
 * Gets the current network of the connected Freighter wallet.
 * Returns "TESTNET" or "MAINNET" if connected and network can be determined.
 * Returns null if Freighter is not available, not connected, or network cannot be determined.
 */
export async function getFreighterNetwork(): Promise<"TESTNET" | "MAINNET" | null> {
  if (typeof window === "undefined") return null;
  try {
    // Check if Freighter is connected
    const connected = await isConnected();
    if (!connected.isConnected) return null;

    // Try to get the network from the Freighter API
    const freighterModule = await import("@stellar/freighter-api");
    if (typeof freighterModule.getNetwork === "function") {
      const network = await freighterModule.getNetwork();
      // Normalize to uppercase
      return network.toUpperCase() as "TESTNET" | "MAINNET";
    } else {
      // Fallback: if getNetwork is not available, we cannot determine the network
      return null;
    }
  } catch (error) {
    console.error("Failed to get Freighter network:", error);
    return null;
  }
}
