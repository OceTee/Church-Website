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

/**
 * Uploads a file (if any) and creates its database record, then returns the
 * record. `fields` holds the remaining form values (title, date, ...).
 */
export async function createWithUpload({ category, file, fields = {} }) {
    const { uploadMode } = await getUploadConfig();
    const names = UPLOAD_FIELDS[category];

    if (file && uploadMode === "direct") {
        const url = await uploadDirect(category, file);
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
