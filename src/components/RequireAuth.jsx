import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthMode, isAuthenticated } from "../lib/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [state, setState] = useState({ ready: false, bypass: false });

  useEffect(() => {
    let active = true;

    getAuthMode().then((mode) => {
      if (active) setState({ ready: true, bypass: mode === "disabled" });
    });

    return () => {
      active = false;
    };
  }, []);

  // Wait for the server's answer before deciding, otherwise a valid session
  // would be bounced to the login page on a hard refresh.
  if (!state.ready) return null;

  if (state.bypass) return children;

  if (!isAuthenticated()) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return children;
}
