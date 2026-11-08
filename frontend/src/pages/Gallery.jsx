import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import Header from "../components/Header";
import ImageLightbox from "../components/ImageLightbox";
import { apiJson } from "../lib/api";
import { formatDate, isIsoDate } from "../lib/dates";

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
  const [nextBefore, setNextBefore] = useState(null);
  const [channelUrl, setChannelUrl] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const groupedPhotos = useMemo(() => groupPhotosByMonthAndDate(photos), [photos]);

  // Photos come from the church's Telegram media channel, newest first. Each
  // call returns a page plus the cursor for the next, older page.
  const loadPage = useCallback(async (before) => {
    const data = await apiJson(`/telegram/gallery${before ? `?before=${before}` : ""}`);
    const page = (data.photos || []).map((photo) => ({
      ...photo,
      fullUrl: photo.imageUrl,
      label: formatDate(photo.date, { weekday: false }), // "12 Oct 2026"
    }));
    setPhotos((current) => {
      const seen = new Set(current.map((photo) => photo.id));
      return [...current, ...page.filter((photo) => !seen.has(photo.id))];
    });
    setNextBefore(data.nextBefore || null);
    setChannelUrl(data.channelUrl || "");
  }, []);

  useEffect(() => {
    let active = true;
    loadPage()
      .catch((error) => {
        console.error("Failed to fetch gallery:", error);
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await loadPage(nextBefore);
    } catch (error) {
      console.error("Failed to fetch older photos:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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

        {channelUrl && (
          <aside className="rounded-2xl border border-[#65007f]/15 bg-white p-5 shadow-sm">
            <p className="font-nunito text-base text-gray-700">
              These photos come straight from our Telegram media channel.{" "}
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#65007f] underline underline-offset-4 hover:text-[#330040]"
              >
                Follow it on Telegram
              </a>{" "}
              for videos and the latest uploads.
            </p>
          </aside>
        )}

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
              <section key={month.key} className="gallery-month" aria-labelledby={`gallery-month-${month.key}`}>
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

            {nextBefore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="self-center rounded-full border border-[#65007f] px-5 py-2 font-nunito text-sm font-semibold text-[#65007f] transition hover:bg-[#65007f] hover:text-white disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load older photos"}
              </button>
            )}
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
