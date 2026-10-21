import { useEffect, useState } from "react";
import Header from "../components/Header";
import MiniCalendar from "../components/MiniCalendar";
import { apiJson } from "../lib/api";
import { upcomingEvents } from "../lib/events";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      try {
        const data = await apiJson("/events");
        if (active) setEvents(upcomingEvents(Array.isArray(data) ? data : []));
      } catch (error) {
        console.error("Failed to fetch events:", error);
        if (active) setFailed(true);
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
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <Header
          main="Events Calendar"
          sub="Upcoming services, programmes and gatherings at CAC Possibility Assembly."
        />

        {loading ? (
          <p className="font-nunito text-gray-500">Loading events...</p>
        ) : failed ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-16 text-center font-nunito italic text-gray-500">
            Events could not be loaded just now. Please try again shortly.
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-16 text-center font-nunito italic text-gray-500">
            No upcoming events right now. Check back soon!
          </div>
        ) : (
          <div className="flex flex-col">
            {events.map((event) => (
              <MiniCalendar
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
