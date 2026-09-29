import { parseSermonSource } from "../lib/sermons";

/**
 * Renders a sermon from its stored URL. YouTube and Vimeo become an embedded
 * player, a direct audio file becomes an <audio> element, and anything else
 * becomes a plain link so a sermon is never silently unplayable.
 */
export default function SermonPlayer({ url }) {
  const source = parseSermonSource(url);
  if (!source) return null;

  if (source.kind === "embed") {
    return (
      <div className="mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg">
        <iframe
          src={source.src}
          title="Sermon recording"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          allowFullScreen
        />
      </div>
    );
  }

  if (source.kind === "audio") {
    // No `type` hint: these are not all mpeg, and lying about the type stops
    // Safari and Firefox from playing anything but mp3.
    return (
      <audio controls preload="none" className="mt-2 h-10 w-full">
        <source src={source.src} />
        Your browser does not support the audio element.
      </audio>
    );
  }

  return (
    <a
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block font-inter text-sm font-semibold text-[#65007f] underline underline-offset-4 hover:text-[#500066]"
    >
      Watch or listen to the sermon
    </a>
  );
}
