"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getNetworkHealth, type NetworkHealth, type NetworkStatus } from "@/lib/stellar/health";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export interface UseNetworkStatusResult {
  status: NetworkStatus;
  checkedAt: Date | null;
  isLoading: boolean;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [health, setHealth] = useState<NetworkHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    setIsLoading(true);
    const result = await getNetworkHealth();
    setHealth(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [check]);

  return {
    status: health?.status ?? "healthy",
    checkedAt: health?.checkedAt ?? null,
    isLoading,
  };
}
