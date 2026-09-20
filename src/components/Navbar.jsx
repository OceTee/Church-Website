import { Link } from "react-router-dom";
import { useState } from "react";
import GiveOverlay from "./GiveOverlay";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [giveOpen, setGiveOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMenu = () => setMobileMenuOpen(false);

    return(
        <>
            <nav className="flex flex-row bg-[#9550a7] top-0 z-40 fixed w-full h-fit px-6 md:px-20 justify-between items-center shadow-md">
                <div id="logo" className="flex flex-row items-center py-2">
                    <Link to="/" onClick={closeMenu}>
                        <img src="logo.png" alt="logo" className="h-16 md:h-20 object-contain"/>
                    </Link>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex flex-row gap-6 items-center text-white font-inter text-[var(--text-gr-base)]">
                    <Link to="/" className="hover:scale-105 transition duration-150 active:font-bold">Home</Link> 
                    <Link to="/about" className="hover:scale-105 transition duration-150 active:font-bold">About</Link>
                    <Link to="/stream" className="hover:scale-105 transition duration-150 active:font-bold">Stream</Link>
                    <Link to="/gallery" className="hover:scale-105 transition duration-150 active:font-bold">Gallery</Link>
                    <Link to="/sermons" className="hover:scale-105 transition duration-150 active:font-bold">Sermons</Link>
                    <button
                        onClick={() => setGiveOpen(true)}
                        className="bg-[#ffd700] text-black px-4 py-2 rounded-2xl hover:scale-105 transition duration-150 active:font-bold cursor-pointer shadow-sm"
                    >
                        Give
                    </button>
                </ul>

                {/* Mobile Menu Toggle Button */}
                <button 
                    className="md:hidden text-white focus:outline-none"
                    onClick={toggleMenu}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </nav>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="fixed top-[80px] left-0 w-full bg-[#9550a7] z-30 shadow-lg md:hidden flex flex-col font-inter text-[var(--text-gr-base)] text-white">
                    <Link to="/" onClick={closeMenu} className="px-6 py-4 border-b border-white/20 hover:bg-[#804090] transition">Home</Link>
                    <Link to="/about" onClick={closeMenu} className="px-6 py-4 border-b border-white/20 hover:bg-[#804090] transition">About</Link>
                    <Link to="/stream" onClick={closeMenu} className="px-6 py-4 border-b border-white/20 hover:bg-[#804090] transition">Stream</Link>
                    <Link to="/gallery" onClick={closeMenu} className="px-6 py-4 border-b border-white/20 hover:bg-[#804090] transition">Gallery</Link>
                    <Link to="/sermons" onClick={closeMenu} className="px-6 py-4 border-b border-white/20 hover:bg-[#804090] transition">Sermons</Link>
                    <button
                        onClick={() => { setGiveOpen(true); closeMenu(); }}
                        className="px-6 py-4 text-left text-[#ffd700] font-bold hover:bg-[#804090] transition"
                    >
                        Give
                    </button>
                </div>
            )}

            <GiveOverlay isOpen={giveOpen} onClose={() => setGiveOpen(false)} />
        </>
    );
}
