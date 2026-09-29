import { apiJson, assetUrl } from "./api";

/**
 * Sermons are stored as a link, not as an uploaded file.
 *
 * A recording is tens of megabytes, and the free file-storage tier is sized for
 * images. Churches already publish every sermon to YouTube, so the database
 * holds a URL and the audio is never stored on our infrastructure.
 */

const AUDIO_FILE = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|weba|mp4|m4v|webm)$/i;
const YOUTUBE_HOST = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;
const VIMEO_HOST = /(^|\.)vimeo\.com$/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** Pulls the video id out of the many shapes a YouTube link comes in. */
function youtubeId(url) {
  if (url.hostname.toLowerCase().endsWith("youtu.be")) {
    return url.pathname.slice(1).split("/")[0] || null;
  }
  const path = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
  if (path) return path[1];
  return url.searchParams.get("v") || null;
}

/**
 * Classifies a stored sermon URL into something renderable.
 * Returns null when there is nothing usable.
 */
export function parseSermonSource(rawUrl) {
  const value = String(rawUrl ?? "").trim();
  if (!value) return null;

  // A relative path is a file the API serves itself, from before sermons
  // became links. Keep rendering those rather than treating them as broken.
  // This branch must stay strict: it is also the render path for whatever is
  // in the database, so free text and `javascript:`/`data:` URLs have to be
  // rejected rather than handed to <audio src>. A leading `//` is rejected
  // too, since that is a protocol-relative URL, not a path.
  if (!/^https?:\/\//i.test(value)) {
    if (ANY_SCHEME.test(value) || !/^\/(?!\/)/.test(value) || /\s/.test(value)) {
      return null;
    }
    return { kind: "audio", src: assetUrl(value) };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (YOUTUBE_HOST.test(url.hostname)) {
    const id = youtubeId(url);
    if (id) {
      return {
        kind: "embed",
        provider: "YouTube",
        // nocookie is the privacy-preserving host: it drops tracking cookies
        // until the visitor actually presses play.
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`,
        href: value,
      };
    }
  }

  if (VIMEO_HOST.test(url.hostname)) {
    const match = url.pathname.match(/(\d+)/);
    if (match) {
      return {
        kind: "embed",
        provider: "Vimeo",
        src: `https://player.vimeo.com/video/${match[1]}`,
        href: value,
      };
    }
  }

  // A direct audio file, wherever it is hosted.
  if (AUDIO_FILE.test(url.pathname)) {
    return { kind: "audio", src: value };
  }

  return { kind: "link", href: value };
}

/** The admin form only accepts absolute http(s) links. */
export function isValidSermonUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Human-readable hint for the form, so a typo is visible before saving. */
export function describeSermonSource(value) {
  const source = parseSermonSource(value);
  if (!source) return null;
  if (source.kind === "embed") return source.provider;
  if (source.kind === "audio") return "direct audio file";
  return "web page";
}

export async function createSermon({ title, date, url }) {
  return apiJson("/sermons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, date, audioUrl: String(url).trim() }),
  });
}
