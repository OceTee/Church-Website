import { useState, useEffect } from "react";
import { assetUrl, cssUrl } from "../lib/api";
import { eventStatusLabel, formatEventRange, formatEventTime } from "../lib/events";

// Descriptions longer than this are clipped behind a "Read more" toggle.
const READ_MORE_AT = { full: 180, compact: 110 };

/**
 * An event card: the flyer as a photo background with the text overlaid.
 *
 * The full card (Events page) keeps the flyer's own aspect ratio so the
 * whole flyer is seen. The compact card (home page) is a short preview, φ⁵
 * (11.09rem) tall unless its text needs more, with tighter type and spacing,
 * so a list of them takes far less room; the flyer is cropped to fit. Both
 * share one look.
 */
export default function MiniCalendar({
  title,
  sub,
  date: rawDate,
  endDate,
  time: rawTime,
  flyerUrl,
  compact = false,
}) {
  const [aspectRatio, setAspectRatio] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // A single day, or the span of a multi-day programme.
  const date = formatEventRange(rawDate, endDate);
  const time = formatEventTime(rawTime);
  // "Today", "Day 3 of 11" or "Tomorrow" while the event is live or imminent.
  const statusLabel = eventStatusLabel({ date: rawDate, endDate });

  const description = (sub ?? "").trim();
  const limit = compact ? READ_MORE_AT.compact : READ_MORE_AT.full;
  const clipped = description.length > limit;
  const shownDescription =
    clipped && !expanded ? `${description.slice(0, limit).trimEnd()}…` : description;

  useEffect(() => {
    // Only the full card follows the flyer's natural shape.
    if (!flyerUrl || compact) return undefined;
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
  }, [flyerUrl, compact]);

  const aspectStyle = !compact && aspectRatio ? { aspectRatio } : {};

  return (
    <article
      className={`group relative w-full overflow-hidden rounded-2xl bg-black shadow-[0_14px_40px_rgba(24,10,30,0.14)] ${
        compact ? "min-h-[11.09rem]" : ""
      }`}
      style={aspectStyle}
    >
      {/* Background image layer - at the very back */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-[1.025]"
        style={{
          zIndex: 0,
          backgroundImage: `linear-gradient(to top, rgba(10, 4, 20, 0.65), transparent 60%), ${cssUrl(flyerUrl ? assetUrl(flyerUrl) : "/BG.svg")}`,
        }}
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/35 to-black/10" style={{ zIndex: 10 }} />

      {/* Content layer - all text at the bottom, yellow badge top-right */}
      <div
        className={`relative flex h-full flex-col justify-end ${compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}`}
        style={{ zIndex: 20 }}
      >
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
          <div className={`shrink-0 rounded-lg bg-[#ffd700] text-center ${compact ? "px-2.5 py-1" : "px-3 py-1.5"}`}>
            <p className={`font-nunito font-bold leading-tight text-black ${compact ? "text-[11px]" : "text-xs"}`}>
              {date}
            </p>
            <p className="font-nunito text-[10px] font-medium text-black/70">{time || "Event"}</p>
          </div>
        </div>

        {/* Bottom - all text content stacked */}
        <div
          className={`flex flex-col items-center text-center ${
            compact ? "gap-1.5 px-1 pb-0.5 sm:gap-2 sm:px-3" : "gap-2.5 px-2 pb-1 sm:gap-3 sm:px-4 sm:pb-2"
          }`}
        >
          {/* Title */}
          <h2
            className={`font-palatino font-bold leading-tight text-white ${
              compact ? "text-lg md:text-xl" : "text-xl md:text-2xl lg:text-3xl"
            }`}
          >
            {title}
          </h2>

          {/* Description, clipped behind "Read more" when long */}
          {description && (
            <p
              className={`max-w-[85%] font-nunito leading-snug text-white/90 ${
                compact ? "text-xs sm:text-sm" : "text-sm md:text-base"
              } ${expanded ? "whitespace-pre-line" : ""}`}
            >
              {shownDescription}
              {clipped && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => setExpanded((open) => !open)}
                    aria-expanded={expanded}
                    className="font-semibold text-[#ffd700] underline underline-offset-4 transition hover:text-[#fde68a]"
                  >
                    {expanded ? "Show less" : "Read more"}
                  </button>
                </>
              )}
            </p>
          )}

          {/* Date and time at the very bottom */}
          <div className={`flex items-center justify-center gap-3 text-white/90 ${compact ? "text-xs" : ""}`}>
            <span className={`font-nunito ${compact ? "" : "text-sm"}`}>{date}</span>
            {time && <span className="text-white/70">{time}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
