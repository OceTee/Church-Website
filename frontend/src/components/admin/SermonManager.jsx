import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import {
  createSermon,
  describeSermonSource,
  isValidSermonUrl,
} from "../../lib/sermons";
import SermonPlayer from "../SermonPlayer";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
  listRowClass,
} from "./fieldStyles";

const EMPTY_FORM = { title: "", date: "", url: "" };

export default function SermonManager({ sermons, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const urlLooksValid = form.url.trim() === "" || isValidSermonUrl(form.url);
  const detected = urlLooksValid ? describeSermonSource(form.url) : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidSermonUrl(form.url)) return;

    setBusy(true);
    try {
      await createSermon({ title: form.title, date: form.date, url: form.url });
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
      const response = await apiFetch(`/sermons/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete sermon");
      await onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Sermons Manager</h2>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="sermon-title">
              Sermon Title
            </label>
            <input
              id="sermon-title"
              className={inputClass}
              required
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. The Power of Faith"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sermon-date">
              Date Preached
            </label>
            <input
              id="sermon-date"
              type="date"
              className={inputClass}
              required
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sermon-url">
              Sermon Link
            </label>
            <input
              id="sermon-url"
              type="url"
              inputMode="url"
              className={inputClass}
              required
              value={form.url}
              onChange={(event) => update("url", event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>
        <p className="font-inter text-sm text-gray-500">
          {detected ? (
            <>
              Recognised as{" "}
              <span className="font-semibold text-gray-700">{detected}</span>.
            </>
          ) : (
            "Paste the YouTube link for the recording. A direct audio file link also works."
          )}
        </p>
        <button
          type="submit"
          disabled={busy || !urlLooksValid}
          className={`${primaryButtonClass} self-start`}
        >
          {busy ? "Saving..." : "Add Sermon"}
        </button>
      </form>

      <h3 className="mb-4 border-b pb-2 font-inter font-semibold text-gray-700">
        Sermons
      </h3>
      {sermons.length === 0 ? (
        <p className="font-inter italic text-gray-400">No sermons added yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sermons.map((sermon) => (
            <li key={sermon.id} className={listRowClass}>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-inter font-bold text-[#330040]">
                  {sermon.title}
                </h4>
                <p className="font-inter text-sm text-gray-500">{sermon.date}</p>
                <SermonPlayer url={sermon.audioUrl} />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(sermon.id)}
                aria-label={`Delete ${sermon.title}`}
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
