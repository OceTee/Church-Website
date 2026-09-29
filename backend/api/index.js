// Vercel serverless entry point for the whole Express API.
//
// The catch-all maps every request under /api to this single function, so the
// app keeps its `/api/...` route paths unchanged and works identically in dev
// and on Vercel.
//
// This is the non-optional `[...path]` form on purpose. With the optional
// `[[...path]]` form, production returned an empty Vercel-edge 404 for every
// path deeper than one segment -- /api/health worked while /api/auth/session
// and /api/sermons/:id never reached Express, so login was impossible. That
// also means the bare /api path is not routed; use /api/health instead.
import "../server/env.js";
import app from "../server/app.js";

export default app;
