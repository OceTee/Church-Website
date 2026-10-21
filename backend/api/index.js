// Vercel serverless entry point for the whole Express API.
//
// backend/vercel.json rewrites every request path to this single function, so
// the app keeps its `/api/...` route paths unchanged and works identically in
// dev (server/server.js) and on Vercel.
import "../server/env.js";
import app from "../server/app.js";

export default app;
