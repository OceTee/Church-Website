import { useCallback, useEffect, useState } from "react";
import { AudioLines, CheckCircle2, ExternalLink, Loader2, Trash2, XCircle } from "lucide-react";
import { apiJson } from "../../lib/api";
import { formatDate } from "../../lib/dates";
import { labelClass, inputClass, primaryButtonClass } from "./fieldStyles";

const POLL_MS = 30000;

function clock(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`;
}

/** SQLite's CURRENT_TIMESTAMP is UTC without a zone: "2026-11-08 22:37:24". */
function parseUtc(value) {
  return value ? new Date(`${value.replace(" ", "T")}Z`) : null;
}

function timeOf(value) {
  const date = parseUtc(value);
  return date ? date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
}

function minutesSince(value) {
  const date = parseUtc(value);
  return date ? (Date.now() - date.getTime()) / 60000 : 0;
}

/**
 * Starts sermon transcriptions, which run on GitHub's servers (see
 * .github/workflows/transcribe.yml), and lists them. A finished transcript is
 * loaded into the sermon form for the admin to review; adding the speaker,
 * their photo and publishing stay with the admin.
 */
export default function TranscribePanel({ hasBody, onLoad, onError }) {
  const [recordings, setRecordings] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [jobs, setJobs] = useState([]);
  const [configured, setConfigured] = useState(true);
  const [starting, setStarting] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [notice, setNotice] = useState("");

  const loadRecordings = useCallback(async (before) => {
    try {
      const data = await apiJson(`/telegram/audio${before ? `?before=${before}` : ""}`);
      const playable = (data.items || []).filter((item) => item.streamable);
      setRecordings((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...playable.filter((item) => !seen.has(item.id))];
      });
      setNextBefore(data.nextBefore || null);
    } catch (error) {
      onError(error);
    }
  }, [onError]);

  const loadJobs = useCallback(async () => {
    try {
      const data = await apiJson("/transcriptions");
      setJobs(data.jobs || []);
      setConfigured(Boolean(data.configured));
    } catch (error) {
      onError(error);
    }
  }, [onError]);

  useEffect(() => {
    queueMicrotask(() => {
      loadRecordings();
      loadJobs();
    });
  }, [loadRecordings, loadJobs]);

  // Check on unfinished jobs every 30 seconds while the page is visible.
  const anyActive = jobs.some((job) => job.status === "queued" || job.status === "running");
  useEffect(() => {
    if (!anyActive) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadJobs();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [anyActive, loadJobs]);

  const selected = recordings.find((item) => String(item.id) === selectedId);

  const start = async () => {
    if (!selected) return;
    setStarting(true);
    setNotice("");
    try {
      await apiJson("/transcriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioId: selected.id, title: selected.title, date: selected.date }),
      });
      setSelectedId("");
      setNotice("Started. You can close this page; the transcript will be waiting here when it's ready.");
      await loadJobs();
    } catch (error) {
      onError(error);
      await loadJobs();
    } finally {
      setStarting(false);
    }
  };

  const loadIntoForm = async (job) => {
    if (hasBody && !window.confirm("Replace the text already in the sermon form with this transcript?")) return;
    setLoadingId(job.id);
    try {
      const full = await apiJson(`/transcriptions/${job.id}`);
      onLoad({ title: full.title || "", date: full.date || "", text: full.text || "" });
      setNotice(
        "Transcript loaded into the form below. Read it through and correct it, then add the speaker's name and photo before publishing."
      );
      document.getElementById("sermon-body")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      onError(error);
    } finally {
      setLoadingId(null);
    }
  };

  const remove = async (job) => {
    const unfinished = job.status === "queued" || job.status === "running";
    const message = unfinished
      ? `Remove "${job.title || "this transcription"}" from the list? The GitHub job keeps running, but its result will be discarded.`
      : `Remove "${job.title || "this transcription"}" from the list?`;
    if (!window.confirm(message)) return;
    try {
      await apiJson(`/transcriptions/${job.id}`, { method: "DELETE" });
      await loadJobs();
    } catch (error) {
      onError(error);
    }
  };

  const busyAudioIds = new Set(
    jobs.filter((job) => job.status === "queued" || job.status === "running").map((job) => job.audioId)
  );

  return (
    <div className="mb-8 rounded-xl border border-[#65007f]/20 bg-[#65007f]/[0.03] p-4 sm:p-5">
      <h3 className="mb-1 flex items-center gap-2 font-nunito font-semibold text-[#330040]">
        <AudioLines size={18} aria-hidden="true" />
        Transcribe a Telegram audio message
      </h3>
      <p className="mb-4 font-nunito text-sm text-gray-600">
        Whisper turns the recording into draft text on GitHub&apos;s servers, for free. It usually takes
        30–90 minutes, and you don&apos;t need to keep this page open. It may mishear names, scripture
        references and Yoruba, so read the text through before publishing.
      </p>

      {!configured ? (
        <p className="font-nunito text-sm text-red-600">
          Transcription is not set up on the server yet (GITHUB_DISPATCH_TOKEN and TRANSCRIBE_CALLBACK_SECRET).
        </p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className={labelClass} htmlFor="transcribe-audio">
              Recording
            </label>
            <select
              id="transcribe-audio"
              className={inputClass}
              value={selectedId}
              disabled={starting}
              onChange={(event) => {
                if (event.target.value === "more") {
                  loadRecordings(nextBefore);
                  return;
                }
                setSelectedId(event.target.value);
              }}
            >
              <option value="">{recordings.length ? "Choose a recording..." : "Loading recordings..."}</option>
              {recordings.map((item) => (
                <option key={item.id} value={item.id} disabled={busyAudioIds.has(item.id)}>
                  {[formatDate(item.date, { weekday: false }), item.title || "Audio message", clock(item.duration)]
                    .filter(Boolean)
                    .join(" · ")}
                  {busyAudioIds.has(item.id) ? " (transcribing)" : ""}
                </option>
              ))}
              {nextBefore && <option value="more">Load older recordings...</option>}
            </select>
          </div>
          <button type="button" onClick={start} disabled={!selected || starting} className={primaryButtonClass}>
            {starting ? "Starting..." : "Transcribe"}
          </button>
        </div>
      )}

      {notice && (
        <p className="mt-3 font-nunito text-sm text-[#65007f]" role="status">
          {notice}
        </p>
      )}

      {jobs.length > 0 && (
        <ul className="mt-5 flex flex-col gap-2">
          {jobs.map((job) => {
            const stuck = job.status === "queued" && minutesSince(job.updatedAt) > 20;
            return (
              <li
                key={job.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-nunito text-sm font-semibold text-[#330040]">
                    {job.title || `Audio message ${job.audioId}`}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 font-nunito text-xs text-gray-500">
                    {job.status === "queued" && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Loader2 size={12} className="animate-spin" /> Waiting for GitHub to start
                      </span>
                    )}
                    {job.status === "running" && (
                      <span className="inline-flex items-center gap-1 text-[#65007f]">
                        <Loader2 size={12} className="animate-spin" /> Transcribing
                        {job.progress ? ` · ${Math.round(job.progress * 100)}%` : ""}
                      </span>
                    )}
                    {job.status === "done" && (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    )}
                    {job.status === "failed" && (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <XCircle size={12} /> Failed
                      </span>
                    )}
                    <span>started {timeOf(job.createdAt)}</span>
                    {job.runUrl && (
                      <a
                        href={job.runUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[#65007f] underline-offset-2 hover:underline"
                      >
                        GitHub log <ExternalLink size={11} />
                      </a>
                    )}
                  </p>
                  {job.status === "failed" && job.error && (
                    <p className="mt-1 font-nunito text-xs text-red-700">{job.error}</p>
                  )}
                  {stuck && (
                    <p className="mt-1 font-nunito text-xs text-amber-700">
                      This hasn&apos;t started after 20 minutes. Check the Actions tab of the GitHub repository.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {job.status === "done" && (
                    <button
                      type="button"
                      onClick={() => loadIntoForm(job)}
                      disabled={loadingId === job.id}
                      className="rounded-lg bg-[#65007f] px-3 py-2 font-nunito text-sm font-semibold text-white transition hover:bg-[#330040] disabled:opacity-60"
                    >
                      {loadingId === job.id ? "Loading..." : "Load into form"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(job)}
                    aria-label={`Remove ${job.title || "transcription"}`}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
