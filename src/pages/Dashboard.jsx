import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Header from "../components/Header";
import EventManager from "../components/admin/EventManager";
import GalleryManager from "../components/admin/GalleryManager";
import SermonManager from "../components/admin/SermonManager";
import { apiFetch } from "../lib/api";
import { isAuthenticated, logout } from "../lib/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [error, setError] = useState("");

  const handleError = useCallback(
    (err) => {
      if (!isAuthenticated()) {
        navigate("/admin/login", { replace: true });
        return;
      }
      setError(err?.message || "Something went wrong. Please try again.");
    },
    [navigate]
  );

  const loadContent = useCallback(async () => {
    try {
      const [photosResponse, eventsResponse, sermonsResponse] = await Promise.all([
        apiFetch("/gallery"),
        apiFetch("/events"),
        apiFetch("/sermons"),
      ]);

      if (!photosResponse.ok || !eventsResponse.ok || !sermonsResponse.ok) {
        throw new Error("Failed to load dashboard content.");
      }

      const [photosData, eventsData, sermonsData] = await Promise.all([
        photosResponse.json(),
        eventsResponse.json(),
        sermonsResponse.json(),
      ]);

      setPhotos(photosData);
      setEvents(eventsData);
      setSermons(sermonsData);
      setError("");
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSignOut = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pb-20 pt-32">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Header
            main="Admin Dashboard"
            sub="Manage sermons, events and gallery content."
          />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex shrink-0 items-center gap-2 rounded-full border border-[#65007f] px-4 py-2 font-inter text-sm text-[#65007f] transition hover:bg-[#65007f] hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 font-inter text-sm text-red-600">
            {error}
          </p>
        )}

        <EventManager events={events} onChanged={loadContent} onError={handleError} />
        <GalleryManager photos={photos} onChanged={loadContent} onError={handleError} />
        <SermonManager sermons={sermons} onChanged={loadContent} onError={handleError} />
      </div>
    </div>
  );
}
