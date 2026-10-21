import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "CAC Possibility Assembly Nation";
const PAGES = {
  "/": [SITE, "Worship with CAC Possibility Assembly Nation in Ibadan. Watch services, listen to sermons, and find upcoming events."],
  "/about": [`About | ${SITE}`, "Learn about CAC Possibility Assembly Nation, our faith, and our church community in Ibadan."],
  "/events": [`Events | ${SITE}`, "See upcoming services and events at CAC Possibility Assembly Nation."],
  "/stream": [`Watch Live | ${SITE}`, "Watch services and live streams from CAC Possibility Assembly Nation."],
  "/gallery": [`Photo Gallery | ${SITE}`, "Browse church photos from CAC Possibility Assembly Nation, grouped by date."],
  "/sermons": [`Sermons | ${SITE}`, "Listen to and read sermons from CAC Possibility Assembly Nation."],
  "/connect": [`Get Connected | ${SITE}`, "Plan a visit, contact CAC Possibility Assembly Nation, or follow us online."],
  "/admin": [`Admin | ${SITE}`, "Church administration."],
  "/admin/login": [`Admin Login | ${SITE}`, "Secure church administration login."],
};

function meta(name, content, attribute = "name") {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.append(element);
  }
  element.content = content;
}

export default function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isSermon = /^\/sermons\/[^/]+$/.test(pathname);
    const [title, description] = PAGES[pathname] || (isSermon ? [`Sermon | ${SITE}`, "Sermon from CAC Possibility Assembly Nation."] : [`Page Not Found | ${SITE}`, "The requested page could not be found."]);
    // Sermon detail sets a more specific title after its data is loaded.
    if (!isSermon) document.title = title;
    meta("description", description);
    meta("og:title", title, "property");
    meta("og:description", description, "property");
    meta("og:url", `https://cacpossibilityassembly.vercel.app${pathname}`, "property");
    meta("twitter:title", title);
    meta("twitter:description", description);
    meta("robots", pathname.startsWith("/admin") ? "noindex, nofollow" : "index, follow");
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `https://cacpossibilityassembly.vercel.app${pathname}`;
  }, [pathname]);
  return null;
}
