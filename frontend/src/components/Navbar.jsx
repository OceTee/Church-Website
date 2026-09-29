import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useGive } from "../context/giveContext";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/stream", label: "Stream" },
  { to: "/gallery", label: "Gallery" },
  { to: "/sermons", label: "Sermons" },
];

const desktopLinkClass = ({ isActive }) =>
  `transition duration-150 hover:text-[#ffd700] ${
    isActive ? "text-[#ffd700] font-semibold" : "text-white"
  }`;

export default function Navbar() {
  const { open: openGive } = useGive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => setMobileMenuOpen((open) => !open);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 z-40 flex w-full items-center justify-between bg-[#9550a7] px-4 shadow-md sm:px-6 md:px-20">
        <Link to="/" onClick={closeMenu} className="flex items-center py-2">
          <img
            src="/logo.png"
            alt="CAC Possibility Assembly logo"
            className="h-16 object-contain md:h-20"
          />
        </Link>

        <ul className="hidden items-center gap-6 font-inter text-[var(--text-gr-base)] md:flex">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} end={to === "/"} className={desktopLinkClass}>
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={openGive}
              className="cursor-pointer rounded-2xl bg-[#ffd700] px-4 py-2 text-black shadow-sm transition duration-150 hover:scale-105 active:font-bold"
            >
              Give
            </button>
          </li>
        </ul>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="text-white focus:outline-none md:hidden"
          onClick={toggleMenu}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed left-0 top-[80px] z-30 flex w-full flex-col bg-[#9550a7] font-inter text-[var(--text-gr-base)] shadow-lg md:hidden">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `border-b border-white/20 px-6 py-4 transition hover:bg-[#804090] ${
                  isActive ? "font-semibold text-[#ffd700]" : "text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              openGive();
              closeMenu();
            }}
            className="px-6 py-4 text-left font-bold text-[#ffd700] transition hover:bg-[#804090]"
          >
            Give
          </button>
        </div>
      )}
    </>
  );
}
