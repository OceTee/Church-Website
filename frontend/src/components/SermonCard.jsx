import { Link } from "react-router-dom";
import SpeakerAvatar from "./SpeakerAvatar";
import { formatDate } from "../lib/dates";

/**
 * A sermon in a list: the title, then the speaker as a circle photo with
 * their name beneath. Spacing follows the golden ratio scale (1rem, 1.618rem,
 * 2.618rem) and the photo is φ³ = 4.236rem across.
 */
export default function SermonCard({ sermon }) {
  return (
    <Link
      to={`/sermons/${sermon.id}`}
      className="surface-card group flex h-full flex-col items-center gap-[1.618rem] rounded-[1.618rem] border border-[#65007f]/10 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#65007f] focus-visible:ring-offset-2 sm:p-[1.618rem]"
    >
      <div className="flex flex-1 flex-col gap-[0.618rem]">
        {sermon.date && (
          <p className="font-nunito text-xs font-semibold uppercase tracking-[0.162em] text-[#9550a7]">
            {formatDate(sermon.date)}
          </p>
        )}
        <h2 className="font-palatino text-gr-md font-bold leading-snug text-[#330040] transition group-hover:text-[#65007f] md:text-gr-lg">
          {sermon.title}
        </h2>
      </div>

      <div className="flex flex-col items-center gap-[0.618rem]">
        <SpeakerAvatar
          name={sermon.speaker}
          src={sermon.speakerImageUrl}
          className="h-[4.236rem] w-[4.236rem] rounded-full"
          initialsClassName="text-gr-md"
        />
        {sermon.speaker && (
          <p className="font-nunito text-sm font-medium text-gray-600">{sermon.speaker}</p>
        )}
      </div>
    </Link>
  );
}
