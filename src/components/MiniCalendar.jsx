export default function MiniCalendar({title, sub, date, time}) {
    return(
        <div className="p-5 rounded-xl border border-[#65007f] flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 shadow-sm">
            <div>
                <h1 className="font-playfair text-2xl md:text-3xl font-semibold text-[#330040]">{title}</h1>
                <p className="text-sm md:text-md text-gray-500 mt-1">{sub}</p>
            </div>
            <div className="font-inter text-sm text-white bg-[#65007f] px-4 py-2 rounded-lg flex flex-col items-center min-w-[100px]">
                <p className="font-bold">{date}</p>
                <p>{time}</p>
            </div>
        </div>
    );
}
