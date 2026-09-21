import Header from "../components/Header";
import ServiceSchedule from "../components/ServiceSchedule";
import { site } from "../config/site";

export default function Stream() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <Header
          main="Watch Live"
          sub="Join our services online, live every Sunday and Wednesday, or catch up on recent services."
        />

        <div className="w-full">
          <div className="relative w-full overflow-hidden rounded-2xl pb-[56.25%] shadow-lg">
            <iframe
              className="absolute left-0 top-0 h-full w-full"
              src={`https://www.youtube.com/embed/live_stream?channel=${site.youtube.channelId}`}
              title={`${site.name} Live Stream`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="mt-4 text-center font-inter text-sm text-gray-500">
            Can't see the stream?{" "}
            <a
              href={site.youtube.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#65007f] underline hover:text-[#330040]"
            >
              Watch directly on YouTube
            </a>
          </p>
        </div>

        <ServiceSchedule />
      </div>
    </div>
  );
}
