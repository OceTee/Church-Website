const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const ASSET_BASE = import.meta.env.VITE_ASSET_URL ?? "";

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
