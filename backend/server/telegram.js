// Telegram channels as content sources.
//
// Two public channels feed the site:
//   - the gallery channel's photos, read from Telegram's public web preview
//     (https://t.me/s/<channel>), which carries direct image URLs;
//   - the sermon channel's audio, which that preview only lists ("Audio", no
//     file). Those posts are listed from the preview and then streamed over
//     MTProto as a bot. MTProto has no 20 MB cap (the Bot HTTP API does), so
//     long recordings of 50 MB+ play, and they are served in byte ranges so
//     the browser streams them instead of downloading the whole file first.
//
// Streaming needs TELEGRAM_API_ID, TELEGRAM_API_HASH and TELEGRAM_BOT_TOKEN
// (see .env.example). Without them the audio list still works and each item
// links to its Telegram post instead of playing here.

import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import bigInt from "big-integer";
import { query, run } from "./db.js";

export const GALLERY_CHANNEL = process.env.TELEGRAM_GALLERY_CHANNEL || "PossibilityAssemblyMedia";
export const AUDIO_CHANNEL = process.env.TELEGRAM_AUDIO_CHANNEL || "PossibilityAssemblyNation";

const SITE_TIME_ZONE = "Africa/Lagos";
const PAGE_CACHE_MS = 10 * 60 * 1000;
const META_CACHE_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;

// upload.getFile limits: a request may be at most 512 KB, and an offset that
// is a multiple of 512 KB never crosses the 1 MB boundary Telegram forbids.
const PART_SIZE = 512 * 1024;
// Bytes served per range response. Browsers accept a shorter 206 than they
// asked for and request the next range, so a long recording plays as a chain
// of small requests, each well inside a serverless function's limits.
export const STREAM_CHUNK_BYTES = 4 * PART_SIZE;

const SESSION_KEY = "telegram_session";

// ---------------------------------------------------------------------------
// Public web preview scraping
// ---------------------------------------------------------------------------

const pageCache = new Map();

function decodeEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&");
}

function htmlToText(html) {
    return decodeEntities(
        html
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
    ).trim();
}

/** "2026-11-01T11:16:01+00:00" -> "2026-11-01", as the date in Ibadan. */
export function localDate(isoDateTime) {
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-CA", { timeZone: SITE_TIME_ZONE });
}

/**
 * Parses one page of https://t.me/s/<channel> into posts, oldest first (the
 * order Telegram renders them). Exported for tests.
 */
export function parseChannelPage(html, channel) {
    const posts = [];
    const blocks = html.split('<div class="tgme_widget_message_wrap').slice(1);
    const postPattern = new RegExp(`data-post="${channel}/(\\d+)"`, "i");

    for (const block of blocks) {
        const idMatch = postPattern.exec(block);
        if (!idMatch) continue;
        const id = Number(idMatch[1]);
        const datetime = /<time datetime="([^"]+)"/.exec(block)?.[1] || null;
        const textHtml = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/.exec(block)?.[1];

        const photos = [];
        for (const [tag] of block.matchAll(/<a class="tgme_widget_message_photo_wrap[^>]*>/g)) {
            const imageUrl = /background-image:url\('([^']+)'\)/.exec(tag)?.[1];
            if (!imageUrl) continue;
            const href = /href="([^"]+)"/.exec(tag)?.[1] || "";
            const photoId = Number(/\/(\d+)(?:\?|$)/.exec(href)?.[1]) || id;
            photos.push({ id: photoId, imageUrl: decodeEntities(imageUrl) });
        }

        posts.push({
            id,
            datetime,
            date: datetime ? localDate(datetime) : null,
            text: textHtml ? htmlToText(textHtml) : "",
            photos,
            isAudio: /tgme_widget_message_document_icon[^"]*\baudio\b/.test(block) ||
                /tgme_widget_message_voice/.test(block),
        });
    }

    const before = /data-before="(\d+)"/.exec(html)?.[1];
    return { posts, nextBefore: before ? Number(before) : null };
}

