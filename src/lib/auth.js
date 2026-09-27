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
  const response = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

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
