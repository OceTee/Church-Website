import { apiJson } from "./api";
import { createWithUpload } from "./uploads";
import { todayIso } from "./dates";

/**
 * Members' birthdays. Each record is one celebration: a name, a photo, the
 * church's wishes, and the date (YYYY-MM-DD) it is shown on the home page.
 * The API deletes a birthday, and its photo, once that date has passed.
 */

/** The birthdays in one month, e.g. "2026-10". */
export function fetchBirthdaysForMonth(month) {
  return apiJson(`/birthdays?month=${encodeURIComponent(month)}`);
}

/** Every upcoming birthday, for the admin panel. */
export function fetchAllBirthdays() {
  return apiJson("/birthdays");
}

export function createBirthday({ name, date, wishes, photo }) {
  return createWithUpload({
    category: "birthdays",
    file: photo,
    fields: { name, date, wishes },
  });
}

/** The birthdays falling on the visitor's own "today". */
export function todaysBirthdays(birthdays, today = todayIso()) {
  return birthdays.filter((birthday) => birthday.date === today);
}
