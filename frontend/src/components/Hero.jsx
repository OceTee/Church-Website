import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { assetUrl, cssUrl } from "../lib/api";
import { formatEventRange, formatEventTime, upcomingEvents } from "../lib/events";
import { site } from "../config/site";
import churchLogos from "../assets/church-logos.png";

const FALLBACK_BG = "/BG.svg";
const AUTO_MS = 6000;

// Only a URL we control may become a background image. A flyer URL is admin
// content, and putting it straight into url() is an injection vector.
function safeBackground(url) {
  if (!url) return null;
  return /^https?:\/\//i.test(url) || url.startsWith("/") ? url : null;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function Hero({ events = [] }) {
  const slides = upcomingEvents(events).slice(0, 5);
  const hasSlides = slides.length > 0;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(prefersReducedMotion);
  const drag = useRef({ startX: 0, moved: false });
  const resumeTimer = useRef(null);

  // `index` can point past the end if the list shrinks.
  const current = hasSlides ? slides[index % slides.length] : null;
  const bgUrl = safeBackground(current ? assetUrl(current.flyerUrl) : null) || FALLBACK_BG;

  useEffect(() => {
    if (!hasSlides || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_MS);
    return () => clearInterval(id);
  }, [hasSlides, paused, slides.length]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  // Pauses after manual navigation, then resumes once. A new navigation
  // restarts the countdown rather than stacking timers.
  const pauseThenResume = () => {
    setPaused(true);
    clearTimeout(resumeTimer.current);
    if (prefersReducedMotion()) return;
    resumeTimer.current = setTimeout(() => setPaused(false), AUTO_MS);
  };

  const go = (dir) => {
    pauseThenResume();
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  // Arrow keys only act while focus is inside the carousel, so they never
  // hijack scrolling or other controls elsewhere on the page.
  const onKeyDown = (event) => {
    if (!hasSlides) return;
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  };

  const startDrag = (x) => { drag.current = { startX: x, moved: false }; };
  const moveDrag = (x) => { if (Math.abs(x - drag.current.startX) > 40) drag.current.moved = true; };
  const endDrag = (x) => {
    const dx = x - drag.current.startX;
    if (hasSlides && drag.current.moved && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  };

  return (
    <section
      className="relative flex w-full justify-center overflow-hidden bg-cover bg-center bg-no-repeat focus:outline-none"
      aria-roledescription={hasSlides ? "carousel" : undefined}
      aria-label={hasSlides ? "Upcoming events" : undefined}
      tabIndex={hasSlides ? 0 : undefined}
      onKeyDown={onKeyDown}
      style={{
        minHeight: "92vh",
        // Dark at both ends. The top carries the title and the bottom carries
        // the current event card, and a flyer photo can be bright anywhere, so
        // the overlay never thins out in the middle.
        backgroundImage: `linear-gradient(rgba(10, 4, 20, 0.86), rgba(10, 4, 20, 0.62), rgba(10, 4, 20, 0.88)), ${cssUrl(bgUrl)}`,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(prefersReducedMotion())}
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
          {/* Golden ratio: the logos are φ² times the heading's font size
              (6.854rem over 2.618rem, then 11.09rem over 4.236rem) and sit one
              φ step above it. */}
          <img
            src={churchLogos}
            alt="Christ Apostolic Church and Possibility Assembly Nation logos"
            width={624}
            height={305}
            fetchPriority="high"
            className="mx-auto mb-[1.618rem] h-[6.854rem] w-auto lg:mb-[2.618rem] lg:h-[11.09rem]"
          />
          <h1 className="font-palatino text-gr-xl font-bold leading-tight text-white lg:text-gr-2xl">
            Welcome to {site.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-nunito text-lg text-white/90 md:text-gr-md">
            {site.tagline}
          </p>

          <div className="mt-[2.618rem] flex flex-col justify-center gap-4 font-nunito sm:flex-row">
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
          <div className="w-full max-w-3xl" aria-live={paused ? "polite" : "off"}>
            <p className="font-nunito text-xs font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
              Upcoming event
            </p>
            <h2 className="mt-2 font-palatino text-2xl font-bold text-white md:text-3xl">
              {current.title}
            </h2>
            <p className="mt-1 font-nunito text-white/85">
              {formatEventRange(current.date, current.endDate)}
              {current.time ? ` • ${formatEventTime(current.time)}` : ""}
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
                aria-current={i === index % slides.length ? "true" : undefined}
                onClick={() => {
                  pauseThenResume();
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index % slides.length ? "w-8 bg-[#ffd700]" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
