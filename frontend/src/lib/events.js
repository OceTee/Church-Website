// Events are entered with date and time pickers, so new records store
// `YYYY-MM-DD` and `HH:MM`. An event can also run over several days, in which
// case `endDate` holds its last day. Older records hold free text such as
// "31st Oct"; those are displayed as typed and are never treated as past,
// because there is no reliable way to tell when they happen.

import { formatDate, isIsoDate, todayIso } from "./dates";

const TIME_24 = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_MS = 24 * 60 * 60 * 1000;

// Built from parts so it is midnight local time, not UTC.
function toLocalDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(fromIso, toIso) {
  return Math.round((toLocalDate(toIso) - toLocalDate(fromIso)) / DAY_MS);
}

/** The event's last day: its end date when it runs over several days. */
export function eventEndDate(event) {
  return event?.endDate || event?.date;
}

export function isMultiDay(event) {
  return Boolean(event?.endDate) && event.endDate !== event.date;
}

/** Past once the last day is over, so a multi-day event stays up throughout. */
export function isPastEvent(event) {
  const end = eventEndDate(event);
  return isIsoDate(end) && end < todayIso();
}

export function upcomingEvents(events) {
  return events.filter((event) => !isPastEvent(event));
}

/**
 * Where an event stands today: "upcoming", "ongoing" (today falls within
 * it), "past", or "unknown" for free-text dates. An ongoing event also
 * reports which of its days it is on.
 */
export function eventStatus(event, today = todayIso()) {
  const start = event?.date;
  const end = eventEndDate(event);
  if (!isIsoDate(start) || !isIsoDate(end)) return { state: "unknown" };
  if (end < today) return { state: "past" };
  if (start > today) return { state: "upcoming", daysUntil: daysBetween(today, start) };
  return {
    state: "ongoing",
    day: daysBetween(start, today) + 1,
    totalDays: daysBetween(start, end) + 1,
  };
}

/** A short live label for the event: "Today", "Day 3 of 11", "Tomorrow", or null. */
export function eventStatusLabel(event, today = todayIso()) {
  const status = eventStatus(event, today);
  if (status.state === "ongoing") {
    return status.totalDays > 1 ? `Day ${status.day} of ${status.totalDays}` : "Today";
  }
  if (status.state === "upcoming" && status.daysUntil === 1) return "Tomorrow";
  return null;
}

/** "2026-10-31" -> "Sat, 31 Oct 2026"; free text is returned unchanged. */
export function formatEventDate(value) {
  return formatDate(value);
}

/**
 * A single date or a span: "Sat, 31 Oct 2026", "22–24 Nov 2026",
 * "22 Nov – 2 Dec 2026", "30 Dec 2026 – 2 Jan 2027". Free-text dates are
 * joined as typed.
 */
export function formatEventRange(start, end) {
  if (!end || end === start) return formatDate(start);
  if (!isIsoDate(start) || !isIsoDate(end)) return `${start} – ${end}`;

  const from = toLocalDate(start);
  const to = toLocalDate(end);
  const full = (date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (from.getFullYear() === to.getFullYear()) {
    if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${full(to)}`;
    const dayMonth = from.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${dayMonth} – ${full(to)}`;
  }
  return `${full(from)} – ${full(to)}`;
}

/** "15:00" -> "3:00 PM"; free text is returned unchanged. */
export function formatEventTime(value) {
  const match = TIME_24.exec(value ?? "");
  if (!match) return value;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? "AM" : "PM"}`;
}
