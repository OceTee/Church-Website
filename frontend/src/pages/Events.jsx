import { useEffect, useState } from "react";
import Header from "../components/Header";
import EventCard from "../components/EventCard";
import { apiFetch } from "../lib/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      try {
        const response = await apiFetch("/events");
        const data = await response.json();
        if (active) setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <Header
          main="Events Calendar"
          sub="Upcoming services, programmes and gatherings at CAC Possibility Assembly."
        />

        {loading ? (
          <p className="font-inter text-gray-500 text-center py-12">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-16 text-center font-inter italic text-gray-500">
            No upcoming events right now. Check back soon!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                sub={event.description}
                date={event.date}
                time={event.time}
                flyerUrl={event.flyerUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}