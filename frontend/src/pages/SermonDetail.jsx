import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SpeakerAvatar from "../components/SpeakerAvatar";
import SermonBody from "../components/SermonBody";
import { fetchSermon } from "../lib/sermons";
import { formatDate } from "../lib/dates";
import { site } from "../config/site";

/**
 * One sermon in full. The page is a golden-ratio split: a 1.618fr column for
 * the title and text (about 38rem, a comfortable reading measure) and a 1fr
 * column holding the speaker's photo as a rounded square with their name
 * beneath. The photo steps through φ³, φ⁴ and φ⁵ (4.236, 6.854, 11.09rem)
 * with a corner radius of its side divided by φ⁴. On narrow screens the photo column shrinks to fit the photo, which
 * stays top right beside the title, and the text runs full width underneath.
 */
export default function SermonDetail() {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    fetchSermon(id)
      .then((data) => {
        if (!active) return;
        setSermon(data);
        setStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(/not found/i.test(error.message) ? "missing" : "failed");
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!sermon) return undefined;
    const previous = document.title;
    document.title = `${sermon.title} | ${site.name}`;
    return () => {
      document.title = previous;
    };
  }, [sermon]);

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20">
      <div className="w-full max-w-[61.8rem]">
        <Link
          to="/sermons"
          className="mb-[1.618rem] inline-flex items-center gap-2 font-nunito text-sm text-[#65007f] hover:underline"
        >
          <ArrowLeft size={16} />
          All sermons
        </Link>

        {status === "loading" && <p className="font-nunito text-gray-500">Loading sermon...</p>}

        {status === "missing" && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            This sermon could not be found. It may have been removed.
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 py-20 text-center font-nunito italic text-gray-500">
            This sermon could not be loaded just now. Please try again shortly.
          </div>
        )}

        {status === "ready" && sermon && (
          <article className="surface-card grid grid-cols-[1fr_auto] gap-x-3 gap-y-8 rounded-[1.618rem] bg-white p-4 shadow-sm sm:gap-x-[1.618rem] sm:p-[1.618rem] md:grid-cols-[1.618fr_1fr] md:gap-x-[2.618rem] md:gap-y-[2.618rem] md:p-[2.618rem]">
            <header className="col-start-1 row-start-1 flex flex-col gap-[0.618rem] self-center">
              {sermon.date && (
                <p className="font-nunito text-xs font-semibold uppercase tracking-[0.162em] text-[#9550a7]">
                  {formatDate(sermon.date)}
                </p>
              )}
              <h1 className="font-palatino text-gr-lg font-bold leading-tight text-[#330040] md:text-gr-xl">
                {sermon.title}
              </h1>
            </header>

            <aside className="col-start-2 row-start-1 flex flex-col items-end md:row-span-2 md:self-start md:sticky md:top-32">
              <figure className="flex flex-col items-center gap-[0.618rem]">
                <SpeakerAvatar
                  name={sermon.speaker}
                  src={sermon.speakerImageUrl}
                  className="h-[4.236rem] w-[4.236rem] rounded-[0.618rem] shadow-md sm:h-[6.854rem] sm:w-[6.854rem] sm:rounded-2xl md:h-[11.09rem] md:w-[11.09rem] md:rounded-[1.618rem]"
                  initialsClassName="text-gr-md sm:text-gr-lg md:text-gr-xl"
                />
                {sermon.speaker && (
                  <figcaption className="max-w-[6.854rem] text-center font-nunito text-xs font-semibold text-[#330040] sm:text-sm md:max-w-[11.09rem] md:text-base">
                    {sermon.speaker}
                  </figcaption>
                )}
              </figure>
            </aside>

            <div className="col-span-2 row-start-2 md:col-span-1">
              <SermonBody text={sermon.body} />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
