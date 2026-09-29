import { Link } from "react-router-dom";
import { Globe, Send, MessageCircle, Camera, Music2 } from "lucide-react";
import { site } from "../config/site";

const ICONS = {
  globe: Globe,
  send: Send,
  "message-circle": MessageCircle,
  camera: Camera,
  music: Music2,
};

export default function SocialLinks({ className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}>
      {site.socials.map(({ label, icon, href }) => {
        const Icon = ICONS[icon] || Globe;
        const isExternal = /^https?:\/\//i.test(href);
        const linkClasses =
          "flex items-center gap-2 font-inter text-sm text-gray-400 transition duration-150 hover:text-white";

        if (isExternal) {
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={linkClasses}
            >
              <Icon size={18} />
              <span>{label}</span>
            </a>
          );
        }

        return (
          <Link key={label} to={href} aria-label={label} className={linkClasses}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
