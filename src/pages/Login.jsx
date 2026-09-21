import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Header from "../components/Header";
import { login } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 pt-32 pb-20">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <Header
          main="Admin Sign In"
          sub="Enter the admin password to manage sermons, events and gallery content."
        />

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 font-inter text-sm font-semibold text-gray-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="rounded-lg border border-gray-200 p-3 font-normal focus:border-[#9550a7] focus:outline-none"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 font-inter text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-[#65007f] px-6 py-3 font-inter text-white transition hover:bg-[#500066] disabled:opacity-60"
          >
            <LockKeyhole size={18} />
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center font-inter text-sm text-[#65007f] hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