async function fetchChannelPage(channel, before) {
    const key = `${channel}:${before ?? "latest"}`;
    const cached = pageCache.get(key);
    if (cached && Date.now() - cached.at < PAGE_CACHE_MS) return cached.value;

    const url = new URL(`https://t.me/s/${encodeURIComponent(channel)}`);
    if (before) url.searchParams.set("before", String(before));
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ChurchWebsite/1.0)" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Telegram preview returned ${response.status} for ${channel}`);
    const value = parseChannelPage(await response.text(), channel);

    pageCache.set(key, { at: Date.now(), value });
    if (pageCache.size > 200) pageCache.delete(pageCache.keys().next().value);
    return value;
}

/**
 * Walks back through the channel from `before` (or the newest post) until at
 * least `minItems` posts pass `pick`, or `maxPages` pages have been read.
 * Returns the picked posts newest first, plus the cursor for the next call.
 */
async function collectPosts(channel, { before, minItems, maxPages, pick }) {
    const picked = [];
    let cursor = before ?? null;
    let nextBefore = null;

    for (let page = 0; page < maxPages; page += 1) {
        const { posts, nextBefore: older } = await fetchChannelPage(channel, cursor);
        const fresh = posts.filter((post) => (cursor ? post.id < cursor : true) && pick(post));
        picked.push(...fresh.reverse());
        nextBefore = older;
        if (!older || picked.length >= minItems) break;
        cursor = older;
    }

    return { posts: picked, nextBefore };
}

export async function listGalleryPhotos(before) {
    const { posts, nextBefore } = await collectPosts(GALLERY_CHANNEL, {
        before,
        minItems: 24,
        maxPages: 8,
        pick: (post) => post.photos.length > 0,
    });

    const photos = posts.flatMap((post) =>
        post.photos.map((photo, index) => ({
            id: `${post.id}-${index}`,
            imageUrl: photo.imageUrl,
            date: post.date,
            caption: post.text,
            postUrl: `https://t.me/${GALLERY_CHANNEL}/${photo.id}`,
        }))
    );
    return { photos, nextBefore, channelUrl: `https://t.me/${GALLERY_CHANNEL}` };
}

// ---------------------------------------------------------------------------
// MTProto client (bot account)
// ---------------------------------------------------------------------------

export function isStreamingConfigured() {
    return Boolean(
        process.env.TELEGRAM_API_ID && process.env.TELEGRAM_API_HASH && process.env.TELEGRAM_BOT_TOKEN
    );
}

let clientPromise = null;

async function loadSavedSession() {
    try {
        const rows = await query("SELECT value FROM app_meta WHERE key = ?", [SESSION_KEY]);
        return rows[0]?.value || "";
    } catch {
        return "";
    }
}

async function saveSession(value) {
    try {
        await run(
            "INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [SESSION_KEY, value]
        );
    } catch (error) {
        console.warn("[telegram] Could not save the session:", error.message);
    }
}

/**
 * One connected client per server instance. The login session is kept in the
 * database so cold starts reuse it: logging a bot in afresh on every start
 * would quickly hit Telegram's flood limits.
 */
function getClient() {
    if (!clientPromise) {
        clientPromise = (async () => {
            const session = new StringSession(await loadSavedSession());
            const client = new TelegramClient(
                session,
                Number(process.env.TELEGRAM_API_ID),
                process.env.TELEGRAM_API_HASH,
                { connectionRetries: 3, autoReconnect: true }
            );
            client.setLogLevel("error");
            await client.start({ botAuthToken: process.env.TELEGRAM_BOT_TOKEN });
            const saved = client.session.save();
            if (saved) await saveSession(saved);
            return client;
        })().catch((error) => {
            clientPromise = null;
            throw error;
        });
    }
    return clientPromise;
}

const messageCache = new Map();

