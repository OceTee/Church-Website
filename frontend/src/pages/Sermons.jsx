import { useEffect, useState } from "react";
import Header from "../components/Header";
import SermonCard from "../components/SermonCard";
import { fetchSermons } from "../lib/sermons";

export default function Sermons() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSermons = async () => {
      try {
        const data = await fetchSermons();
        if (active) setSermons(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch sermons:", error);
        if (active) setFailed(true);
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
      <div className="flex w-full max-w-5xl flex-col gap-[2.618rem]">
        <Header
          main="Sermons"
          sub="Read and reflect on the messages preached at our services."
        />

        {loading ? (
          <p className="font-nunito text-gray-500">Loading sermons...</p>
        ) : failed ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            Sermons could not be loaded just now. Please try again shortly.
          </div>
        ) : sermons.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            No sermons have been published yet. Check back later!
          </div>
        ) : (
          <ul className="grid gap-[1.618rem] sm:grid-cols-2 lg:grid-cols-3">
            {sermons.map((sermon) => (
              <li key={sermon.id}>
                <SermonCard sermon={sermon} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
