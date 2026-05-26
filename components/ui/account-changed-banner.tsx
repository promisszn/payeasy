"use client";

import { useStellar } from "@/context/StellarContext";
import { AlertCircle, RefreshCw, X } from "lucide-react";

export default function AccountChangedBanner() {
  const { hasAccountChanged, setHasAccountChanged, connect } = useStellar();

  if (!hasAccountChanged) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-500">
      <div className="bg-brand-600 px-4 py-3 shadow-2xl backdrop-blur-md border-b border-brand-400/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg">
              <AlertCircle size={20} className="text-white animate-pulse" />
            </div>
            <p className="text-sm md:text-base font-bold text-white tracking-tight">
              Your Freighter account changed. <span className="text-brand-200">Reconnect to continue.</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => connect()}
              className="flex items-center gap-2 bg-white text-brand-600 px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-brand-50 transition-all active:scale-95 shadow-lg"
            >
              <RefreshCw size={16} />
              Reconnect
            </button>
            <button
              onClick={() => setHasAccountChanged(false)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Dismiss banner"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
