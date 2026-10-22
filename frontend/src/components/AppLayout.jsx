import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GiveOverlay from "./GiveOverlay";
import ScrollToTop from "./ScrollToTop";
import RequireAuth from "./RequireAuth";
import ErrorBoundary from "./ErrorBoundary";
import LoadingScreen from "./LoadingScreen";
import { useGive } from "../context/giveContext";
import { setAppLoading } from "../lib/appReady";
import Landing from "../pages/Landing";
import RouteMetadata from "./RouteMetadata";

// Keep the homepage on the critical path. Less frequently visited pages,
// especially the admin tools, are fetched only when a visitor opens them.
const About = lazy(() => import("../pages/About"));
const Events = lazy(() => import("../pages/Events"));
const Stream = lazy(() => import("../pages/Stream"));
const Gallery = lazy(() => import("../pages/Gallery"));
const Sermons = lazy(() => import("../pages/Sermons"));
const SermonDetail = lazy(() => import("../pages/SermonDetail"));
const Connect = lazy(() => import("../pages/Connect"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const NotFound = lazy(() => import("../pages/NotFound"));

// The loading screen shows for 1.5s when the site first opens, and for 0.5s
// on every page change (longer only if that page's code is still arriving).
const INITIAL_LOAD_MS = 1500;
const ROUTE_LOAD_MS = 500;

/**
 * Rendered by Suspense while a lazy page's code downloads. It only reports
 * that fact, so the loading screen can hold until the page is ready; the
 * screen itself is what the visitor sees.
 */
function PendingSignal({ onChange }) {
  useEffect(() => {
    onChange(true);
    return () => onChange(false);
  }, [onChange]);
  return null;
}

export default function AppLayout() {
  const { isOpen, close } = useGive();
  const { pathname } = useLocation();

  const [loader, setLoader] = useState({ duration: INITIAL_LOAD_MS });
  const [pending, setPending] = useState(false);
  // True while the page scales in from the centre as the loader's mark
  // expands away; the class is removed again once that animation ends.
  const [revealing, setRevealing] = useState(false);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setLoader({ duration: ROUTE_LOAD_MS });
  }, [pathname]);

  useEffect(() => {
    setAppLoading(Boolean(loader));
  }, [loader]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfaf8]">
      <ScrollToTop />
      <RouteMetadata />
      <Navbar />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <div
          className={revealing ? "page-reveal" : undefined}
          onAnimationEnd={(event) => {
            if (event.animationName === "page-reveal") setRevealing(false);
          }}
        >
          <ErrorBoundary key={pathname}>
            <Suspense fallback={<PendingSignal onChange={setPending} />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/stream" element={<Stream />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/sermons" element={<Sermons />} />
                <Route path="/sermons/:id" element={<SermonDetail />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/admin/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
      <GiveOverlay isOpen={isOpen} onClose={close} />
      {loader && (
        <LoadingScreen
          key={pathname}
          duration={loader.duration}
          ready={!pending}
          onLeaving={() => setRevealing(true)}
          onDone={() => setLoader(null)}
        />
      )}
    </div>
  );
}
