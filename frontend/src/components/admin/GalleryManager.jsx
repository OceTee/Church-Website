import { useState } from "react";
import { Trash2 } from "lucide-react";
import { apiFetch, assetUrl } from "../../lib/api";
import { createWithUpload } from "../../lib/uploads";
import { formatAge, formatDate, todayIso } from "../../lib/dates";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
} from "./fieldStyles";

// The date the photo was taken. It defaults to today, the usual case when
// uploading straight after a service.
const emptyForm = () => ({ date: todayIso(), file: null });

const photoDate = (photo) => formatDate(photo.date, { weekday: false });

export default function GalleryManager({ photos, onChanged, onError }) {
  const [form, setForm] = useState(emptyForm);
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
      setForm(emptyForm());
      await onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (photo) => {
    const label = photo.date ? `the photo from ${photoDate(photo)}` : "this photo";
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
              Date Taken
            </label>
            {/* A real date, so each photo's age can be shown and the gallery
                sorted newest first. A photo cannot be from the future. */}
            <input
              id="photo-date"
              type="date"
              className={inputClass}
              required
              max={todayIso()}
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
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
                alt={photo.date ? `Photo from ${photoDate(photo)}` : "Gallery photo"}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              {/* Always visible: a hover-only button cannot be seen on a
                  phone but can still be tapped by accident. */}
              <figcaption className="flex items-center justify-between gap-2 p-2">
                <div className="min-w-0">
                  <p className="truncate font-nunito text-xs font-semibold text-gray-700">
                    {photoDate(photo)}
                  </p>
                  {formatAge(photo.date) && (
                    <p className="truncate font-nunito text-xs text-gray-500">
                      {formatAge(photo.date)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  aria-label={`Delete photo from ${photoDate(photo)}`}
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
