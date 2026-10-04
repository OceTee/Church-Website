import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightToLine } from "lucide-react";
import Hero from "../components/Hero";
import ServiceSchedule from "../components/ServiceSchedule";
import MiniSermon from "../components/MiniSermon";
import MiniCalendar from "../components/MiniCalendar";
import { apiFetch } from "../lib/api";

const EMPTY_MESSAGE =
  "rounded-xl border border-gray-200 bg-gray-50 py-8 text-center font-inter italic text-gray-500";

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const [eventsResponse, sermonsResponse] = await Promise.all([
          apiFetch("/events"),
          apiFetch("/sermons"),
        ]);
        const [eventsData, sermonsData] = await Promise.all([
          eventsResponse.json(),
          sermonsResponse.json(),
        ]);

        if (!active) return;
        setEvents(eventsData);
        setSermons(sermonsData.slice(0, 3));
      } catch (error) {
        console.error("Failed to load landing content:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadContent();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Hero events={events} />

      <div className="w-[90%] max-w-5xl">
        <ServiceSchedule />
      </div>

      <section className="w-[90%] max-w-5xl pb-20 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-playfair text-2xl font-bold text-[#330040] md:text-3xl">
            Recent Sermons
          </h2>
          <Link
            to="/sermons"
            className="flex items-center gap-2 font-inter text-sm text-[#65007f] transition duration-150 hover:scale-105 md:text-base"
          >
            View all <ArrowRightToLine size={18} />
          </Link>
        </div>

        {loading ? (
          <p className="font-inter text-gray-500">Loading...</p>
        ) : sermons.length === 0 ? (
          <p className={EMPTY_MESSAGE}>No recent sermons available.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
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

        <div className="mb-6 mt-14 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-playfair text-2xl font-bold text-[#330040] md:text-3xl">
            Upcoming Events
          </h2>
          <Link
            to="/events"
            className="font-inter text-sm text-[#65007f] transition duration-150 hover:scale-105 md:text-base"
          >
            Full calendar
          </Link>
        </div>

        {loading ? (
          <p className="font-inter text-gray-500">Loading...</p>
        ) : events.length === 0 ? (
          <p className={EMPTY_MESSAGE}>No upcoming events right now.</p>
        ) : (
          <div className="flex flex-col">
            {events.map((event) => (
              <MiniCalendar
                key={event.id}
                title={event.title}
                sub={event.description}
                date={event.date}
                time={event.time}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
