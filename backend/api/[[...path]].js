// Vercel serverless entry point for the whole Express API.
//
// The optional catch-all route maps every request under /api (including the
// bare /api health check) to this single function, so the app keeps its
// `/api/...` route paths unchanged and works identically in dev and on Vercel.
import "../server/env.js";
import app from "../server/app.js";

export default app;
