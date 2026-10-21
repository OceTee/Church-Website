import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageLightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = index === null ? null : photos[index];

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (!photo) return;

    const onKeyDown = (event) => handleKeyDown(event);
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [photo, handleKeyDown]);

  return createPortal(
    photo ? (
        <div
          key="backdrop"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photo.label || "Photo viewer"}
          className="lightbox-backdrop fixed inset-0 z-100 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6"
          >
            <X size={22} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-2 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onNext();
                }}
                aria-label="Next photo"
                className="absolute right-2 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
              >
                <ChevronRight size={26} />
              </button>
            </>
          )}

          <figure
            key={photo.id}
            onClick={(event) => event.stopPropagation()}
            className="lightbox-photo flex max-h-full max-w-5xl flex-col items-center gap-4"
          >
            <img
              src={photo.fullUrl}
              alt={photo.label ? `Photo from ${photo.label}` : "Gallery photo"}
              decoding="async"
              className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
            />
            <figcaption className="flex items-center gap-3 font-nunito text-sm text-white/80">
              <span>{photo.label}</span>
              {photos.length > 1 && (
                <span className="text-white/40">
                  {index + 1} / {photos.length}
                </span>
              )}
            </figcaption>
          </figure>
        </div>
      ) : null,
    document.body
  );
}
