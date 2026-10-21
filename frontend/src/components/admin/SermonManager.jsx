import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { createSermon } from "../../lib/sermons";
import { formatEventDate as formatDate } from "../../lib/events";
import SpeakerAvatar from "../SpeakerAvatar";
import SermonBody from "../SermonBody";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
  listRowClass,
} from "./fieldStyles";

function todayIso() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const emptyForm = () => ({ title: "", speaker: "", date: todayIso(), body: "", photo: null });

export default function SermonManager({ sermons, onChanged, onError }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const previewUrl = useRef(null);

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
    setBusy(true);

    try {
      await createSermon(form);
      event.target.reset();
      setForm(emptyForm());
      choosePhoto(null);
      setShowPreview(false);
      await onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async ({ id, title }) => {
    if (!window.confirm(`Delete the sermon "${title}"? This cannot be undone.`)) return;

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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="sermon-title">
              Sermon Title
            </label>
            <input
              id="sermon-title"
              className={inputClass}
              required
              maxLength={200}
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. The Power of Faith"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="sermon-speaker">
              Speaker&apos;s Name
            </label>
            <input
              id="sermon-speaker"
              className={inputClass}
              required
              maxLength={120}
              value={form.speaker}
              onChange={(event) => update("speaker", event.target.value)}
              placeholder="e.g. Pastor John Adeyemi"
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
            <label className={labelClass} htmlFor="sermon-photo">
              Speaker&apos;s Photo (optional)
            </label>
            <div className="flex items-center gap-3">
              <SpeakerAvatar
                name={form.speaker}
                src={photoPreview}
                className="h-[2.618rem] w-[2.618rem] rounded-full"
                initialsClassName="text-sm"
              />
              <input
                id="sermon-photo"
                type="file"
                accept="image/*"
                onChange={(event) => choosePhoto(event.target.files[0] || null)}
                className="min-w-0 font-inter text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-end justify-between gap-4">
            <label className={`${labelClass} mb-0`} htmlFor="sermon-body">
              Sermon Text
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((shown) => !shown)}
              className="inline-flex items-center gap-1.5 font-inter text-sm text-[#65007f] hover:underline"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? "Hide preview" : "Preview"}
            </button>
          </div>
          <textarea
            id="sermon-body"
            className={`${inputClass} min-h-64 leading-relaxed`}
            required
            maxLength={100000}
            value={form.body}
            onChange={(event) => update("body", event.target.value)}
            placeholder="Type or paste the sermon here."
          />
          <p className="mt-1 font-inter text-xs text-gray-500">
            Leave a blank line between paragraphs. Start a line with{" "}
            <code className="rounded bg-gray-100 px-1">## </code> for a section heading, or{" "}
            <code className="rounded bg-gray-100 px-1">&gt; </code> for a scripture quotation.
          </p>
          {showPreview && (
            <div className="mt-4 rounded-lg border border-dashed border-[#9550a7]/40 p-4">
              {form.body.trim() ? (
                <SermonBody text={form.body} />
              ) : (
                <p className="font-inter text-sm italic text-gray-400">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <button type="submit" disabled={busy} className={`${primaryButtonClass} self-start`}>
          {busy ? "Publishing..." : "Publish Sermon"}
        </button>
      </form>

      <h3 className="mb-4 border-b pb-2 font-inter font-semibold text-gray-700">Sermons</h3>
      {sermons.length === 0 ? (
        <p className="font-inter italic text-gray-400">No sermons added yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sermons.map((sermon) => (
            <li key={sermon.id} className={listRowClass}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SpeakerAvatar
                  name={sermon.speaker}
                  src={sermon.speakerImageUrl}
                  className="h-[2.618rem] w-[2.618rem] rounded-full"
                  initialsClassName="text-sm"
                />
                <div className="min-w-0">
                  <h4 className="truncate font-inter font-bold text-[#330040]">{sermon.title}</h4>
                  <p className="truncate font-inter text-sm text-gray-500">
                    {[sermon.speaker, formatDate(sermon.date)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={`/sermons/${sermon.id}`}
                  className="rounded-lg border border-[#65007f]/20 px-3 py-2 font-inter text-sm text-[#65007f] transition hover:bg-[#65007f]/5"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(sermon)}
                  aria-label={`Delete ${sermon.title}`}
                  className={dangerButtonClass}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
