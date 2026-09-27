import dotenv from "dotenv";

// This module must be imported before anything that reads `process.env`.
// Previously `dotenv.config()` sat in the middle of server.js, which meant the
// database and upload modules had already captured their config by then.
dotenv.config();