function audioDetails(message) {
    const document = message?.media?.document;
    if (!(document instanceof Api.Document)) return null;
    const audio = document.attributes.find((attr) => attr instanceof Api.DocumentAttributeAudio);
    const fileName = document.attributes.find((attr) => attr instanceof Api.DocumentAttributeFilename)?.fileName;
    const mimeType = document.mimeType || "";
    if (!audio && !mimeType.startsWith("audio/")) return null;

    return {
        document,
        mimeType: mimeType || "audio/mpeg",
        size: Number(document.size),
        title: audio?.title || (fileName ? fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ") : ""),
        performer: audio?.performer || "",
        duration: audio?.duration || null,
        caption: message.message || "",
    };
}

/** Fetches audio details for the given post ids, from cache where fresh. */
async function getAudioMessages(ids, { refresh = false } = {}) {
    const result = new Map();
    const missing = [];
    for (const id of ids) {
        const cached = messageCache.get(id);
        if (!refresh && cached && Date.now() - cached.at < META_CACHE_MS) result.set(id, cached.value);
        else missing.push(id);
    }

    if (missing.length > 0) {
        const client = await getClient();
        const messages = await client.getMessages(AUDIO_CHANNEL, { ids: missing });
        missing.forEach((id, index) => {
            const value = audioDetails(messages[index]);
            messageCache.set(id, { at: Date.now(), value });
            result.set(id, value);
        });
        if (messageCache.size > 500) messageCache.delete(messageCache.keys().next().value);
    }
    return result;
}

export async function listAudioMessages(before) {
    const { posts, nextBefore } = await collectPosts(AUDIO_CHANNEL, {
        before,
        minItems: 12,
        maxPages: 4,
        pick: (post) => post.isAudio,
    });

    const streaming = isStreamingConfigured();
    let details = new Map();
    if (streaming && posts.length > 0) {
        try {
            details = await getAudioMessages(posts.map((post) => post.id));
        } catch (error) {
            console.error("[telegram] Could not read audio details:", error);
        }
    }

    const items = posts.map((post) => {
        const detail = details.get(post.id);
        const caption = detail?.caption || post.text;
        return {
            id: post.id,
            date: post.date,
            title: detail?.title || caption.split("\n")[0].slice(0, 140) || "",
            performer: detail?.performer || "",
            caption,
            duration: detail?.duration ?? null,
            size: detail?.size ?? null,
            postUrl: `https://t.me/${AUDIO_CHANNEL}/${post.id}`,
            streamable: Boolean(detail),
        };
    });

    return { items, nextBefore, streaming, channelUrl: `https://t.me/${AUDIO_CHANNEL}` };
}

/** Details needed to answer a range request, or null if the post has no audio. */
export async function getAudioFile(id) {
    const details = await getAudioMessages([id]);
    const detail = details.get(id);
    return detail ? { size: detail.size, mimeType: detail.mimeType } : null;
}

function isFileReferenceError(error) {
    return /FILE_REFERENCE_(EXPIRED|INVALID)/.test(error?.errorMessage || error?.message || "");
}

/**
 * Writes bytes [start, end] (inclusive) of the post's audio to `onChunk`, in
 * order. Stops early when `signal` aborts (the listener went away).
 */
export async function streamAudioRange(id, start, end, onChunk, signal) {
    const client = await getClient();
    let detail = (await getAudioMessages([id])).get(id);
    if (!detail) throw new Error("Not an audio post");

    let offset = Math.floor(start / PART_SIZE) * PART_SIZE;
    let dcId = detail.document.dcId;
    let refreshed = false;

    while (offset <= end && !signal?.aborted) {
        const document = detail.document;
        const request = new Api.upload.GetFile({
            location: new Api.InputDocumentFileLocation({
                id: document.id,
                accessHash: document.accessHash,
                fileReference: document.fileReference,
                thumbSize: "",
            }),
            offset: bigInt(offset),
            limit: PART_SIZE,
            precise: false,
        });

        let result;
        try {
            const sender = await client.getSender(dcId);
            result = await client.invokeWithSender(request, sender);
        } catch (error) {
            if (error?.newDc) {
                dcId = error.newDc;
                continue;
            }
            if (isFileReferenceError(error) && !refreshed) {
                // File references expire after a while; a fresh copy of the
                // message carries a new one.
                refreshed = true;
                detail = (await getAudioMessages([id], { refresh: true })).get(id);
                if (!detail) throw error;
                continue;
            }
            throw error;
        }

        const bytes = result.bytes;
        if (!bytes || bytes.length === 0) break;
        const sliceStart = Math.max(start - offset, 0);
        const sliceEnd = Math.min(end - offset + 1, bytes.length);
        if (sliceEnd > sliceStart) await onChunk(bytes.subarray(sliceStart, sliceEnd));
        if (bytes.length < PART_SIZE) break;
        offset += PART_SIZE;
    }
}
