import { apiJson, apiUrl } from "./api";

let cachedConfig = null;

/**
 * The API advertises which upload transport to use. On Vercel a serverless
 * function can only accept a 4.5 MB request body, so files are uploaded
 * straight to Vercel Blob from the browser and only the resulting URL is sent
 * to the API. Locally the API accepts multipart form data directly, and the
 * blob client is never even loaded.
 */
export async function getUploadConfig() {
    if (!cachedConfig) {
        cachedConfig = await apiJson("/config").catch(() => ({ uploadMode: "server" }));
    }
    return cachedConfig;
}

// For each category: the multipart field the API reads the file from, and the
// JSON field that carries the URL after a direct-to-blob upload.
const UPLOAD_FIELDS = {
    gallery: { file: "image", url: "imageUrl" },
    events: { file: "flyer", url: "flyerUrl" },
    sermons: { file: "speakerImage", url: "speakerImageUrl" },
};

let galleryCleanupQueue = Promise.resolve();

function cleanupOldestGalleryPhoto() {
    const request = galleryCleanupQueue.then(() =>
        apiJson("/gallery/cleanup-oldest", { method: "POST" })
    );
    galleryCleanupQueue = request.catch(() => {});
    return request;
}

async function uploadDirect(category, file) {
    const { grant } = await apiJson("/uploads/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
    });

    const { upload } = await import("@vercel/blob/client");

    // The server adds a random suffix to the pathname, so two photos that are
    // both called IMG_0001.jpg do not collide.
    const blob = await upload(`${category}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: `${apiUrl("/blob-upload")}?grant=${encodeURIComponent(grant)}`,
        // The blob client's contract is a string; the server parses it.
        clientPayload: JSON.stringify({ category }),
    });

    return blob.url;
}

function isBlobCapacityError(error) {
    const details = [error?.name, error?.code, error?.message, error?.cause?.message]
        .filter(Boolean)
        .join(" ");
    return /BlobStoreSuspendedError|quota|no space left|storage.{0,30}(full|limit|exceed)|store.{0,30}(full|limit|exceed)|(?:full|limit|exceed).{0,30}(?:blob|storage|store)|usage limit/i.test(
        details
    );
}

async function uploadGalleryDirectWithRecovery(file) {
    while (true) {
        await apiJson("/gallery/prepare-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sizeBytes: file.size }),
        });

        try {
            return await uploadDirect("gallery", file);
        } catch (error) {
            if (!isBlobCapacityError(error)) throw error;

            try {
                await cleanupOldestGalleryPhoto();
            } catch (cleanupError) {
                throw new Error(
                    `${error.message || "Gallery storage is full."} Automatic cleanup could not make room: ${cleanupError.message}`,
                    { cause: cleanupError }
                );
            }
        }
    }
}

/**
 * Uploads a file (if any) and creates its database record, then returns the
 * record. `fields` holds the remaining form values (title, date, ...).
 */
export async function createWithUpload({ category, file, fields = {} }) {
    const { uploadMode } = await getUploadConfig();
    const names = UPLOAD_FIELDS[category];

    if (file && uploadMode === "direct") {
        const url =
            category === "gallery"
                ? await uploadGalleryDirectWithRecovery(file)
                : await uploadDirect(category, file);
        return apiJson(`/${category}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...fields, [names.url]: url }),
        });
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) body.append(key, value);
    }
    if (file) body.append(names.file, file);

    return apiJson(`/${category}`, { method: "POST", body });
}
