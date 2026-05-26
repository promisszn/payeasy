"use client";

import { useState, useEffect, useCallback } from "react";
import { useStellar } from "@/context/StellarContext";
import {
  loadPreferences,
  savePreferences,
  defaultPreferences,
  type UserPreferences,
} from "@/lib/preferences/preferences";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function usePreferences() {
  const { publicKey } = useStellar();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    setPreferences(loadPreferences(publicKey));
  }, [publicKey]);

  const save = useCallback(() => {
    if (!publicKey || !preferences) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      savePreferences(publicKey, preferences);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save settings");
    }
  }, [publicKey, preferences]);

  const reset = useCallback(() => {
    if (!publicKey) return;
    const defaults = defaultPreferences();
    setPreferences(defaults);
    setSaveStatus("saving");
    setSaveError(null);
    try {
      savePreferences(publicKey, defaults);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Failed to reset settings");
    }
  }, [publicKey]);

  return {
    preferences: preferences ?? defaultPreferences(),
    setPreferences: (updater: (prev: UserPreferences) => UserPreferences) => {
      setPreferences((prev) => updater(prev ?? defaultPreferences()));
    },
    save,
    reset,
    saveStatus,
    saveError,
  };
}
