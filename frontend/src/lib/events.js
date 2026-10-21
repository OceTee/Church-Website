// Events are entered with date and time pickers, so new records store
// `YYYY-MM-DD` and `HH:MM`. Older records hold free text such as "31st Oct";
// those are displayed as typed and are never treated as past, because there is
// no reliable way to tell when they happen.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24 = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value) => String(value).padStart(2, "0");

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isPastEvent(event) {
  return ISO_DATE.test(event?.date ?? "") && event.date < localToday();
}

export function upcomingEvents(events) {
  return events.filter((event) => !isPastEvent(event));
}

/** "2026-10-31" -> "Sat, 31 Oct 2026"; free text is returned unchanged. */
export function formatEventDate(value) {
  if (!ISO_DATE.test(value ?? "")) return value;
  const [year, month, day] = value.split("-").map(Number);
  // Built from parts so it is midnight local time, not UTC.
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "15:00" -> "3:00 PM"; free text is returned unchanged. */
export function formatEventTime(value) {
  const match = TIME_24.exec(value ?? "");
  if (!match) return value;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? "AM" : "PM"}`;
}
