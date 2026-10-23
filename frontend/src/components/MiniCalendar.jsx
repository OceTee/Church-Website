import { useState, useEffect } from "react";
import { assetUrl, cssUrl } from "../lib/api";
import { eventStatusLabel, formatEventRange, formatEventTime } from "../lib/events";

// Photo-first, text overlaid, maintaining the image's natural aspect ratio
export default function MiniCalendar({ title, sub, date: rawDate, endDate, time: rawTime, flyerUrl }) {
  const [aspectRatio, setAspectRatio] = useState(null);
  // A single day, or the span of a multi-day programme.
  const date = formatEventRange(rawDate, endDate);
  const time = formatEventTime(rawTime);
  // "Today", "Day 3 of 11" or "Tomorrow" while the event is live or imminent.
  const statusLabel = eventStatusLabel({ date: rawDate, endDate });

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
    <article className="group relative w-full overflow-hidden rounded-2xl bg-black shadow-[0_14px_40px_rgba(24,10,30,0.14)]" style={aspectStyle}>
      {/* Background image layer - at the very back */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-[1.025]"
        style={{
          zIndex: 0,
          backgroundImage: `linear-gradient(to top, rgba(10, 4, 20, 0.65), transparent 60%), ${cssUrl(flyerUrl ? assetUrl(flyerUrl) : "/BG.svg")}`,
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" style={{ zIndex: 10 }} />

      {/* Content layer - all text at the bottom, yellow badge top-right */}
      <div className="relative flex h-full flex-col justify-end p-4 sm:p-5" style={{ zIndex: 20 }}>
        {/* Top row: live status pill on the left, yellow date badge on the right */}
        <div className="mb-auto flex items-start justify-between gap-3">
          {statusLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-nunito text-xs font-semibold text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffd700]" aria-hidden="true" />
              {statusLabel}
            </span>
          ) : (
            <span />
          )}
          <div className="shrink-0 rounded-lg bg-[#ffd700] px-3 py-1.5 text-center">
            <p className="font-nunito text-xs font-bold leading-tight text-black">{date}</p>
            <p className="font-nunito text-[10px] font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {/* Bottom - all text content stacked */}
        <div className="flex flex-col items-center gap-2.5 px-2 pb-1 text-center sm:gap-3 sm:px-4 sm:pb-2">
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
