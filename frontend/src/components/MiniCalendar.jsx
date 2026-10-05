import { useState, useEffect } from "react";
import { assetUrl } from "../lib/api";

// Photo-first, text overlaid, maintaining the image's natural aspect ratio
export default function MiniCalendar({ title, sub, date, time, flyerUrl }) {
  const [aspectRatio, setAspectRatio] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!flyerUrl) return;
    const img = new Image();
    img.src = assetUrl(flyerUrl);
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => {
      // Image failed to load, aspectRatio stays null
    };
  }, [flyerUrl]);

  const aspectStyle = aspectRatio ? { aspectRatio: aspectRatio } : {};

  return (
    <article className="relative w-full overflow-hidden rounded-xl shadow-md bg-black" style={aspectStyle}>
      {/* Background image layer - at the very back */}
      {!imageError && flyerUrl ? (
        <img
          src={assetUrl(flyerUrl)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 0 }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-[#65007f] to-[#3a0030]" style={{ zIndex: 0 }} />
      )}

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" style={{ zIndex: 10 }} />

      {/* Content layer - text and highlights on top */}
      <div className="relative flex h-full flex-col justify-between p-5" style={{ zIndex: 20 }}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="max-w-[70%] font-playfair text-xl font-bold leading-tight text-white md:text-2xl">
            {title}
          </h2>
          <div className="shrink-0 rounded-lg bg-[#ffd700] px-3 py-1.5 text-center">
            <p className="font-inter text-xs font-bold leading-tight text-black">{date}</p>
            <p className="font-inter text-[10px] font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {sub && (
          <p className="max-w-[85%] font-inter text-sm leading-snug text-white/90 md:text-base">
            {sub}
          </p>
        )}
      </div>
    </article>
  );
}