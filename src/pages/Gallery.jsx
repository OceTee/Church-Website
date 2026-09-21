import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiFetch, assetUrl } from "../lib/api";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPhotos = async () => {
      try {
        const response = await apiFetch("/gallery");
        const data = await response.json();
        if (active) setPhotos(data);
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPhotos();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <Header
          main="Gallery"
          sub="Moments from our services, events, and life together as a church family."
        />

        {loading ? (
          <p className="font-inter text-gray-500">Loading gallery...</p>
        ) : photos.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-inter italic text-gray-500">
            No photos added yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-xl shadow-md"
              >
                <img
                  src={assetUrl(photo.imageUrl)}
                  alt={photo.date}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 font-inter text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {photo.date}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
