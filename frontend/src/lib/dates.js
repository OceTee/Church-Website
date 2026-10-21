// Date helpers shared by events, sermons and gallery photos. Records entered
// with a date picker store `YYYY-MM-DD`. Older records may hold free text such
// as "31st Oct" or "June 2026"; those are displayed exactly as typed.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value) => String(value).padStart(2, "0");

export function isIsoDate(value) {
  return ISO_DATE.test(value ?? "");
}

/** Today's date in the visitor's own time zone, as `YYYY-MM-DD`. */
export function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Built from parts so it is midnight local time, not UTC.
function toLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * "2026-10-31" -> "Sat, 31 Oct 2026", or "31 Oct 2026" with
 * `{ weekday: false }`. Free text is returned unchanged.
 */
export function formatDate(value, { weekday = true } = {}) {
  if (!isIsoDate(value)) return value;
  return toLocalDate(value).toLocaleDateString("en-GB", {
    ...(weekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const plural = (count, unit) => `${count} ${unit}${count === 1 ? "" : "s"} ago`;

/**
 * How long ago a date was: "Today", "Yesterday", "5 days ago", "2 weeks ago",
 * "3 months ago", "1 year ago". Returns null for free text, which has no
 * reliable date to measure from.
 */
export function formatAge(value, now = new Date()) {
  if (!isIsoDate(value)) return null;

  const then = toLocalDate(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - then) / DAY_MS);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return plural(days, "day");

  // Whole calendar months, so 31 Jan to 28 Feb is not yet "1 month".
  let months =
    (today.getFullYear() - then.getFullYear()) * 12 + (today.getMonth() - then.getMonth());
  if (today.getDate() < then.getDate()) months -= 1;

  if (months < 1) return plural(Math.floor(days / 7), "week");
  if (months < 12) return plural(months, "month");
  return plural(Math.floor(months / 12), "year");
}
