import { useEffect, useRef, useState } from "react";
import loaderMark from "../assets/loader-mark.png";

const RING_RADIUS = 46;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// How long the exit runs. Must match the loader-leave animations in index.css.
const LEAVE_MS = 650;

// Where the ring waits if the page's code has not arrived in time.
const HOLD_AT = 0.92;

/**
 * Full-screen loading screen: the church mark bouncing at the centre of a
 * clear background, with a circular progress ring wrapped around it. It stays
 * for at least `duration` ms and until `ready` is true, then the mark expands
 * and fades away while the page behind it animates in from the centre.
 *
 * The ring fills with elapsed time, since a single-page app has no byte count
 * to measure; if the page is still loading when time is up it holds just
 * short of full, then completes.
 *
 * Sizes are on the golden ratio scale: ring φ⁵ (11.09rem), mark φ⁴ (6.854rem).
 */
export default function LoadingScreen({ duration, ready = true, onLeaving, onDone }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Read through refs so the animation loop never restarts mid-way.
  const readyRef = useRef(ready);
  const callbacks = useRef({ onLeaving, onDone });

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    callbacks.current = { onLeaving, onDone };
  }, [onLeaving, onDone]);

  useEffect(() => {
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const timed = Math.min((now - start) / duration, 1);
      if (timed >= 1 && readyRef.current) {
        setProgress(1);
        setLeaving(true);
        return;
      }
      setProgress(Math.min(timed, readyRef.current ? 1 : HOLD_AT));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  useEffect(() => {
    if (!leaving) return undefined;
    callbacks.current.onLeaving?.();
    const timer = setTimeout(() => callbacks.current.onDone?.(), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={leaving ? "Loaded" : "Loading"}
      className={`fixed inset-0 z-100 flex items-center justify-center bg-[#fbfaf8] ${
        leaving ? "loader-leave" : ""
      }`}
    >
      {/* The ring and the mark bounce, expand and fade together as one emblem. */}
      <div className="loader-emblem relative flex h-[11.09rem] w-[11.09rem] items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="loader-ring absolute inset-0 h-full w-full -rotate-90"
        >
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#e2cdec" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="#65007f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - progress)}
          />
        </svg>
        <img
          src={loaderMark}
          alt=""
          width={230}
          height={230}
          fetchPriority="high"
          className="h-[6.854rem] w-[6.854rem] object-contain"
        />
      </div>
    </div>
  );
}
