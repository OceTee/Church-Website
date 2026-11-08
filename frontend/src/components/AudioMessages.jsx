import { useEffect, useRef, useState } from "react";
import { ExternalLink, Headphones, Pause, Play } from "lucide-react";
import { apiJson, apiUrl } from "../lib/api";
import { formatDate } from "../lib/dates";

function formatDuration(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

/**
 * Audio messages from the church's Telegram channel. The backend lists the
 * channel's audio posts and streams each one in byte ranges, so a recording
 * starts playing at once however long it is. Only one plays at a time.
 */
export default function AudioMessages() {
  const [items, setItems] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [channelUrl, setChannelUrl] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | failed
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef(new Map());

  const load = async (before) => {
    const query = before ? `?before=${before}` : "";
    const data = await apiJson(`/telegram/audio${query}`);
    setItems((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...(data.items || []).filter((item) => !seen.has(item.id))];
    });
    setNextBefore(data.nextBefore || null);
    setChannelUrl(data.channelUrl || "");
  };

  useEffect(() => {
    let active = true;
    load()
      .then(() => active && setStatus("ready"))
      .catch((error) => {
        console.error("Failed to fetch audio messages:", error);
        if (active) setStatus("failed");
      });
    return () => {
      active = false;
    };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await load(nextBefore);
    } catch (error) {
      console.error("Failed to fetch older audio messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggle = (id) => {
    const audio = audioRefs.current.get(id);
    if (activeId === id && audio) {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
      return;
    }
    // Stop whatever was playing; the new player mounts and starts itself.
    audioRefs.current.get(activeId)?.pause();
    setActiveId(id);
  };

  return (
    <section aria-labelledby="audio-messages-heading" className="flex flex-col gap-[1.618rem]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#65007f]/20 pb-2">
        <h2
          id="audio-messages-heading"
          className="flex items-center gap-2 font-palatino text-gr-lg font-bold text-[#330040]"
        >
          <Headphones size={24} aria-hidden="true" />
          Audio messages
        </h2>
        {channelUrl && (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-nunito text-sm font-semibold text-[#65007f] underline underline-offset-4 hover:text-[#330040]"
          >
            Open the channel on Telegram
          </a>
        )}
      </div>

      {status === "loading" ? (
        <p className="font-nunito text-gray-500">Loading audio messages...</p>
      ) : status === "failed" ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 py-12 text-center font-nunito italic text-gray-500">
          Audio messages could not be loaded just now. Please try again shortly.
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 py-12 text-center font-nunito italic text-gray-500">
          No audio messages yet. Check back soon!
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const title = item.title || `Audio message${item.date ? ` · ${formatDate(item.date, { weekday: false })}` : ""}`;
              const isActive = activeId === item.id;
              const isPlaying = playingId === item.id;
              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-[#65007f]/10 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex items-center gap-4">
                    {item.streamable ? (
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-label={`${isPlaying ? "Pause" : "Play"} ${title}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#65007f] text-white transition hover:bg-[#330040] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#65007f] focus-visible:ring-offset-2"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
                      </button>
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#65007f]/10 text-[#65007f]">
                        <Headphones size={20} aria-hidden="true" />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      {item.date && (
                        <p className="font-nunito text-xs font-semibold uppercase tracking-[0.162em] text-[#9550a7]">
                          {formatDate(item.date)}
                        </p>
                      )}
                      <h3 className="truncate font-palatino text-gr-md font-bold text-[#330040]">{title}</h3>
                      <p className="font-nunito text-sm text-gray-600">
                        {[item.performer, formatDuration(item.duration)].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {!item.streamable && (
                      <a
                        href={item.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#65007f] px-3 py-1.5 font-nunito text-sm font-semibold text-[#65007f] transition hover:bg-[#65007f] hover:text-white"
                      >
                        Listen on Telegram
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  {isActive && (
                    <audio
                      ref={(node) => {
                        if (node) audioRefs.current.set(item.id, node);
                        else audioRefs.current.delete(item.id);
                      }}
                      src={apiUrl(`/telegram/audio/${item.id}/stream`)}
                      controls
                      autoPlay
                      preload="metadata"
                      onPlay={() => setPlayingId(item.id)}
                      onPause={() => setPlayingId((current) => (current === item.id ? null : current))}
                      onEnded={() => setPlayingId(null)}
                      className="mt-4 w-full"
                    >
                      Your browser cannot play this recording.{" "}
                      <a href={item.postUrl}>Listen on Telegram</a>.
                    </audio>
                  )}

                  {item.caption && item.caption !== item.title && (
                    <p className="mt-3 line-clamp-3 whitespace-pre-line font-nunito text-sm text-gray-600">
                      {item.caption}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {nextBefore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="self-center rounded-full border border-[#65007f] px-5 py-2 font-nunito text-sm font-semibold text-[#65007f] transition hover:bg-[#65007f] hover:text-white disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
