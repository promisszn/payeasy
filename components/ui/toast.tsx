"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
  success: {
    container: "border-accent-500/30 bg-accent-500/10 text-accent-300",
    icon: <CheckCircle size={18} className="text-accent-400 shrink-0" />,
  },
  error: {
    container: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: <XCircle size={18} className="text-red-400 shrink-0" />,
  },
  info: {
    container: "border-brand-500/30 bg-brand-500/10 text-brand-300",
    icon: <Info size={18} className="text-brand-400 shrink-0" />,
  },
};

const AUTO_DISMISS_MS = 4000;

export function Toast({ toast, onDismiss }: ToastProps) {
  const { container, icon } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md w-80 max-w-[calc(100vw-2rem)]",
        container
      )}
      role="alert"
      aria-live="polite"
    >
      {icon}
      <p className="flex-1 text-sm leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 rounded-full p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
