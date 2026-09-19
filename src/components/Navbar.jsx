import { Link } from "react-router-dom";
import { useState } from "react";
import GiveOverlay from "./GiveOverlay";

export default function Navbar() {
    const [giveOpen, setGiveOpen] = useState(false);

    return(
        <>
            <nav className="flex flex-row bg-[#9550a7] top-0 z-10 fixed w-full h-fit px-20 justify-between items-center">
                <div id="logo" className="flex flex-row items-center">
                    <Link to="/"><img src="logo.png" alt="logo" className="h-20 object-contain"/></Link>
                </div>
                <ul className="flex flex-row gap-5 items-center text-white font-inter text-lg">
                    <Link to="/" className="hover:scale-105 transition duration-150 active:font-bold">Home</Link> 
                    <Link to="/about" className="hover:scale-105 transition duration-150 active:font-bold">About</Link>
                    <Link to="/stream" className="hover:scale-105 transition duration-150 active:font-bold">Stream</Link>
                    <Link to="/gallery" className="hover:scale-105 transition duration-150 active:font-bold">Gallery</Link>
                    <Link to="/sermons" className="hover:scale-105 transition duration-150 active:font-bold">Sermons</Link>
                    <button
                        onClick={() => setGiveOpen(true)}
                        className="bg-[#ffd700] text-black px-3 py-1 rounded-2xl hover:scale-105 transition duration-150 active:font-bold cursor-pointer"
                    >
                        Give
                    </button>
                </ul>
            </nav>
            <GiveOverlay isOpen={giveOpen} onClose={() => setGiveOpen(false)} />
        </>
    );
}
