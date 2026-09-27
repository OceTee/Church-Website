import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { query, run } from "./db.js";
import { issueToken, isValidPassword, requireAuth, verifyToken } from "./auth.js";
import {
    createUpload,
    uploadField,
    publicUploadPath,
    removePublicFile,
    uploadsRootPath,
    handleUploadError,
} from "./uploads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets (uploaded media + public assets)
app.use(express.static(path.join(projectRoot, "public")));

// Ensure the uploads root exists on boot
if (!fs.existsSync(uploadsRootPath())) {
    fs.mkdirSync(uploadsRootPath(), { recursive: true });
}

const galleryUpload = createUpload("gallery");
const eventsUpload = createUpload("events");
const sermonsUpload = createUpload("sermons");

const GALLERY_FIELD = uploadField("gallery");
const EVENTS_FIELD = uploadField("events");
const SERMONS_FIELD = uploadField("sermons");

function badRequest(res, message) {
    return res.status(400).json({ error: message });
}

function serverError(res, err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
}

// --- ROOT ENDPOINT ---
app.get("/api", (req, res) => {
    res.json({ status: "ok", message: "CAC Possibility API is running." });
});

// --- AUTH ENDPOINTS ---
app.post("/api/auth/login", (req, res) => {
    const { password } = req.body || {};
    if (!isValidPassword(password)) {
        return res.status(401).json({ error: "Incorrect password" });
    }
    return res.json({ token: issueToken() });
});

app.get("/api/auth/session", (req, res) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!verifyToken(token)) {
        return res.status(401).json({ error: "Authentication required" });
    }
    return res.json({ authenticated: true });
});

// --- GALLERY ENDPOINTS ---
app.get("/api/gallery", async (req, res) => {
    try {
        const photos = await query("SELECT * FROM gallery ORDER BY createdAt DESC");
        res.json(photos);
    } catch (err) {
        serverError(res, err);
    }
});

app.post(
    "/api/gallery",
    requireAuth,
    galleryUpload.single(GALLERY_FIELD),
    async (req, res) => {
        try {
            if (!req.file) return badRequest(res, "No image uploaded");

            const { date } = req.body || {};
            const imageUrl = publicUploadPath("gallery", req.file.filename);
            const photoDate = date || new Date().toISOString().split("T")[0];

            const result = await run(
                "INSERT INTO gallery (imageUrl, date) VALUES (?, ?)",
                [imageUrl, photoDate]
            );

            res.status(201).json({ id: result.lastID, imageUrl, date: photoDate });
        } catch (err) {
            serverError(res, err);
        }
    }
);

app.delete("/api/gallery/:id", requireAuth, async (req, res) => {
    try {
        const photos = await query("SELECT * FROM gallery WHERE id = ?", [req.params.id]);
        if (photos.length > 0) {
            removePublicFile(photos[0].imageUrl);
            await run("DELETE FROM gallery WHERE id = ?", [req.params.id]);
        }
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

// --- EVENTS ENDPOINTS ---
app.get("/api/events", async (req, res) => {
    try {
        const events = await query("SELECT * FROM events ORDER BY date ASC");
        res.json(events);
    } catch (err) {
        serverError(res, err);
    }
});

app.post(
    "/api/events",
    requireAuth,
    eventsUpload.single(EVENTS_FIELD),
    async (req, res) => {
        try {
            const { title, description, date, time } = req.body || {};

            if (!title || !date || !time) {
                removePublicFile(req.file && `/uploads/events/${req.file.filename}`);
                return badRequest(res, "Title, date and time are required");
            }

            const flyerUrl = req.file
                ? publicUploadPath("events", req.file.filename)
                : null;

            const result = await run(
                "INSERT INTO events (title, description, date, time, flyerUrl) VALUES (?, ?, ?, ?, ?)",
                [title, description || "", date, time, flyerUrl]
            );

            res.status(201).json({
                id: result.lastID,
                title,
                description: description || "",
                date,
                time,
                flyerUrl,
            });
        } catch (err) {
            serverError(res, err);
        }
    }
);

app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
        const events = await query("SELECT * FROM events WHERE id = ?", [req.params.id]);
        if (events.length > 0 && events[0].flyerUrl) {
            removePublicFile(events[0].flyerUrl);
        }
        await run("DELETE FROM events WHERE id = ?", [req.params.id]);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

// --- SERMONS ENDPOINTS ---
app.get("/api/sermons", async (req, res) => {
    try {
        const sermons = await query("SELECT * FROM sermons ORDER BY createdAt DESC");
        res.json(sermons);
    } catch (err) {
        serverError(res, err);
    }
});

app.post(
    "/api/sermons",
    requireAuth,
    sermonsUpload.single(SERMONS_FIELD),
    async (req, res) => {
        try {
            if (!req.file) return badRequest(res, "No audio file uploaded");

            const { title, date } = req.body || {};
            if (!title) {
                removePublicFile(`/uploads/sermons/${req.file.filename}`);
                return badRequest(res, "Sermon title is required");
            }

            const audioUrl = publicUploadPath("sermons", req.file.filename);
            const sermonDate = date || new Date().toISOString().split("T")[0];

            const result = await run(
                "INSERT INTO sermons (title, date, audioUrl) VALUES (?, ?, ?)",
                [title, sermonDate, audioUrl]
            );

            res.status(201).json({
                id: result.lastID,
                title,
                date: sermonDate,
                audioUrl,
            });
        } catch (err) {
            serverError(res, err);
        }
    }
);

app.delete("/api/sermons/:id", requireAuth, async (req, res) => {
    try {
        const sermons = await query("SELECT * FROM sermons WHERE id = ?", [req.params.id]);
        if (sermons.length > 0) {
            removePublicFile(sermons[0].audioUrl);
            await run("DELETE FROM sermons WHERE id = ?", [req.params.id]);
        }
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

// --- CONTACT ENDPOINT ---
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body || {};
        if (!name || !email || !message) {
            return badRequest(res, "Name, email, and message are required");
        }

        const { EMAIL_USER, EMAIL_PASS, EMAIL_RECEIVER } = process.env;

        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error("Email credentials missing in .env");
            return res.status(500).json({ error: "Server email configuration is missing." });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail", // Assuming Gmail, adjust if needed
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"${name}" <${EMAIL_USER}>`, // Send from authenticated user to avoid spam flags
            replyTo: email,
            to: EMAIL_RECEIVER || EMAIL_USER,
            subject: `New Contact Message from ${name}`,
            text: `You have received a new message from your website contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `<p>You have received a new message from your website contact form:</p>
                   <p><strong>Name:</strong> ${name}<br/>
                   <strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong></p>
                   <p>${message.replace(/\n/g, '<br/>')}</p>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Email sent successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

// Multer (upload) errors -> JSON responses instead of HTML stack traces
app.use(handleUploadError);

// Fallback error handler (4 args are required for Express to treat it as
// an error handler, even though `_next` is unused here).
app.use((err, req, res, _next) => {
    serverError(res, err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
