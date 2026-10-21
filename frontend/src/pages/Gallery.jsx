import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import Header from "../components/Header";
import ImageLightbox from "../components/ImageLightbox";
import { apiJson, assetUrl } from "../lib/api";
import { formatDate, isIsoDate } from "../lib/dates";
import { site } from "../config/site";

function monthForPhoto(photo) {
  if (isIsoDate(photo.date)) {
    const [year, month] = photo.date.split("-").map(Number);
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const label = new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
    return { key, label };
  }

  // A few early gallery entries used a free-text month such as "June 2026".
  const legacyMonth = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i.exec(
    photo.date || ""
  );
  if (legacyMonth) {
    const date = new Date(`${legacyMonth[1]} 1, ${legacyMonth[2]}`);
    if (!Number.isNaN(date.getTime())) {
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      };
    }
  }

  return { key: "older", label: "Earlier photos" };
}

function groupPhotosByMonthAndDate(photos) {
  const months = new Map();

  photos.forEach((photo, photoIndex) => {
    const month = monthForPhoto(photo);
    if (!months.has(month.key)) months.set(month.key, { ...month, dates: new Map() });
    const monthGroup = months.get(month.key);
    const dateKey = photo.date || "undated";
    if (!monthGroup.dates.has(dateKey)) {
      monthGroup.dates.set(dateKey, {
        label: photo.label || "Date not recorded",
        photos: [],
      });
    }
    monthGroup.dates.get(dateKey).photos.push({ photo, photoIndex });
  });

  return Array.from(months.values());
}

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const groupedPhotos = useMemo(() => groupPhotosByMonthAndDate(photos), [photos]);
  const telegramLinks = site.socials.filter(({ href }) => /^https:\/\/t\.me\//i.test(href));

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
    <div className="flex min-h-dvh flex-col items-center px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <Header
          main="Gallery"
          sub="Moments from our services, events, and life together as a church family."
        />

        <aside className="rounded-2xl border border-[#65007f]/15 bg-white p-5 shadow-sm">
          <p className="font-nunito text-base text-gray-700">
            Looking for older photos? Visit our Telegram channels.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {telegramLinks.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-nunito text-sm font-semibold text-[#65007f] underline underline-offset-4 hover:text-[#330040]"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>

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
          <div className="flex flex-col gap-[2.618rem]">
            {groupedPhotos.map((month) => (
              <section key={month.key} aria-labelledby={`gallery-month-${month.key}`}>
                <h2
                  id={`gallery-month-${month.key}`}
                  className="mb-5 border-b border-[#65007f]/20 pb-2 font-palatino text-gr-lg font-bold text-[#330040]"
                >
                  {month.label}
                </h2>
                <div className="flex flex-col gap-6">
                  {Array.from(month.dates.entries()).map(([dateKey, dateGroup]) => (
                    <section key={dateKey} aria-label={dateGroup.label}>
                      <h3 className="mb-3 font-palatino text-gr-md font-semibold text-[#65007f]">
                        {dateGroup.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                        {dateGroup.photos.map(({ photo, photoIndex }) => (
                          <figure
                            key={photo.id}
                            onClick={() => setActiveIndex(photoIndex)}
                            role="button"
                            tabIndex={0}
                            aria-label={`View larger: ${photo.label || "photo"}`}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveIndex(photoIndex);
                              }
                            }}
                            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#330040] focus-visible:ring-offset-2"
                          >
                            <img
                              src={photo.fullUrl}
                              alt={photo.label ? `Photo from ${photo.label}` : "Gallery photo"}
                              loading="lazy"
                              decoding="async"
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
                    </section>
                  ))}
                </div>
              </section>
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
