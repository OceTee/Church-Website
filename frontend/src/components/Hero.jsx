import { Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../config/site";

export default function Hero() {
  return (
    <section className="flex w-full justify-center bg-[url('/BG.svg')] bg-cover bg-center bg-no-repeat px-6 pb-16 pt-32 md:pb-40 md:pt-52">
      <div className="flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:gap-12">
        <div className="flex-1 text-center md:text-left">
          <h1 className="mb-5 font-playfair text-3xl font-bold leading-tight text-[#330040] sm:text-4xl md:text-5xl">
            Welcome to {site.name}
          </h1>
          <p className="font-inter text-lg text-gray-700 md:text-xl">
            {site.tagline}
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 font-inter sm:flex-row md:justify-start">
            <Link
              to="/stream"
              className="flex items-center justify-center gap-2 rounded-full bg-[#ffd700] px-6 py-3 text-black shadow-md transition duration-100 hover:scale-105"
            >
              <Radio size={20} />
              Watch Live
            </Link>
            <Link
              to="/about"
              className="flex items-center justify-center gap-2 rounded-full border-2 border-[#65007f] px-6 py-3 text-[#65007f] transition duration-100 hover:scale-105"
            >
              Learn more
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        <div className="flex w-full justify-center md:w-[40%]">
          <img
            src="/Church.jpg"
            alt="CAC Possibility Assembly congregation"
            className="w-full max-w-[400px] rounded-xl object-cover shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
