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

const AUDIO_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
    "audio/m4a",
    "audio/x-m4a",
];

const IMAGE_MIME = /^image\/(jpeg|png|webp|gif|avif)$/;
const AUDIO_MIME = /^audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|aac|m4a)$/;

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
    sermons: {
        directory: "sermons",
        field: "audio",
        allowedMime: AUDIO_MIME,
        allowedTypes: AUDIO_TYPES,
        maxBytes: 80 * 1024 * 1024,
        label: "audio file",
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

/**
 * Validates a file against a category's rules. Used both by the multer
 * pipeline and by the direct-to-blob upload route, so the limits are enforced
 * on the server no matter which path the browser takes.
 */
export function validateUploadMeta(category, meta = {}) {
    if (!isValidCategory(category)) {
        return "Unknown upload category.";
    }

    const config = getCategory(category);
    const { size, type } = meta;

    if (!config.allowedTypes.includes(type)) {
        return `Unsupported ${config.label} type.`;
    }
    if (typeof size === "number" && size > config.maxBytes) {
        return `${config.label} is larger than ${Math.round(config.maxBytes / (1024 * 1024))} MB.`;
    }
    return null;
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

export function uploadsRootPath() {
    return uploadsRoot;
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
    return path.join(projectRoot, "public", publicUrl);
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
        if (!/^https:\/\//i.test(publicUrl)) return false;
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
