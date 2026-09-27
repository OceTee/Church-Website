import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GiveOverlay from "./GiveOverlay";
import ScrollToTop from "./ScrollToTop";
import RequireAuth from "./RequireAuth";
import { useGive } from "../context/giveContext";
import Landing from "../pages/Landing";
import About from "../pages/About";
import Events from "../pages/Events";
import Stream from "../pages/Stream";
import Gallery from "../pages/Gallery";
import Sermons from "../pages/Sermons";
import Connect from "../pages/Connect";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";

export default function AppLayout() {
  const { isOpen, close } = useGive();

  return (
    <div className="flex min-h-dvh flex-col bg-gray-100">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/stream" element={<Stream />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/sermons" element={<Sermons />} />
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
      </main>
      <Footer />
      <GiveOverlay isOpen={isOpen} onClose={close} />
    </div>
  );
}
