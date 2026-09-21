import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { isAuthenticated } from "../lib/auth";

/**
 * Loads an admin collection, exposing the items plus a `refresh` function
 * that managers call after a create/delete. Redirects to the login page if
 * the session is no longer valid.
 */
export function useAdminCollection(path) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const reportError = useCallback(
    (err) => {
      if (!isAuthenticated()) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err?.message || "Something went wrong. Please try again.");
    },
    [navigate]
  );

  const fetchItems = useCallback(async () => {
    const response = await apiFetch(path);
    if (response.status === 401) {
      throw new Error("Your session expired. Please sign in again.");
    }
    if (!response.ok) {
      throw new Error("Failed to load content.");
    }
    return response.json();
  }, [path]);

  const refresh = useCallback(async () => {
    try {
      setItems(await fetchItems());
      setError("");
    } catch (err) {
      reportError(err);
    }
  }, [fetchItems, reportError]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchItems();
        if (active) {
          setItems(data);
          setError("");
        }
      } catch (err) {
        if (active) reportError(err);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [fetchItems, reportError]);

  return { items, error, refresh, reportError };
}
