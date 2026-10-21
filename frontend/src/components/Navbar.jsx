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
      <nav aria-label="Main navigation" className="fixed top-0 z-40 flex h-[4.5rem] w-full items-center justify-between border-b border-white/10 bg-[#65007f]/95 px-4 shadow-[0_8px_30px_rgba(32,10,38,0.12)] backdrop-blur-xl sm:px-6 md:px-12 lg:px-20">
        <Link to="/" onClick={closeMenu} className="flex min-h-11 items-center">
          <img
            src="/logo.png"
            alt="CAC Possibility Assembly logo"
            className="h-12 w-auto object-contain sm:h-14"
          />
        </Link>

        <ul className="hidden items-center gap-5 font-nunito text-[var(--text-gr-base)] lg:gap-7 md:flex">
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
              className="min-h-11 cursor-pointer rounded-full bg-[#ffd700] px-5 py-2 font-bold text-[#28172e] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              Give
            </button>
          </li>
        </ul>

        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#65007f] md:hidden"
          onClick={toggleMenu}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-x-0 bottom-0 top-[4.5rem] z-30 bg-black/25 backdrop-blur-[2px] md:hidden"
        />
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="mobile-menu-panel fixed left-0 top-[4.5rem] z-40 flex max-h-[calc(100dvh-4.5rem)] w-full flex-col overflow-y-auto overscroll-contain rounded-b-3xl border-t border-white/10 bg-[#65007f] px-3 pb-3 pt-2 font-nunito text-[var(--text-gr-base)] shadow-2xl md:hidden"
        >
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex min-h-12 items-center rounded-2xl px-4 py-3 transition hover:bg-white/10 ${
                  isActive ? "bg-white/10 font-bold text-[#ffd700]" : "text-white"
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
            className="mt-1 flex min-h-12 items-center rounded-2xl bg-[#ffd700] px-4 py-3 text-left font-bold text-[#28172e] transition hover:bg-[#ffe680]"
          >
            Give
          </button>
        </nav>
        </>
      )}
    </>
  );
}
