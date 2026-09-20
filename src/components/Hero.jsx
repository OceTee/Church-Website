import { Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
    return(
        <div className="flex justify-center h-fit w-full bg-[url('/BG.svg')] bg-cover bg-center bg-no-repeat pt-32 md:pt-52 pb-20 md:pb-48 px-6 md:px-20">
            <div className="w-full md:w-[85%] lg:w-[75%] h-fit flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-0">
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-[var(--text-gr-xl)] md:text-[var(--text-gr-2xl)] font-playfair text-[#330040] font-bold mb-5 leading-tight">Welcome to CAC Possibility Assembly Nation</h1>
                    <p className="text-[var(--text-gr-md)] font-inter text-gray-700">We are excited to welcome you home as part of our church family!</p>

                    <div className="mt-9 font-inter text-[var(--text-gr-base)] flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <Link to="/stream" className="bg-[#ffd700] text-black px-6 py-3 rounded-full flex gap-2 items-center justify-center hover:scale-105 duration-100 shadow-md">
                            <Radio />Watch us Live
                        </Link>
                        <a href="about" className="border-2 border-[#65007f] text-[#65007f] px-6 py-3 rounded-full flex gap-2 items-center justify-center hover:scale-105 duration-100">
                            Learn more<ArrowRight />
                        </a>
                    </div>
                </div>
                <div className="w-full md:w-[40%] flex justify-center">
                    <img src="/Church.jpg" alt="church picture" className="rounded-xl object-cover shadow-xl w-full max-w-[400px]"/>
                </div>
            </div>
        </div>
    );
}
