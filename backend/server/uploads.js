import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const uploadsRoot = path.join(projectRoot, "public", "uploads");

const IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
];

const IMAGE_MIME = /^image\/(jpeg|png|webp|gif|avif)$/;

export const CATEGORIES = {
    gallery: {
        directory: "gallery",
        field: "image",
        allowedMime: IMAGE_MIME,
        allowedTypes: IMAGE_TYPES,
        maxBytes: 8 * 1024 * 1024,
        label: "image",
    },
    events: {
        directory: "events",
        field: "flyer",
        allowedMime: IMAGE_MIME,
        allowedTypes: IMAGE_TYPES,
        maxBytes: 8 * 1024 * 1024,
        label: "flyer image",
    },
    // Sermons are written text; the only upload is the speaker's photo.
    sermons: {
        directory: "sermons",
        field: "speakerImage",
        allowedMime: IMAGE_MIME,
        allowedTypes: IMAGE_TYPES,
        maxBytes: 8 * 1024 * 1024,
        label: "speaker photo",
    },
    birthdays: {
        directory: "birthdays",
        field: "photo",
        allowedMime: IMAGE_MIME,
        allowedTypes: IMAGE_TYPES,
        maxBytes: 8 * 1024 * 1024,
        label: "celebrant photo",
    },
};

export function isValidCategory(category) {
    return Object.hasOwn(CATEGORIES, category);
}

export function uploadLimits(category) {
    const config = getCategory(category);
    return {
        allowedContentTypes: config.allowedTypes,
        maximumSizeInBytes: config.maxBytes,
    };
}


/**
 * Vercel Blob is used whenever a read/write token is present (i.e. on Vercel).
 * Locally we fall back to writing into `public/uploads`, which keeps the two
 * process dev workflow (`npm run dev`) working with no external services.
 */
export const isBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Vercel's Hobby allowance includes 1 GB of Blob storage. Set
// BLOB_STORAGE_LIMIT_BYTES to the storage allowance the project should keep
// below when using a different plan or a custom safety ceiling.
const DEFAULT_BLOB_STORAGE_LIMIT_BYTES = 1_000_000_000;

export function blobStorageLimitBytes() {
    const configured = Number(process.env.BLOB_STORAGE_LIMIT_BYTES);
    return Number.isSafeInteger(configured) && configured > 0
        ? configured
        : DEFAULT_BLOB_STORAGE_LIMIT_BYTES;
}

/** Current stored bytes across the whole Vercel Blob store, including pages. */
export async function blobStorageUsageBytes() {
    if (!isBlobStorage) return 0;

    const { list } = await import("@vercel/blob");
    let total = 0;
    let cursor;

    do {
        const page = await list({
            limit: 1000,
            ...(cursor ? { cursor } : {}),
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        total += page.blobs.reduce((sum, blob) => sum + Number(blob.size || 0), 0);
        cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return total;
}

function getCategory(category) {
    const config = CATEGORIES[category];
    if (!config) {
        throw new Error(`Unknown upload category: ${category}`);
    }
    return config;
}

function ensureDirectory(directory) {
    try {
        fs.mkdirSync(directory, { recursive: true });
    } catch (error) {
        console.error(`[uploads] Could not create ${directory}`, error);
    }
}

export function safeExtension(originalName) {
    const extension = path.extname(originalName || "").toLowerCase();
    return /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : "";
}

function objectName(category, originalName) {
    return `${category}-${crypto.randomUUID()}${safeExtension(originalName)}`;
}

const BLOB_HOST = /\.blob\.vercel-storage\.com$/i;

/**
 * Whether a client-supplied media URL may be stored and later rendered: an
 * absolute http(s) URL, or a root-relative `/uploads/...` path from local
 * development. Anything else (`javascript:`, `data:`, free text, `..`) is
 * refused before it reaches the database.
 */
export function isSafeMediaUrl(value) {
    if (typeof value !== "string" || value.length > 2048 || /\s/.test(value)) return false;
    if (value.startsWith("/uploads/")) return !value.split("/").includes("..");
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

export function createUpload(category) {
    const config = getCategory(category);

    // Never touch the local disk when storing to Vercel Blob: on Vercel the
    // deployment bundle is read-only and `public/` is not even part of it, so
    // a mkdir here would throw and take the whole function down on cold start.
    if (!isBlobStorage) {
        ensureDirectory(path.join(uploadsRoot, config.directory));
    }

    const storage = isBlobStorage
        ? multer.memoryStorage()
        : multer.diskStorage({
              destination: (req, file, cb) =>
                  cb(null, path.join(uploadsRoot, config.directory)),
              filename: (req, file, cb) => cb(null, objectName(category, file.originalname)),
          });

    return multer({
        storage,
        limits: { fileSize: config.maxBytes, files: 1 },
        fileFilter: (req, file, cb) => {
            if (config.allowedMime.test(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", config.label));
            }
        },
    });
}

export function uploadField(category) {
    return getCategory(category).field;
}

export function ensureUploadsRoot() {
    if (!isBlobStorage) ensureDirectory(uploadsRoot);
}

/**
 * Persists an uploaded file with the active storage driver and returns the
 * public URL to store in the database. Local paths stay root-relative
 * (`/uploads/...`); blob uploads return absolute CDN URLs.
 */
export async function storeUpload(category, file) {
    const config = getCategory(category);

    if (isBlobStorage) {
        const { put } = await import("@vercel/blob");
        const { url } = await put(objectName(category, file.originalname), file.buffer, {
            access: "public",
            addRandomSuffix: false,
            contentType: file.mimetype,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return url;
    }

    const filename = file.filename || objectName(category, file.originalname);
    return `/uploads/${config.directory}/${filename}`;
}

function resolvePublicFilePath(publicUrl) {
    if (!publicUrl || !publicUrl.startsWith("/uploads/")) return null;
    // Resolve, then confirm the result is still inside the uploads folder, so
    // a stored `/uploads/../server/app.js` can never delete source files.
    const filePath = path.resolve(projectRoot, "public", `.${publicUrl}`);
    return filePath.startsWith(uploadsRoot + path.sep) ? filePath : null;
}

/** True only for media owned by this app's active storage driver. */
export function isManagedMediaUrl(publicUrl) {
    if (isBlobStorage) {
        try {
            return BLOB_HOST.test(new URL(publicUrl).hostname);
        } catch {
            return false;
        }
    }
    return Boolean(resolvePublicFilePath(publicUrl));
}

/**
 * Drops a freshly received file without storing it. Used when validation
 * fails after multer has already written the file to disk.
 */
export function discardUpload(file) {
    if (!file || !file.path) return;
    try {
        fs.unlinkSync(file.path);
    } catch (error) {
        console.error("[uploads] Failed to discard upload", error);
    }
}

export async function removeStoredFile(publicUrl) {
    if (!publicUrl) return false;

    if (isBlobStorage) {
        // Sermons are stored as YouTube or other external links. Only files in
        // our own blob store are ours to delete.
        let host;
        try {
            host = new URL(publicUrl).hostname;
        } catch {
            return false;
        }
        if (!BLOB_HOST.test(host)) return false;
        try {
            const { del } = await import("@vercel/blob");
            await del(publicUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            return true;
        } catch (error) {
            console.error("[uploads] Failed to delete blob", error);
            return false;
        }
    }

    const filePath = resolvePublicFilePath(publicUrl);
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File is too large." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ error: "That file type is not allowed here." });
        }
        if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE_COUNT") {
            return res.status(400).json({ error: "Please upload a single file." });
        }
        return res.status(400).json({ error: "That file could not be uploaded." });
    }
    next(err);
}
