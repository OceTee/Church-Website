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
    throw new Error(
      "The server did not return a valid API response. The API function may not be deployed — check the Vercel Functions section."
    );
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Unable to sign in");
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
