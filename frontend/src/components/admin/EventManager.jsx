import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { createWithUpload } from "../../lib/uploads";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
  listRowClass,
} from "./fieldStyles";

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  time: "",
  flyer: null,
};

export default function EventManager({ events, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      await createWithUpload({
        category: "events",
        file: form.flyer,
        fields: {
          title: form.title,
          description: form.description,
          date: form.date,
          time: form.time,
        },
      });

      event.target.reset();
      setForm(EMPTY_FORM);
      await onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiFetch(`/events/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete event");
      await onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Event Planner</h2>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="event-title">
              Title
            </label>
            <input
              id="event-title"
              className={inputClass}
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Harvest Thanksgiving"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="event-date">
                Date
              </label>
              <input
                id="event-date"
                className={inputClass}
                required
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
                placeholder="31st Oct"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="event-time">
                Time
              </label>
              <input
                id="event-time"
                className={inputClass}
                required
                value={form.time}
                onChange={(event) => update("time", event.target.value)}
                placeholder="3:00PM"
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="event-description">
            Description
          </label>
          <textarea
            id="event-description"
            className={`${inputClass} h-24`}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <label className={labelClass} htmlFor="event-flyer">
              Flyer (optional, image)
            </label>
            <input
              id="event-flyer"
              type="file"
              accept="image/*"
              onChange={(event) => update("flyer", event.target.files[0] || null)}
              className="font-inter text-sm"
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Adding..." : "Add Event"}
          </button>
        </div>
      </form>

      <h3 className="mb-4 border-b pb-2 font-inter font-semibold text-gray-700">
        Current Events
      </h3>
      {events.length === 0 ? (
        <p className="font-inter italic text-gray-400">No upcoming events.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className={listRowClass}>
              <div className="min-w-0">
                <h4 className="truncate font-inter font-bold text-[#330040]">
                  {event.title}
                </h4>
                <p className="font-inter text-sm text-gray-500">
                  {event.date} at {event.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(event.id)}
                aria-label={`Delete ${event.title}`}
                className={dangerButtonClass}
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
