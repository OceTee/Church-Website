import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch, assetUrl } from "../../lib/api";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
  listRowClass,
} from "./fieldStyles";

const EMPTY_FORM = { title: "", date: "", file: null };

export default function SermonManager({ sermons, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.file) return;

    setBusy(true);
    try {
      const body = new FormData();
      body.append("audio", form.file);
      body.append("title", form.title);
      body.append("date", form.date);

      const response = await apiFetch("/sermons", { method: "POST", body });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload sermon");
      }

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
            <label className={labelClass} htmlFor="sermon-file">
              Audio File
            </label>
            <input
              id="sermon-file"
              type="file"
              accept="audio/*"
              required
              onChange={(event) => update("file", event.target.files[0] || null)}
              className="font-inter text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`${primaryButtonClass} self-start`}
        >
          {busy ? "Uploading..." : "Upload Sermon"}
        </button>
      </form>

      <h3 className="mb-4 border-b pb-2 font-inter font-semibold text-gray-700">
        Uploaded Sermons
      </h3>
      {sermons.length === 0 ? (
        <p className="font-inter italic text-gray-400">No sermons uploaded.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sermons.map((sermon) => (
            <li key={sermon.id} className={listRowClass}>
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-inter font-bold text-[#330040]">
                  {sermon.title}
                </h4>
                <p className="font-inter text-sm text-gray-500">{sermon.date}</p>
                <audio controls preload="none" className="mt-2 h-8 w-full max-w-xs">
                  <source src={assetUrl(sermon.audioUrl)} type="audio/mpeg" />
                </audio>
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
