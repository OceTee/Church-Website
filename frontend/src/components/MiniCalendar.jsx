import { useState, useEffect, useRef } from "react";
import { assetUrl } from "../lib/api";

// Photo-first, text overlaid, maintaining the image's natural aspect ratio
export default function MiniCalendar({ title, sub, date, time, flyerUrl }) {
  const [aspectRatio, setAspectRatio] = useState(null);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);

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
    <article className="relative w-full overflow-hidden rounded-xl shadow-md bg-[#330040]" style={aspectStyle}>
      {/* Background image layer - at the very back */}
      <div className="relative w-full h-full" style={{ zIndex: 0 }}>
        {flyerUrl && !imageError && (
          <img
            ref={imgRef}
            src={assetUrl(flyerUrl)}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ zIndex: 0, opacity: 1 }}
            onError={() => setImageError(true)}
            onLoad={() => {}}
          />
        )}
        {/* Fallback gradient when no image or error */}
        <div
          className="absolute inset-0 h-full w-full bg-gradient-to-br from-[#65007f] to-[#3a0030]"
          style={{ zIndex: 0, display: imageError || !flyerUrl ? 'block' : 'none' }}
        />
      </div>

      {/* Subtle gradient overlay for text readability - only at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/60" style={{ zIndex: 10 }} />

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