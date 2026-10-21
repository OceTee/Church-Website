import { useState } from "react";
import { assetUrl } from "../lib/api";
import { initials } from "../lib/sermons";

/**
 * The speaker's photo, cropped to fill its box. `className` sets the size and
 * shape (rounded-full for a circle, a radius for a rounded square). Without a
 * photo, or if it fails to load, the speaker's initials are shown instead.
 */
export default function SpeakerAvatar({ name, src, className = "", initialsClassName = "text-xl" }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showPhoto = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-linear-to-br from-[#f6eefa] to-[#e2cdec] ring-1 ring-[#65007f]/15 ${className}`}
    >
      {showPhoto ? (
        <img
          src={assetUrl(src)}
          alt={name ? `Photo of ${name}` : "Speaker photo"}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-label={name || "Speaker"}
          className={`flex h-full w-full items-center justify-center font-playfair font-bold text-[#65007f] ${initialsClassName}`}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
