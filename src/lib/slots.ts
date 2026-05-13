import type { AvailabilitySlot, BookingProfile, Booking } from "./booking-store";

const MIN = 60_000;
const DAY = 24 * 60 * 60_000;

/**
 * For a given host's availability + bookings, compute all open slots in a date.
 * `date` should be the YYYY-MM-DD of the GUEST's chosen day (interpreted in host's timezone).
 *
 * All math runs in UTC after applying the host's timezone offset on the wall-clock window.
 * Slot length = profile.defaultDurationMin. Bookings are skipped + buffer is added on both sides.
 */
export function computeSlotsForDate(input: {
  profile: BookingProfile;
  availability: AvailabilitySlot[];
  bookings: Pick<Booking, "startAt" | "endAt" | "status">[];
  /** YYYY-MM-DD in host timezone */
  date: string;
  /** Step between slot start times. Defaults to slot length. */
  stepMin?: number;
}): { startAt: string; endAt: string }[] {
  const { profile, availability, bookings, date } = input;
  const step = input.stepMin ?? profile.defaultDurationMin;
  if (!step || step < 5) return [];

  // Parse the date in the host's timezone — we approximate by using a known
  // offset for Europe/Sofia (UTC+2 / +3 with DST). To stay correct year-round
  // we use Intl to find the offset of midnight in that TZ.
  const [yyyy, mm, dd] = date.split("-").map((s) => parseInt(s, 10));
  if (!yyyy || !mm || !dd) return [];

  // Build a UTC instant that represents midnight in the host TZ on this date.
  const hostMidnight = zonedTimeToUtc(yyyy, mm, dd, 0, 0, profile.timezone);

  // Day-of-week in host TZ (Sun=0..Sat=6) — use date itself.
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  // Note: weekday is computed from the date string, fine for any TZ since UTC midday is same calendar day.

  const windows = availability.filter((a) => a.weekday === weekday);
  if (windows.length === 0) return [];

  const now = Date.now();
  const earliest = now + profile.minNoticeMin * MIN;
  const latest = now + profile.maxAdvanceDays * DAY;

  const buffer = profile.bufferMin * MIN;
  const slotMs = profile.defaultDurationMin * MIN;
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  const out: { startAt: string; endAt: string }[] = [];
  for (const w of windows) {
    const windowStart = hostMidnight + w.startMinute * MIN;
    const windowEnd = hostMidnight + w.endMinute * MIN;
    let t = windowStart;
    while (t + slotMs <= windowEnd) {
      const startMs = t;
      const endMs = t + slotMs;
      t += step * MIN;
      if (endMs < earliest) continue;
      if (startMs > latest) break;

      // Conflict check (account for buffer).
      const conflict = confirmed.some((b) => {
        const bStart = new Date(b.startAt).getTime() - buffer;
        const bEnd = new Date(b.endAt).getTime() + buffer;
        return startMs < bEnd && endMs > bStart;
      });
      if (conflict) continue;

      out.push({
        startAt: new Date(startMs).toISOString(),
        endAt: new Date(endMs).toISOString(),
      });
    }
  }
  // De-dupe + sort
  const map = new Map<string, { startAt: string; endAt: string }>();
  for (const s of out) map.set(s.startAt, s);
  return [...map.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
}

/** Returns YYYY-MM-DD list of days in the given month that have at least one available slot. */
export function computeAvailableDaysInMonth(input: {
  profile: BookingProfile;
  availability: AvailabilitySlot[];
  bookings: Pick<Booking, "startAt" | "endAt" | "status">[];
  year: number;
  month: number; // 1-12
}): string[] {
  const { year, month } = input;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const slots = computeSlotsForDate({ ...input, date });
    if (slots.length > 0) out.push(date);
  }
  return out;
}

/**
 * Convert a wall-clock date+time in a named IANA timezone to a UTC epoch ms.
 * Uses Intl.DateTimeFormat to find the offset.
 */
function zonedTimeToUtc(
  yyyy: number,
  mm: number,
  dd: number,
  hh: number,
  min: number,
  tz: string,
): number {
  // Trial UTC instant ignoring TZ
  const utcGuess = Date.UTC(yyyy, mm - 1, dd, hh, min);
  // Determine offset that the host TZ applies at this instant
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(utcGuess));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  const tzNow = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  const offset = tzNow - utcGuess;
  return utcGuess - offset;
}
