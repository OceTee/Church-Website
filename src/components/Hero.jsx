import { Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
    return(
        <div className="flex justify-center h-fit w-full bg-[url('/BG.svg')] bg-cover bg-center bg-no-repeat pt-52 pb-48 px-20">
            <div className="w-[75%] h-fit flex flex-row">
                <div>
                    <h1 className="text-6xl font-playfair text-[#330040] font-bold mb-5 leading-16">Welcome to CAC Possibility Assembly Nation</h1>
                    <p className="text-xl font-inter text-gray-700">We are excited to welcome you home as part of our church family!</p>

                    <div className="mt-9 font-inter text-lg flex gap-3">
                        <Link to="/stream" className="bg-[#ffd700] text-black px-5 py-3 rounded-full flex gap-2 items-center hover:scale-105 duration-100">
                            <Radio />Watch us Live
                        </Link>
                        <a href="" className="border-2 border-[#65007f] text-[#65007f] px-5 py-2 rounded-full flex gap-2 items-center hover:scale-105 duration-100">
                            Learn more<ArrowRight />
                        </a>
                    </div>
                </div>
                <div className="w-262.5">
                    <img src="/Church.jpg" alt="church picture" className="rounded-xl object-center"/>
                </div>
            </div>
        </div>
    );
};
