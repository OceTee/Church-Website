import { apiUrl } from "./urls";

const TOKEN_KEY = "cac_admin_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

let cachedAuthMode = null;

/**
 * Whether the server still requires a password. The admin panel asks the API
 * once and caches the answer, so it can skip the login screen when the server
 * runs with AUTH_DISABLED=true.
 */
export async function getAuthMode() {
  if (!cachedAuthMode) {
    try {
      const response = await fetch(apiUrl("/config"));
      const data = await response.json();
      cachedAuthMode = data.authMode || "required";
    } catch {
      // If the API cannot be reached, assume auth is required: the safe choice
      // is to show the login page rather than an open admin panel.
      cachedAuthMode = "required";
    }
  }
  return cachedAuthMode;
}

export async function login(password) {
  let response;
  try {
    response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Check your connection and try again."
    );
  }

  // A misconfigured deployment answers 503 with a specific reason, and a
  // missing API function answers with the SPA's HTML. Both are server problems
  // rather than a bad password, and must not be reported as "Incorrect
  // password" or the user will keep retrying the wrong thing.
  if (response.status === 503) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ||
        "The server is not fully configured yet. See the deployment notes."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    // A crashed serverless function answers with an HTML error page. Report the
    // status so the cause is identifiable from the login screen alone.
    throw new Error(
      `Server error (HTTP ${response.status}). The API did not respond correctly — ` +
        "check /api/health for the configuration problem."
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Unable to sign in (HTTP ${response.status})`);
  }

  const data = await response.json();
  setToken(data.token);
  return data.token;
}

/**
 * Changes the admin password. The server invalidates every existing session,
 * so it hands back a fresh token which is stored immediately — otherwise the
 * current session would be logged out of the panel it was just used from.
 */
export async function changePassword(currentPassword, newPassword) {
  const response = await fetch(apiUrl("/auth/password"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    clearToken();
    throw new Error(data.error || "Unable to change the password");
  }

  const data = await response.json();
  setToken(data.token);
  return data.token;
}

export function logout() {
  clearToken();
}
