import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch, assetUrl } from "../../lib/api";
import { createWithUpload } from "../../lib/uploads";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
} from "./fieldStyles";

const EMPTY_FORM = { date: "", file: null };

export default function GalleryManager({ photos, onChanged, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.file) return;

    setBusy(true);
    try {
      await createWithUpload({
        category: "gallery",
        file: form.file,
        fields: { date: form.date },
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
      const response = await apiFetch(`/gallery/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete photo");
      await onChanged();
    } catch (error) {
      onError(error);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Gallery Manager</h2>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="photo-file">
              Photo (image)
            </label>
            <input
              id="photo-file"
              type="file"
              accept="image/*"
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  file: event.target.files[0] || null,
                }))
              }
              className="font-inter text-sm"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="photo-date">
              Date / Context
            </label>
            <input
              id="photo-date"
              className={inputClass}
              required
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              placeholder="e.g. June 2026"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className={`${primaryButtonClass} self-start`}
        >
          {busy ? "Uploading..." : "Upload Photo"}
        </button>
      </form>

      <h3 className="mb-4 border-b pb-2 font-inter font-semibold text-gray-700">
        Current Photos
      </h3>
      {photos.length === 0 ? (
        <p className="font-inter italic text-gray-400">No photos uploaded.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border"
            >
              <img
                src={assetUrl(photo.imageUrl)}
                alt={photo.date}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              <figcaption className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="font-inter text-xs text-white">{photo.date}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  aria-label={`Delete photo from ${photo.date}`}
                  className={dangerButtonClass}
                >
                  <Trash2 size={16} />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
