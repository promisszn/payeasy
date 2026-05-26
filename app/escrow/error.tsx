"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface EscrowErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EscrowError({ error, reset }: EscrowErrorProps) {
  useEffect(() => {
    console.error("[EscrowError]", error);
  }, [error]);

  return (
    <main className="min-h-screen pt-32 pb-24 relative overflow-hidden bg-[#07070a] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-md px-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-12 w-12 text-red-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-dark-400 text-base leading-relaxed">
            We couldn&apos;t load this escrow agreement. This is usually a
            temporary network issue.
          </p>
          {error.message && (
            <p className="text-xs text-dark-600 font-mono bg-dark-900/60 px-3 py-2 rounded-lg border border-white/5 break-all">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={reset}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 !py-3 !px-6 !rounded-xl font-black uppercase tracking-widest !text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-dark-400 hover:text-white hover:bg-white/5 transition-all text-sm font-black uppercase tracking-widest"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Registry
          </Link>
        </div>
      </div>
    </main>
  );
}
