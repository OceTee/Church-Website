export default function MiniSermon({ type, title, date, audioUrl }) {
    return(
        <div className="p-5 rounded-xl border border-[#65007f] w-full md:w-1/3 flex flex-col gap-2 shadow-sm hover:shadow-md transition bg-white">
            <p className="font-inter text-sm text-[#65007f] uppercase tracking-wider font-bold">{type}</p>
            <h1 className="font-playfair text-2xl md:text-3xl font-semibold text-[#330040]">{title}</h1>
            <p className="text-sm md:text-md text-gray-500">{date}</p>
            {audioUrl && (
                <audio controls className="w-full mt-2 h-10">
                    <source src={`http://localhost:5000${audioUrl}`} type="audio/mpeg" />
                    Your browser does not support the audio element.
                </audio>
            )}
        </div>
    );
}
