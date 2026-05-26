"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence } from "framer-motion";
import { Toast, type ToastItem, type ToastVariant } from "./toast";

interface ToastContextValue {
  show: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const baseId = useId();
  const counterRef = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant) => {
    const id = `${baseId}-${Date.now()}-${counterRef.current++}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, [baseId]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-label="Notifications"
        className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-3 items-end"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
