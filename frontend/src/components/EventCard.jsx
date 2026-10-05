import { useState, useEffect, useRef } from "react";
import { assetUrl } from "../lib/api";

// Full event card for the Events page - photo-first with proper text overlay
export default function EventCard({ title, sub, date, time, flyerUrl }) {
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
    <article className="relative w-full overflow-hidden rounded-xl shadow-lg bg-[#330040]" style={aspectStyle}>
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

      {/* Gradient overlay for text readability - full coverage with vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" style={{ zIndex: 10 }} />

      {/* Content layer - text overlay on the image */}
      <div className="relative flex h-full flex-col p-6" style={{ zIndex: 20 }}>
        {/* Top section - yellow date badge top-right */}
        <div className="flex justify-end mb-4">
          <div className="shrink-0 rounded-lg bg-[#ffd700] px-4 py-2 text-center shadow-lg">
            <p className="font-inter text-sm font-bold leading-tight text-black">{date}</p>
            <p className="font-inter text-xs font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-1" />

        {/* Bottom content - all text stacked */}
        <div className="flex flex-col items-start gap-4 w-full">
          {/* Title */}
          <h2 className="font-playfair text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl max-w-3xl">
            {title}
          </h2>

          {/* Description */}
          {sub && (
            <p className="max-w-2xl font-inter text-base leading-relaxed text-white/90">
              {sub}
            </p>
          )}

          {/* Date and time at the bottom */}
          <div className="flex items-center justify-start gap-4 text-white/90 mt-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="font-inter text-sm font-medium">{date}</span>
            </div>
            {time && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <span className="text-white/70">{time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}