import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GiveOverlay from "./GiveOverlay";
import ScrollToTop from "./ScrollToTop";
import RequireAuth from "./RequireAuth";
import ErrorBoundary from "./ErrorBoundary";
import { useGive } from "../context/giveContext";
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

export default function AppLayout() {
  const { isOpen, close } = useGive();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfaf8]">
      <ScrollToTop />
      <RouteMetadata />
      <Navbar />
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main id="main-content" tabIndex={-1} className="flex-1">
        <ErrorBoundary key={pathname}>
          <Suspense
            fallback={
              <div className="flex min-h-[40dvh] items-center justify-center px-4 font-nunito text-sm text-[#65007f]" role="status">
                Loading page…
              </div>
            }
          >
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
      </main>
      <Footer />
      <GiveOverlay isOpen={isOpen} onClose={close} />
    </div>
  );
}
