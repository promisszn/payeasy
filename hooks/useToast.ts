"use client";

import { useCallback } from "react";
import { useToastContext } from "@/components/ui/toast-provider";

export function useToast() {
  const { show } = useToastContext();

  const success = useCallback(
    (message: string) => show(message, "success"),
    [show]
  );
  const error = useCallback(
    (message: string) => show(message, "error"),
    [show]
  );
  const info = useCallback(
    (message: string) => show(message, "info"),
    [show]
  );

  return { success, error, info };
}
