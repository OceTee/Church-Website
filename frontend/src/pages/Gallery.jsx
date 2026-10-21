import { useCallback, useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import Header from "../components/Header";
import ImageLightbox from "../components/ImageLightbox";
import { apiJson, assetUrl } from "../lib/api";
import { formatDate } from "../lib/dates";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPhotos = async () => {
      try {
        const data = await apiJson("/gallery");
        if (active) {
          setPhotos(
            (Array.isArray(data) ? data : []).map((photo) => ({
              ...photo,
              fullUrl: assetUrl(photo.imageUrl),
              // "12 Oct 2026"; older free-text dates are shown as typed.
              label: formatDate(photo.date, { weekday: false }),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPhotos();
    return () => {
      active = false;
    };
  }, []);

  const close = useCallback(() => setActiveIndex(null), []);

  const step = useCallback(
    (delta) => {
      setActiveIndex((current) => {
        if (current === null || photos.length === 0) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length]
  );

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <Header
          main="Gallery"
          sub="Moments from our services, events, and life together as a church family."
        />

        {loading ? (
          <p className="font-nunito text-gray-500">Loading gallery...</p>
        ) : failed ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            The gallery could not be loaded just now. Please try again shortly.
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            No photos added yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((photo, index) => (
              <figure
                key={photo.id}
                onClick={() => setActiveIndex(index)}
                role="button"
                tabIndex={0}
                aria-label={`View larger: ${photo.label || "photo"}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveIndex(index);
                  }
                }}
                className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#330040] focus-visible:ring-offset-2"
              >
                <img
                  src={photo.fullUrl}
                  alt={photo.label ? `Photo from ${photo.label}` : "Gallery photo"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Maximize2 size={16} />
                </span>
                <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 font-nunito text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {photo.label}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        photos={photos}
        index={activeIndex}
        onClose={close}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
    </div>
  );
}
