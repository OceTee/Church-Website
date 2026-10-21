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
const photoDate = (photo) => formatDate(photo.date, { weekday: false });

export default function GalleryManager({ photos, onChanged, onError }) {
  const [form, setForm] = useState(() => ({ date: todayIso() }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (files.length === 0) return;

    const selectedFiles = files;
    setBusy(true);
    setNotice("");
    setProgress({ complete: 0, total: selectedFiles.length });
    try {
      const results = new Array(selectedFiles.length);
      let nextIndex = 0;
      let complete = 0;

      const uploadWorker = async () => {
        while (nextIndex < selectedFiles.length) {
          const index = nextIndex++;
          try {
            await createWithUpload({
              category: "gallery",
              file: selectedFiles[index],
              fields: { date: form.date },
            });
            results[index] = { ok: true };
          } catch (error) {
            results[index] = { ok: false, error };
          } finally {
            complete += 1;
            setProgress({ complete, total: selectedFiles.length });
          }
        }
      };

      // Keep several uploads moving at once without opening an unbounded
      // number of requests when a large selection is made.
      await Promise.all(
        Array.from({ length: Math.min(3, selectedFiles.length) }, uploadWorker)
      );

      const uploaded = results.filter((result) => result.ok).length;
      const failed = results.filter((result) => !result.ok);

      event.target.reset();
      setFiles([]);
      setForm({ date: todayIso() });
      setProgress(null);

      if (uploaded > 0) await onChanged();
      if (failed.length > 0) {
        const firstFailure = failed[0].error?.message || "Unknown upload error";
        onError(
          new Error(
            `Uploaded ${uploaded} of ${selectedFiles.length} photos. ${failed.length} failed. ${firstFailure}`
          )
        );
      } else {
        setNotice(`Uploaded ${uploaded} photo${uploaded === 1 ? "" : "s"} successfully.`);
      }
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
      setProgress(null);
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
            <label className={labelClass} htmlFor="photo-files">
              Photos (select as many as you need)
            </label>
            <input
              id="photo-files"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              required
              onChange={(event) =>
                setFiles(Array.from(event.target.files || []))
              }
              className="font-nunito text-sm"
            />
            {files.length > 0 && (
              <p className="mt-1 font-nunito text-xs text-gray-500">
                {files.length} photo{files.length === 1 ? "" : "s"} selected
              </p>
            )}
            <p className="mt-1 max-w-lg font-nunito text-xs text-gray-500">
              If the gallery storage or database is full, older gallery photos may be removed automatically to make room.
            </p>
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
          {busy
            ? `Uploading ${progress?.complete || 0} of ${progress?.total || files.length}…`
            : `Upload ${files.length || "Photos"}`}
        </button>
        {notice && (
          <p role="status" className="font-nunito text-sm text-green-700">
            {notice}
          </p>
        )}
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
