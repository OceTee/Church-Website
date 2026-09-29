import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import Header from "../components/Header";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
      <Header
        main="Page Not Found"
        sub="The page you are looking for may have been moved or no longer exists."
      />
      <Link
        to="/"
        className="mt-8 flex items-center gap-2 rounded-full bg-[#65007f] px-6 py-3 font-inter text-white transition hover:bg-[#500066]"
      >
        <Home size={18} />
        Back to Home
      </Link>
    </div>
  );
}
