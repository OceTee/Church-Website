import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl } from "../lib/api";
import { site } from "../config/site";

const FALLBACK_BG = "/BG.svg";
const AUTO_MS = 6000;

// Only a URL we control may become a background image. A flyer URL is admin
// content, and putting it straight into url() is an injection vector.
function safeBackground(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : null;
}

export default function Hero({ events = [] }) {
  const slides = events.slice(0, 5);
  const hasSlides = slides.length > 0;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const drag = useRef({ startX: 0, moved: false });

  const current = hasSlides ? slides[index] : null;
  const bgUrl = safeBackground(current ? assetUrl(current.flyerUrl) : null) || FALLBACK_BG;

  useEffect(() => {
    if (!hasSlides || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => clearInterval(id);
  }, [hasSlides, paused, slides.length]);

  useEffect(() => {
    if (!hasSlides) return undefined;
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        setPaused(true);
        setIndex((i) => (i + (e.key === "ArrowRight" ? 1 : -1) + slides.length) % slides.length);
        setTimeout(() => setPaused(false), AUTO_MS);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasSlides, slides.length]);

  const go = (dir) => {
    setPaused(true);
    setIndex((i) => (i + dir + slides.length) % slides.length);
    setTimeout(() => setPaused(false), AUTO_MS);
  };

  const startDrag = (x) => { drag.current = { startX: x, moved: false }; };
  const moveDrag = (x) => { if (Math.abs(x - drag.current.startX) > 40) drag.current.moved = true; };
  const endDrag = (x) => {
    const dx = x - drag.current.startX;
    if (drag.current.moved && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="relative flex w-full justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        minHeight: "92vh",
        // Dark at both ends. The top carries the title and the bottom carries
        // the current event card, and a flyer photo can be bright anywhere, so
        // the overlay never thins out in the middle.
        backgroundImage: `linear-gradient(rgba(10, 4, 20, 0.86), rgba(10, 4, 20, 0.62), rgba(10, 4, 20, 0.88)), url('${bgUrl}')`,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onMouseDown={(e) => startDrag(e.clientX)}
      onMouseMove={(e) => moveDrag(e.clientX)}
      onMouseUp={(e) => endDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
      onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX)}
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 px-6 pb-16 pt-32 text-center md:pb-20 md:pt-44">

        {/* Original hero text, kept through every slide */}
        <div>
          <p className="mb-3 font-inter text-xs font-semibold uppercase tracking-[0.25em] text-[#fde68a]">
            CAC Possibility Assembly Nation
          </p>
          <h1 className="font-playfair text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to {site.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-inter text-lg text-white/90 md:text-xl">
            {site.tagline}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 font-inter sm:flex-row">
            <Link
              to="/stream"
              className="flex items-center justify-center gap-2 rounded-full bg-[#ffd700] px-7 py-3.5 text-black shadow-lg transition duration-100 hover:scale-105"
            >
              <Radio size={20} />
              Watch Live
            </Link>
            <Link
              to="/about"
              className="flex items-center justify-center gap-2 rounded-full border-2 border-[#ffd700] px-7 py-3.5 text-[#ffd700] transition duration-100 hover:scale-105"
            >
              Learn more
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Current slide */}
        {hasSlides && (
          <div className="w-full max-w-3xl">
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
              Upcoming event
            </p>
            <h2 className="mt-2 font-playfair text-2xl font-bold text-white md:text-3xl">
              {current.title}
            </h2>
            <p className="mt-1 font-inter text-white/85">
              {current.date}
              {current.time ? ` • ${current.time}` : ""}
            </p>
            <Link
              to="/events"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
            >
              View calendar <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Prev / next */}
      {hasSlides && (
        <>
          <button
            type="button"
            aria-label="Previous event"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 md:flex"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            aria-label="Next event"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 md:flex"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-5 flex w-full justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to event ${i + 1}`}
                onClick={() => {
                  setPaused(true);
                  setIndex(i);
                  setTimeout(() => setPaused(false), AUTO_MS);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-[#ffd700]" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}