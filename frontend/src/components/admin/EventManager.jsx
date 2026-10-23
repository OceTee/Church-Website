import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { createWithUpload } from "../../lib/uploads";
import {
  eventStatus,
  formatEventRange,
  formatEventTime,
  isPastEvent,
} from "../../lib/events";
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
  // Set when the event runs over several days; `endDate` is its last day.
  multiDay: false,
  endDate: "",
  time: "",
  flyer: null,
};

/** "Happening now · Day 3 of 11", "Past: hidden from the website", or null. */
function statusTag(event) {
  const status = eventStatus(event);
  if (status.state === "ongoing") {
    return {
      text: status.totalDays > 1 ? `Happening now · Day ${status.day} of ${status.totalDays}` : "Today",
      className: "bg-[#ffd700] text-black",
    };
  }
  if (isPastEvent(event)) {
    return { text: "Past: hidden from the website", className: "bg-gray-200 text-gray-600" };
  }
  return null;
}

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
          // Only sent for a multi-day event; a single day has no end date.
          ...(form.multiDay && form.endDate ? { endDate: form.endDate } : {}),
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

  const handleDelete = async ({ id, title }) => {
    if (!window.confirm(`Delete the event "${title}"? This cannot be undone.`)) return;

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
                {form.multiDay ? "First Day" : "Date"}
              </label>
              {/* Real date/time values, so events sort correctly and past
                  ones drop off the public pages automatically. */}
              <input
                id="event-date"
                type="date"
                className={inputClass}
                required
                value={form.date}
                onChange={(event) => update("date", event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="event-time">
                Time
              </label>
              <input
                id="event-time"
                type="time"
                className={inputClass}
                required
                value={form.time}
                onChange={(event) => update("time", event.target.value)}
              />
            </div>
          </div>
        </div>

        {/* A single day by default; tick to give the programme a last day, so
            it shows as a span ("22 Nov – 2 Dec") and stays up until it ends. */}
        <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:gap-6">
          <label className="flex items-center gap-2 font-nunito text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.multiDay}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  multiDay: event.target.checked,
                  endDate: event.target.checked ? current.endDate : "",
                }))
              }
              className="h-4 w-4 accent-[#65007f]"
            />
            This event runs over several days
          </label>
          {form.multiDay && (
            <div className="flex items-center gap-3">
              <label className={`${labelClass} mb-0 whitespace-nowrap`} htmlFor="event-end-date">
                Last Day
              </label>
              <input
                id="event-end-date"
                type="date"
                className={inputClass}
                required
                min={form.date || undefined}
                value={form.endDate}
                onChange={(event) => update("endDate", event.target.value)}
              />
            </div>
          )}
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
              className="font-nunito text-sm"
            />
          </div>
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Adding..." : "Add Event"}
          </button>
        </div>
      </form>

      <h3 className="mb-4 border-b pb-2 font-nunito font-semibold text-gray-700">
        Current Events
      </h3>
      {events.length === 0 ? (
        <p className="font-nunito italic text-gray-400">No events.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className={listRowClass}>
              <div className="min-w-0">
                <h4 className="truncate font-nunito font-bold text-[#330040]">
                  {event.title}
                </h4>
                <p className="font-nunito text-sm text-gray-500">
                  {formatEventRange(event.date, event.endDate)} at {formatEventTime(event.time)}
                  {statusTag(event) && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${statusTag(event).className}`}
                    >
                      {statusTag(event).text}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(event)}
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
