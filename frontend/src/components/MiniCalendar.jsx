import { assetUrl } from "../lib/api";

// Photo-first, text overlaid, in the same language as the hero: a large image
// with the title, description and date drawn on top.
export default function MiniCalendar({ title, sub, date, time, flyerUrl }) {
  return (
    <article className="relative flex h-64 w-full overflow-hidden rounded-xl shadow-md md:h-72">
      {flyerUrl ? (
        <img
          src={assetUrl(flyerUrl)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#65007f] to-[#3a0030]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

      <div className="relative flex h-full flex-col justify-between p-5">
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