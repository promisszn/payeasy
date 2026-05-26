const DISPLAY_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function toIso(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO "YYYY-MM-DD" representation of the UTC day after `now`.
 * Used as the `min` attribute on the deadline picker so today is not
 * selectable.
 */
export function getTomorrowIso(now: Date = new Date()): string {
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return toIso(tomorrow);
}

/**
 * True when `dateValue` is a valid ISO date string that falls on or after
 * tomorrow (UTC). Today and any earlier date — plus blanks / malformed
 * values — return false.
 */
export function isDateOnOrAfterTomorrow(
  dateValue: string,
  now: Date = new Date()
): boolean {
  if (!dateValue) return false;

  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;

  const tomorrowStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return parsed.getTime() >= tomorrowStart;
}

/**
 * Formats an ISO "YYYY-MM-DD" date as "MMM DD, YYYY".
 * Returns an empty string for blank or unparseable input so callers can
 * render nothing without branching.
 */
export function formatDeadlineDisplay(dateValue: string): string {
  if (!dateValue) return "";

  const parsed = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";

  const month = DISPLAY_MONTHS[parsed.getUTCMonth()];
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  const year = parsed.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}
