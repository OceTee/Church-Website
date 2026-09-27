const RAW_API_BASE = import.meta.env.VITE_API_URL;
const ASSET_BASE = (import.meta.env.VITE_ASSET_URL ?? "").replace(/\/+$/, "");

// Vite's dev and preview servers proxy /api to the backend on :5000, so the
// relative default is correct locally. It is NOT correct in production: the
// frontend is a different Vercel project, so a relative /api call would hit the
// SPA's own host and be answered by the index.html fallback instead of the API.
// vite.config.js fails the build when VITE_API_URL is missing in production, so
// reaching the branch below means the build already passed that check.
const API_BASE = (RAW_API_BASE ?? "/api").replace(/\/+$/, "");

export function apiUrl(path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${normalized}`;
}

export function assetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${ASSET_BASE}${normalized}`;
}

