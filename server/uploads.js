import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const uploadsRoot = path.join(projectRoot, "public", "uploads");

const IMAGE_MIME = /^image\/(jpeg|png|webp|gif|avif)$/;
const AUDIO_MIME = /^audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|aac|m4a)$/;

const CATEGORIES = {
    gallery: {
        directory: "gallery",
        field: "image",
        allowedMime: IMAGE_MIME,
        maxBytes: 8 * 1024 * 1024,
        label: "image",
    },
    events: {
        directory: "events",
        field: "flyer",
        allowedMime: IMAGE_MIME,
        maxBytes: 8 * 1024 * 1024,
        label: "flyer image",
    },
    sermons: {
        directory: "sermons",
        field: "audio",
        allowedMime: AUDIO_MIME,
        maxBytes: 80 * 1024 * 1024,
        label: "audio file",
    },
};

function ensureDirectory(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

function getCategory(category) {
    const config = CATEGORIES[category];
    if (!config) {
        throw new Error(`Unknown upload category: ${category}`);
    }
    return config;
}

function safeExtension(originalName) {
    const extension = path.extname(originalName || "").toLowerCase();
    return /^\.[a-z0-9]{1,8}$/.test(extension) ? extension : "";
}

export function createUpload(category) {
    const config = getCategory(category);
    const destination = path.join(uploadsRoot, config.directory);
    ensureDirectory(destination);

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, destination),
        filename: (req, file, cb) =>
            cb(null, `${crypto.randomUUID()}${safeExtension(file.originalname)}`),
    });

    return multer({
        storage,
        limits: { fileSize: config.maxBytes },
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

export function publicUploadPath(category, filename) {
    const config = getCategory(category);
    return `/uploads/${config.directory}/${filename}`;
}

export function resolvePublicFilePath(publicUrl) {
    if (!publicUrl || !publicUrl.startsWith("/uploads/")) return null;
    return path.join(projectRoot, "public", publicUrl);
}

export function removePublicFile(publicUrl) {
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
        return res.status(400).json({ error: err.message });
    }
    next(err);
}
