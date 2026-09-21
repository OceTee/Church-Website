import { assetUrl } from "../lib/api";

export default function MiniSermon({ type, title, date, audioUrl }) {
  return (
    <article className="flex w-full flex-col gap-2 rounded-xl border border-[#65007f]/30 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="font-inter text-xs font-bold uppercase tracking-wider text-[#65007f]">
        {type}
      </p>
      <h2 className="font-playfair text-xl font-semibold text-[#330040] md:text-2xl">
        {title}
      </h2>
      <p className="font-inter text-sm text-gray-500 md:text-base">{date}</p>
      {audioUrl && (
        <audio controls preload="none" className="mt-2 h-10 w-full">
          <source src={assetUrl(audioUrl)} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </article>
  );
}
