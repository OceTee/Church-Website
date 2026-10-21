import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * Catches a rendering error in a page so it shows a message instead of
 * blanking the whole site. AppLayout keys it by route, so navigating away
 * gives the next page a fresh start.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("Page failed to render:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pt-32 pb-20 text-center">
        <h1 className="font-palatino text-3xl font-bold text-[#330040] md:text-4xl">
          Something went wrong
        </h1>
        <p className="max-w-md font-nunito text-gray-600">
          This page could not be displayed. Please refresh, or try again in a
          few minutes.
        </p>
        <div className="flex gap-3 font-nunito">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#65007f] px-6 py-3 text-white transition hover:bg-[#500066]"
          >
            Refresh
          </button>
          <Link
            to="/"
            className="rounded-full border border-[#65007f] px-6 py-3 text-[#65007f] transition hover:bg-[#65007f] hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
}
