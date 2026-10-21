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

  const handleDelete = async (photo) => {
    const label = photo.date ? `the photo from ${photo.date}` : "this photo";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    const { id } = photo;
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
              className="font-nunito text-sm"
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

      <h3 className="mb-4 border-b pb-2 font-nunito font-semibold text-gray-700">
        Current Photos
      </h3>
      {photos.length === 0 ? (
        <p className="font-nunito italic text-gray-400">No photos uploaded.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-lg border bg-white"
            >
              <img
                src={assetUrl(photo.imageUrl)}
                alt={photo.date}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              {/* Always visible: a hover-only button cannot be seen on a
                  phone but can still be tapped by accident. */}
              <figcaption className="flex items-center justify-between gap-2 p-2">
                <p className="truncate font-nunito text-xs text-gray-600">{photo.date}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
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
