import Header from "../components/Header";
import ServiceSchedule from "../components/ServiceSchedule";

export default function Stream() {
    return (
        <div className="flex flex-col min-h-dvh pt-25 items-center">
            <div className="w-[75%] flex flex-col">
                <Header main="Watch Live" sub="Join our services online, live every Sunday and Wednesday, or catch up on recent services." />

                {/* YouTube Embedded Player */}
                <div className="w-full my-10">
                    <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden shadow-lg">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src="https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID"
                            title="CAC Possibility Assembly Live Stream"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                    <p className="text-center text-gray-500 font-inter text-sm mt-4">
                        Can't see the stream? <a href="https://www.youtube.com/@YourChannel" target="_blank" rel="noopener noreferrer" className="text-[#65007f] underline hover:text-[#330040]">Watch directly on YouTube</a>
                    </p>
                </div>

                <ServiceSchedule />
            </div>
        </div>
    );
}
