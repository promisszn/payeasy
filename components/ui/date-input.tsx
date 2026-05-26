"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { FieldError, fieldBorderClass } from "@/components/ui/field-error";
import {
  formatDeadlineDisplay,
  getTomorrowIso,
} from "./date-input.helpers";

interface DateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Optional override for the minimum selectable date (ISO "YYYY-MM-DD"). Defaults to tomorrow. */
  min?: string;
  error?: string;
  "aria-describedby"?: string;
}

export function DateInput({
  id,
  value,
  onChange,
  min,
  error,
  "aria-describedby": ariaDescribedBy,
}: DateInputProps) {
  const minIso = useMemo(() => min ?? getTomorrowIso(), [min]);
  const formatted = formatDeadlineDisplay(value);
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <div
        className={`relative flex items-center rounded-xl border bg-white/5 transition-colors focus-within:border-brand-400 ${fieldBorderClass(error, !!value)}`}
      >
        <span
          className="pointer-events-none flex items-center justify-center pl-3 text-dark-500"
          aria-hidden="true"
        >
          <CalendarDays size={18} />
        </span>
        <input
          id={id}
          type="date"
          value={value}
          min={minIso}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          data-testid="deadline-date-input"
          className="w-full bg-transparent px-3 py-3 text-dark-100 placeholder:text-dark-600 focus:outline-none [color-scheme:dark]"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span
          data-testid="deadline-formatted"
          className={formatted ? "text-brand-200" : "text-dark-500"}
        >
          {formatted || "No date selected"}
        </span>
        <span className="text-xs text-dark-500">
          Earliest: {formatDeadlineDisplay(minIso)}
        </span>
      </div>

      <FieldError id={errorId ?? `${id}-error`} message={error} />
    </div>
  );
}
