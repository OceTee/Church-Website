import { Link } from "react-router-dom";
import { useGive } from "../context/giveContext";
import SocialLinks from "./SocialLinks";
import { site } from "../config/site";

const linkClass = "transition duration-150 hover:text-white";

export default function Footer() {
  const { open: openGive } = useGive();

  return (
    <footer className="mt-auto bg-[#330040] px-6 py-10 font-inter text-gray-400 md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <SocialLinks className="justify-center border-b border-white/10 pb-8 md:justify-start" />

        <div className="grid grid-cols-2 gap-8 py-8 md:grid-cols-4">
          <nav className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white">Explore</h2>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to="/events" className={linkClass}>
                  Events Calendar
                </Link>
              </li>
              <li>
                <Link to="/sermons" className={linkClass}>
                  Sermons
                </Link>
              </li>
              <li>
                <Link to="/gallery" className={linkClass}>
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/stream" className={linkClass}>
                  Stream
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white">Connect</h2>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to="/about" className={linkClass}>
                  About
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openGive}
                  className={`${linkClass} text-left`}
                >
                  Give
                </button>
              </li>
              <li>
                <Link to="/connect" className={linkClass}>
                  Get Connected
                </Link>
              </li>
            </ul>
          </nav>

          <div className="col-span-2 flex flex-col gap-3 md:col-span-2">
            <h2 className="text-lg font-bold text-white">Visit Us</h2>
            <address className="not-italic leading-relaxed">
              {site.address.street}
              <br />
              {site.address.area}
              <br />
              {site.address.city}
              <br />
              <br />
              {site.address.street2}
              <br />
              {site.address.area2}
            </address>
          </div>
        </div>

        <p className="border-t border-white/10 pt-6 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Kretim Studios - {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
