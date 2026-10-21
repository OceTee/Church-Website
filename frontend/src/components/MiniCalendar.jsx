import { useState, useEffect } from "react";
import { assetUrl, cssUrl } from "../lib/api";
import { formatEventDate, formatEventTime } from "../lib/events";

// Photo-first, text overlaid, maintaining the image's natural aspect ratio
export default function MiniCalendar({ title, sub, date: rawDate, time: rawTime, flyerUrl }) {
  const [aspectRatio, setAspectRatio] = useState(null);
  const date = formatEventDate(rawDate);
  const time = formatEventTime(rawTime);

  useEffect(() => {
    if (!flyerUrl) return;
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (active && img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    // If the image fails to load, aspectRatio stays null.
    img.src = assetUrl(flyerUrl);
    return () => {
      active = false;
    };
  }, [flyerUrl]);

  const aspectStyle = aspectRatio ? { aspectRatio: aspectRatio } : {};

  return (
    <article className="relative w-full overflow-hidden rounded-xl shadow-md bg-black" style={aspectStyle}>
      {/* Background image layer - at the very back */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          zIndex: 0,
          backgroundImage: `linear-gradient(to top, rgba(10, 4, 20, 0.65), transparent 60%), ${cssUrl(flyerUrl ? assetUrl(flyerUrl) : "/BG.svg")}`,
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" style={{ zIndex: 10 }} />

      {/* Content layer - all text at the bottom, yellow badge top-right */}
      <div className="relative flex h-full flex-col justify-end p-5" style={{ zIndex: 20 }}>
        {/* Top right - yellow date badge only */}
        <div className="flex justify-end mb-auto">
          <div className="shrink-0 rounded-lg bg-[#ffd700] px-3 py-1.5 text-center">
            <p className="font-nunito text-xs font-bold leading-tight text-black">{date}</p>
            <p className="font-nunito text-[10px] font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {/* Bottom - all text content stacked */}
        <div className="flex flex-col items-center gap-3 text-center px-4 pb-2">
          {/* Title */}
          <h2 className="font-palatino text-xl font-bold leading-tight text-white md:text-2xl lg:text-3xl">
            {title}
          </h2>

          {/* Description */}
          {sub && (
            <p className="max-w-[85%] font-nunito text-sm leading-snug text-white/90 md:text-base">
              {sub}
            </p>
          )}

          {/* Date and time at the very bottom */}
          <div className="flex items-center justify-center gap-3 text-white/90">
            <span className="font-nunito text-sm">{date}</span>
            {time && <span className="text-white/70">{time}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}