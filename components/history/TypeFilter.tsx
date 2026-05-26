"use client";

import { Filter, ChevronDown } from "lucide-react";
import type { TransactionType } from "./TransactionCard";

/** The selectable filter values — "all" plus each transaction type. */
export type TypeFilterValue = "all" | TransactionType;

interface TypeFilterProps {
  /** Currently selected filter value */
  value: TypeFilterValue;
  /** Called when the user picks a new value */
  onChange: (value: TypeFilterValue) => void;
}

const OPTIONS: { value: TypeFilterValue; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "contribute", label: "Contribution" },
  { value: "release", label: "Release" },
  { value: "refund", label: "Refund" },
];

/**
 * Dropdown filter for transaction types.
 *
 * Renders a styled `<select>` that lets the user choose between All,
 * Contribution, Release, or Refund. Compatible with the date range filter.
 */
export default function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <div className="relative group">
      <label htmlFor="type-filter" className="sr-only">
        Filter by transaction type
      </label>

      {/* Icon */}
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 group-focus-within:text-brand-400 transition-colors"
        aria-hidden="true"
      >
        <Filter size={14} />
      </span>

      {/* Chevron */}
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
        aria-hidden="true"
      >
        <ChevronDown size={14} />
      </span>

      <select
        id="type-filter"
        value={value}
        onChange={(e) => onChange(e.target.value as TypeFilterValue)}
        data-testid="type-filter-select"
        className="w-full appearance-none bg-dark-900/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs font-bold text-dark-200 uppercase tracking-wider cursor-pointer focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all hover:border-white/20 [color-scheme:dark]"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
