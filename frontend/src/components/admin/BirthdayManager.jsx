import { useEffect, useRef, useState } from "react";
import { Cake, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { createBirthday } from "../../lib/birthdays";
import { formatDate, todayIso } from "../../lib/dates";
import SpeakerAvatar from "../SpeakerAvatar";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
  listRowClass,
} from "./fieldStyles";

const emptyForm = () => ({ name: "", date: todayIso(), wishes: "", photo: null });

/** "2026-10" -> "October 2026". */
function monthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/** Groups birthdays (already sorted by date) under their month. */
function groupByMonth(birthdays) {
  const groups = new Map();
  for (const birthday of birthdays) {
    const month = birthday.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(birthday);
  }
  return [...groups.entries()];
}

export default function BirthdayManager({ birthdays, onChanged, onError }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const previewUrl = useRef(null);
  const today = todayIso();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  // A local preview of the chosen photo. Each object URL is released when it
  // is replaced and when the panel unmounts.
  const choosePhoto = (file) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = file ? URL.createObjectURL(file) : null;
    setPhotoPreview(previewUrl.current);
    update("photo", file);
  };

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.photo) return;
    setBusy(true);

    try {
      await createBirthday(form);
      event.target.reset();
      setForm(emptyForm());
      choosePhoto(null);
      await onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async ({ id, name }) => {
    if (!window.confirm(`Remove ${name}'s birthday? This cannot be undone.`)) return;

    try {
      const response = await apiFetch(`/birthdays/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove birthday");
      await onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Birthdays</h2>
      <p className="-mt-4 mb-6 font-nunito text-sm text-gray-500">
        On the day, the home page celebrates each member with confetti, their
        photo and your wishes. Each birthday is removed automatically once its
        date has passed.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="birthday-name">
              Celebrant&apos;s Name
            </label>
            <input
              id="birthday-name"
              className={inputClass}
              required
              maxLength={120}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Sister Mary Adebayo"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="birthday-date">
              Birthday
            </label>
            <input
              id="birthday-date"
              type="date"
              className={inputClass}
              required
              min={today}
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="birthday-photo">
              Celebrant&apos;s Photo
            </label>
            <div className="flex items-center gap-3">
              <SpeakerAvatar
                name={form.name}
                src={photoPreview}
                className="h-[2.618rem] w-[2.618rem] rounded-full"
                initialsClassName="text-sm"
              />
              <input
                id="birthday-photo"
                type="file"
                accept="image/*"
                required
                onChange={(event) => choosePhoto(event.target.files[0] || null)}
                className="min-w-0 font-nunito text-sm"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="birthday-wishes">
              Birthday Wishes
            </label>
            <textarea
              id="birthday-wishes"
              className={`${inputClass} h-28`}
              required
              maxLength={2000}
              value={form.wishes}
              onChange={(event) => update("wishes", event.target.value)}
              placeholder="e.g. Happy birthday! May the Lord bless you and keep you, and make this your best year yet."
            />
          </div>
        </div>
        <button type="submit" disabled={busy} className={`${primaryButtonClass} self-start`}>
          {busy ? "Saving..." : "Add Birthday"}
        </button>
      </form>

      <h3 className="mb-4 border-b pb-2 font-nunito font-semibold text-gray-700">
        Upcoming Birthdays
      </h3>
      {birthdays.length === 0 ? (
        <p className="font-nunito italic text-gray-400">No upcoming birthdays.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupByMonth(birthdays).map(([month, entries]) => (
            <div key={month}>
              <h4 className="mb-3 font-nunito text-sm font-bold uppercase tracking-[0.162em] text-[#9550a7]">
                {monthLabel(month)}
              </h4>
              <ul className="flex flex-col gap-3">
                {entries.map((birthday) => (
                  <li key={birthday.id} className={listRowClass}>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <SpeakerAvatar
                        name={birthday.name}
                        src={birthday.photoUrl}
                        className="h-[2.618rem] w-[2.618rem] rounded-full"
                        initialsClassName="text-sm"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-nunito font-bold text-[#330040]">
                          {birthday.name}
                          {birthday.date === today && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ffd700] px-2 py-0.5 text-xs font-semibold text-black">
                              <Cake size={12} /> Today
                            </span>
                          )}
                        </p>
                        <p className="truncate font-nunito text-sm text-gray-500">
                          {formatDate(birthday.date)} · {birthday.wishes}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(birthday)}
                      aria-label={`Remove ${birthday.name}'s birthday`}
                      className={dangerButtonClass}
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
