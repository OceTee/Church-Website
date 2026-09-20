import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Stream from "./pages/Stream";
import Footer from "./components/Footer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sermons from "./pages/Sermons";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import Test from "./pages/Test";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <div className="bg-gray-100">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/stream" element={<Stream />} />
          <Route path="/sermons" element={<Sermons />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/compTest" element={<Test />} />
          <Route path="/admin" element={<Dashboard />} />
        </Routes>
        <Footer />
      </Router>
    </div>
    
  );
}

export default App
