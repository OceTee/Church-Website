import { useEffect, useState } from "react";
import Header from "../components/Header";
import MiniSermon from "../components/MiniSermon";
import { apiFetch } from "../lib/api";

export default function Sermons() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSermons = async () => {
      try {
        const response = await apiFetch("/sermons");
        const data = await response.json();
        if (active) setSermons(data);
      } catch (error) {
        console.error("Failed to fetch sermons:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSermons();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <Header
          main="Sermons"
          sub="Listen and catch up on past messages from our services."
        />

        {loading ? (
          <p className="font-inter text-gray-500">Loading sermons...</p>
        ) : sermons.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-inter italic text-gray-500">
            No sermons have been uploaded yet. Check back later!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sermons.map((sermon) => (
              <MiniSermon
                key={sermon.id}
                type="Audio Message"
                title={sermon.title}
                date={sermon.date}
                audioUrl={sermon.audioUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
