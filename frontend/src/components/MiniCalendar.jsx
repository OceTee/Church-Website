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

      {/* Content layer - all text at the bottom, yellow badge top-right */}
      <div className="relative flex h-full flex-col justify-end p-5" style={{ zIndex: 20 }}>
        {/* Top right - yellow date badge only */}
        <div className="flex justify-end mb-auto">
          <div className="shrink-0 rounded-lg bg-[#ffd700] px-3 py-1.5 text-center">
            <p className="font-inter text-xs font-bold leading-tight text-black">{date}</p>
            <p className="font-inter text-[10px] font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {/* Bottom - all text content stacked */}
        <div className="flex flex-col items-center gap-3 text-center px-4 pb-2">
          {/* Title */}
          <h2 className="font-playfair text-xl font-bold leading-tight text-white md:text-2xl lg:text-3xl">
            {title}
          </h2>

          {/* Description */}
          {sub && (
            <p className="max-w-[85%] font-inter text-sm leading-snug text-white/90 md:text-base">
              {sub}
            </p>
          )}

          {/* Date and time at the very bottom */}
          <div className="flex items-center justify-center gap-3 text-white/90">
            <span className="font-inter text-sm">{date}</span>
            {time && <span className="text-white/70">{time}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}