import { apiJson } from "./api";
import { createWithUpload } from "./uploads";

/**
 * Sermons are written text: a title, the speaker's name and photo, the date
 * preached, and a body.
 *
 * The body is plain text with three light conventions, so it can be typed
 * straight into the admin form:
 *   - a blank line starts a new paragraph
 *   - a line starting with "## " is a section heading
 *   - lines starting with "> " are a scripture quotation
 * It is rendered as React elements, never as HTML, so nothing typed into it
 * can inject markup.
 */

export function fetchSermons() {
  return apiJson("/sermons");
}

export function fetchSermon(id) {
  return apiJson(`/sermons/${encodeURIComponent(id)}`);
}

export function createSermon({ title, speaker, date, body, photo }) {
  return createWithUpload({
    category: "sermons",
    file: photo,
    fields: { title, speaker, date, body },
  });
}

/** Splits a sermon body into heading, quote and paragraph blocks. */
export function parseSermonBody(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith("## ")) {
        return { type: "heading", text: chunk.slice(3).trim() };
      }
      const lines = chunk.split("\n");
      if (lines.every((line) => line.startsWith(">"))) {
        return { type: "quote", text: lines.map((line) => line.replace(/^>\s?/, "")).join("\n") };
      }
      return { type: "paragraph", text: chunk };
    });
}

/** "Pastor John Ade" -> "JA", for when there is no photo. */
export function initials(name) {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
