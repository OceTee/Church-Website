// Events are entered with date and time pickers, so new records store
// `YYYY-MM-DD` and `HH:MM`. Older records hold free text such as "31st Oct";
// those are displayed as typed and are never treated as past, because there is
// no reliable way to tell when they happen.

import { formatDate, isIsoDate, todayIso } from "./dates";

const TIME_24 = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isPastEvent(event) {
  return isIsoDate(event?.date) && event.date < todayIso();
}

export function upcomingEvents(events) {
  return events.filter((event) => !isPastEvent(event));
}

/** "2026-10-31" -> "Sat, 31 Oct 2026"; free text is returned unchanged. */
export function formatEventDate(value) {
  return formatDate(value);
}

/** "15:00" -> "3:00 PM"; free text is returned unchanged. */
export function formatEventTime(value) {
  const match = TIME_24.exec(value ?? "");
  if (!match) return value;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? "AM" : "PM"}`;
}
