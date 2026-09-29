import { apiUrl } from "./urls";
import { getToken, clearToken } from "./auth";

export { apiUrl, assetUrl } from "./urls";

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(path), { ...options, headers });

  if (response.status === 401) {
    clearToken();
  }

  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return response.json();
}
