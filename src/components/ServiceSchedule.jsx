export default function ServiceSchedule() {
    return(
        <div className="m-5 h-fit w-full hover:scale-[1.02] duration-150 ease-in">
            <h1 className="bg-[#ffd700] text-black px-4 py-2 rounded-full flex gap-2 items-center font-inter text-sm translate-y-5 translate-x-5 -rotate-3 max-w-fit shadow-md relative z-10">Join us every</h1>
            <div className="p-7 md:p-10 bg-[#65007f] text-white rounded-2xl flex flex-col md:flex-row gap-10 md:gap-16 lg:gap-36 shadow-lg">
                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl md:text-[var(--text-gr-xl)] font-playfair font-semibold">Sunday</h1>
                    <p className="text-sm md:text-md font-inter text-gray-300">First Service • 8:00 AM <br />Second Service • 10:00 AM</p>
                </div>
                <div className="flex flex-col gap-3">
                    <h1 className="text-3xl md:text-[var(--text-gr-xl)] font-playfair font-semibold">Wednesday</h1>
                    <p className="text-sm md:text-md font-inter text-gray-300">Global Bible Study • 5:30 PM</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-4 md:mt-0">
                    <div className="bg-gray-400 opacity-50 h-0.5 w-full md:w-0.5 md:h-full self-center"></div>
                    <p className="text-sm md:text-md font-inter text-gray-300 h-auto content-center leading-relaxed">3 Fatokun Street, Oremeta,<br />Aba Apanu, Ologuneru Road,<br />Ibadan.</p>
                </div>
            </div>
        </div>
    )
}
