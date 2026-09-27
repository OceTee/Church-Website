import { apiJson, apiUrl } from "./api";

let cachedConfig = null;

/**
 * The API advertises which upload transport to use. On Vercel a serverless
 * function can only accept a 4.5 MB request body, so large files (sermon
 * audio) must be uploaded straight to Vercel Blob from the browser and only
 * the resulting URL is sent to the API. Locally the API accepts multipart
 * form data directly, and the blob client is never even loaded.
 */
export async function getUploadConfig() {
    if (!cachedConfig) {
        cachedConfig = await apiJson("/config").catch(() => ({ uploadMode: "server" }));
    }
    return cachedConfig;
}

async function uploadDirect(category, file) {
    const { grant } = await apiJson("/uploads/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
    });

    const { upload } = await import("@vercel/blob/client");

    const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `${apiUrl("/blob-upload")}?grant=${encodeURIComponent(grant)}`,
        clientPayload: {
            category,
            meta: { name: file.name, type: file.type, size: file.size },
        },
    });

    return blob.url;
}

function urlFieldFor(category) {
    return category === "gallery" ? "imageUrl" : `${category === "events" ? "flyer" : "audio"}Url`;
}

/**
 * Uploads a file and creates its database record, then returns the record.
 * `fields` holds the remaining form values (title, date, ...).
 */
export async function createWithUpload({ category, file, fields = {} }) {
    const { uploadMode } = await getUploadConfig();
    const urlField = urlFieldFor(category);

    if (file && uploadMode === "direct") {
        const url = await uploadDirect(category, file);
        return apiJson(`/${category}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...fields, [urlField]: url }),
        });
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) body.append(key, value);
    }

    if (category === "gallery") body.append("image", file);
    else if (category === "events") {
        if (file) body.append("flyer", file);
    } else body.append("audio", file);

    return apiJson(`/${category}`, { method: "POST", body });
}
