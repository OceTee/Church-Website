import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightToLine } from "lucide-react";
import Hero from "../components/Hero";
import ServiceSchedule from "../components/ServiceSchedule";
import SermonCard from "../components/SermonCard";
import MiniCalendar from "../components/MiniCalendar";
import BirthdayCelebration from "../components/BirthdayCelebration";
import { apiJson } from "../lib/api";
import { upcomingEvents } from "../lib/events";

const EMPTY_MESSAGE =
  "rounded-xl border border-gray-200 bg-gray-50 py-8 text-center font-nunito italic text-gray-500";

const LANDING_EVENT_COUNT = 3;

/** The list from a settled request, or [] if it failed or was not a list. */
function listFrom(result, label) {
  if (result.status === "fulfilled" && Array.isArray(result.value)) return result.value;
  if (result.status === "rejected") console.error(`Failed to load ${label}:`, result.reason);
  return [];
}

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Loaded independently, so one failing request still shows the other.
    const loadContent = async () => {
      const [eventsResult, sermonsResult] = await Promise.allSettled([
        apiJson("/events"),
        apiJson("/sermons"),
      ]);

      if (!active) return;
      setEvents(upcomingEvents(listFrom(eventsResult, "events")));
      setSermons(listFrom(sermonsResult, "sermons").slice(0, 3));
      setLoading(false);
    };

    loadContent();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <BirthdayCelebration />
      <Hero events={events} />

      <div className="w-[90%] max-w-5xl">
        <ServiceSchedule />
      </div>

      <section className="w-[90%] max-w-5xl pb-20 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-palatino text-2xl font-bold text-[#330040] md:text-3xl">
            Recent Sermons
          </h2>
          <Link
            to="/sermons"
            className="flex items-center gap-2 font-nunito text-sm text-[#65007f] transition duration-150 hover:scale-105 md:text-base"
          >
            View all <ArrowRightToLine size={18} />
          </Link>
        </div>

        {loading ? (
          <p className="font-nunito text-gray-500">Loading...</p>
        ) : sermons.length === 0 ? (
          <p className={EMPTY_MESSAGE}>No recent sermons available.</p>
        ) : (
          <ul className="grid gap-[1.618rem] md:grid-cols-3">
            {sermons.map((sermon) => (
              <li key={sermon.id}>
                <SermonCard sermon={sermon} />
              </li>
            ))}
          </ul>
        )}

        <div className="mb-6 mt-14 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-palatino text-2xl font-bold text-[#330040] md:text-3xl">
            Upcoming Events
          </h2>
          <Link
            to="/events"
            className="font-nunito text-sm text-[#65007f] transition duration-150 hover:scale-105 md:text-base"
          >
            Full calendar
          </Link>
        </div>

        {loading ? (
          <p className="font-nunito text-gray-500">Loading...</p>
        ) : events.length === 0 ? (
          <p className={EMPTY_MESSAGE}>No upcoming events right now.</p>
        ) : (
          <div className="flex flex-col">
            {events.slice(0, LANDING_EVENT_COUNT).map((event) => (
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
      </section>
    </div>
  );
}
