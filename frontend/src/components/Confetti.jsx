import { useEffect, useRef } from "react";

// The site's gold and purples, plus white, so the confetti matches the brand.
const COLORS = ["#ffd700", "#fde68a", "#65007f", "#9550a7", "#e2cdec", "#ffffff"];

const random = (min, max) => min + Math.random() * (max - min);

/**
 * A burst of falling confetti drawn on one full-screen canvas. It falls for
 * `duration` ms, then lets the last pieces drop and fades out. It never takes
 * clicks, and is skipped entirely for visitors who prefer reduced motion.
 */
export default function Confetti({ duration = 6000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Pieces start spread above the screen so the first burst is staggered.
    const makePiece = (spreadAbove) => ({
      x: random(0, width),
      y: spreadAbove ? random(-height, 0) : -20,
      size: random(6, 12),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.3,
      fall: random(2, 5),
      drift: random(-1.5, 1.5),
      angle: random(0, Math.PI * 2),
      spin: random(-0.2, 0.2),
      sway: random(0, Math.PI * 2),
    });

    // Fewer pieces on a phone, so it stays smooth on slower devices.
    const pieces = Array.from({ length: Math.min(180, Math.round(width / 6)) }, () =>
      makePiece(true)
    );

    const start = performance.now();
    let frame = 0;

    const draw = (now) => {
      const elapsed = now - start;
      const opacity = elapsed > duration ? Math.max(0, 1 - (elapsed - duration) / 1200) : 1;

      context.clearRect(0, 0, width, height);
      context.globalAlpha = opacity;

      for (const piece of pieces) {
        piece.sway += 0.05;
        piece.x += piece.drift + Math.sin(piece.sway) * 0.6;
        piece.y += piece.fall;
        piece.angle += piece.spin;

        // Recycle pieces that leave the bottom until the burst is over.
        if (piece.y > height + 20 && elapsed < duration) Object.assign(piece, makePiece(false));

        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        if (piece.round) {
          context.beginPath();
          context.arc(0, 0, piece.size / 2.6, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(-piece.size / 2, -piece.size / 3.2, piece.size, piece.size / 1.6);
        }
        context.restore();
      }

      if (opacity > 0) {
        frame = requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}
