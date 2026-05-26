"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { NetworkStatus } from "@/lib/stellar/health";

function dotColor(status: NetworkStatus): string {
  if (status === "healthy") return "bg-emerald-400";
  if (status === "degraded") return "bg-amber-400";
  return "bg-red-500";
}

function label(status: NetworkStatus): string {
  if (status === "healthy") return "Healthy";
  if (status === "degraded") return "Degraded";
  return "Down";
}

function formatAge(checkedAt: Date | null): string {
  if (!checkedAt) return "checking…";
  const seconds = Math.round((Date.now() - checkedAt.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

export default function NetworkIndicator() {
  const { status, checkedAt, isLoading } = useNetworkStatus();

  const dot = isLoading ? "bg-dark-500 animate-pulse" : dotColor(status);
  const tooltipText = isLoading
    ? "Checking Stellar Network…"
    : `Stellar Network: ${label(status)} (last checked ${formatAge(checkedAt)})`;

  return (
    <div className="relative group inline-flex items-center gap-1.5" aria-label={tooltipText}>
      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      <span className="text-dark-500 text-xs hidden sm:inline">Stellar</span>

      {/* Tooltip */}
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg glass text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
      >
        {tooltipText}
      </div>
    </div>
  );
}
