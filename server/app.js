import "./env.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { query, run, ensureSchema } from "./db.js";
import {
    issueToken,
    authenticate,
    changePassword,
    requireAuth,
    issueUploadGrant,
    verifyUploadGrant,
    verifyToken,
    ensureAdminAccount,
    getAdminSetupStatus,
    isAuthDisabled,
} from "./auth.js";
import {
    createUpload,
    uploadField,
    isBlobStorage,
    isValidCategory,
    uploadLimits,
    validateUploadMeta,
    storeUpload,
    discardUpload,
    removeStoredFile,
    ensureUploadsRoot,
    handleUploadError,
} from "./uploads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const app = express();

// Set if database initialisation fails on cold start; surfaced by /api/health
// rather than thrown, so a bad deployment still serves its other routes.
let startupError = null;

app.disable("x-powered-by");

// On Vercel the API and the SPA share an origin, so CORS is not needed. It is
// only enabled when an explicit origin is configured (e.g. a split dev setup).
const allowedOrigin = process.env.ALLOWED_ORIGIN;
if (allowedOrigin) {
    app.use(cors({ origin: allowedOrigin }));
}

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
});

if (!isBlobStorage) {
    // Local development only: Vercel serves these from the CDN instead.
    app.use(
        express.static(path.join(projectRoot, "public"), {
            maxAge: "1d",
        })
    );
    ensureUploadsRoot();
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

// --- ROOT / HEALTH ENDPOINTS ---
app.get("/api", (req, res) => {
    res.json({ status: "ok", message: "CAC Possibility API is running." });
});

// Public configuration check so a misconfigured deployment can be diagnosed
// from a browser. Reports booleans and problems only, never secret values.
app.get("/api/health", async (req, res) => {
    const status = getAdminSetupStatus();

    let database = "ok";
    try {
        await query("SELECT 1");
    } catch (error) {
        database = `unreachable: ${error.message}`;
    }

    const emailConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const authDisabled = isAuthDisabled();
    const ready = database === "ok" && (status.ok || authDisabled);

    res.status(ready ? 200 : 503).json({
        status: ready ? "ok" : "needs-attention",
        database,
        startupError: startupError ? startupError.message : null,
        storage: isBlobStorage ? "vercel-blob" : "local-disk",
        authSecretConfigured: Boolean(process.env.AUTH_SECRET),
        authDisabled,
        adminAccount: status.ok ? "created" : "missing",
        adminProblem: status.problem,
        passwordWarning: status.passwordWarning,
        contactEmailConfigured: emailConfigured,
    });
});

// Tells the admin dashboard which upload transport to use. Large files cannot
// travel through a serverless function body, so on Vercel the browser uploads
// straight to Vercel Blob and only sends the resulting URL here.
app.get("/api/config", (req, res) => {
    res.json({
        uploadMode: isBlobStorage ? "direct" : "server",
        authMode: isAuthDisabled() ? "disabled" : "required",
        maxBytes: {
            gallery: uploadLimits("gallery").maximumSizeInBytes,
            events: uploadLimits("events").maximumSizeInBytes,
            sermons: uploadLimits("sermons").maximumSizeInBytes,
        },
    });
});

// --- AUTH ENDPOINTS ---
app.post("/api/auth/login", async (req, res) => {
    const { password } = req.body || {};
    const admin = await authenticate(password);

    if (!admin) {
        const status = getAdminSetupStatus();
        if (!status.ok) {
            // Distinguish "the deployment is misconfigured" from "wrong
            // password", otherwise this looks like a failed login forever.
            return res.status(503).json({
                error: status.problem,
                code: "ADMIN_NOT_CONFIGURED",
            });
        }
        return res.status(401).json({ error: "Incorrect password" });
    }
    return res.json({ token: issueToken(admin.version) });
});

app.get("/api/auth/session", requireAuth, (req, res) => {
    res.json({ authenticated: true });
});

// Changing the password retires every existing session, including this one, so
// the response carries a freshly signed token for the new version.
app.post("/api/auth/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};

    const result = await changePassword(currentPassword, newPassword);
    if (result.error) {
        return res.status(400).json({ error: result.error });
    }

    res.json({ token: issueToken(result.version) });
});

// --- DIRECT-TO-BLOB UPLOAD ---
// The Vercel blob client cannot attach the admin bearer token to its own
// request, so the dashboard first exchanges its session for a short-lived,
// single-category upload grant which is passed as a query parameter.
app.post("/api/uploads/grant", requireAuth, (req, res) => {
    const { category } = req.body || {};
    if (!isValidCategory(category)) {
        return badRequest(res, "Unknown upload category.");
    }
    res.json({ grant: issueUploadGrant(category) });
});

app.post("/api/blob-upload", async (req, res) => {
    if (!isBlobStorage) {
        return badRequest(res, "Direct uploads are only available on Vercel Blob storage.");
    }

    const body = req.body || {};
    const category = String(body.category || "");

    if (!isValidCategory(category)) {
        return badRequest(res, "Unknown upload category.");
    }

    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;

    const authorized =
        verifyToken(bearer) || verifyUploadGrant(String(req.query.grant || ""), category);

    if (!authorized) {
        return res.status(401).json({ error: "Authentication required" });
    }

    const problem = validateUploadMeta(category, body.meta || {});
    if (problem) {
        return badRequest(res, problem);
    }

    try {
        const { handleUpload } = await import("@vercel/blob/client");

        const request = new Request(`https://${req.headers.host}${req.originalUrl}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });

        const response = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => ({
                ...uploadLimits(category),
                addRandomSuffix: true,
            }),
            onUploadCompleted: async () => {},
        });

        res.status(response.status);
        res.type("application/json").send(await response.text());
    } catch (error) {
        serverError(res, error);
    }
});

// --- GALLERY ENDPOINTS ---
app.get("/api/gallery", async (req, res) => {
    try {
        const photos = await query("SELECT * FROM gallery ORDER BY createdAt DESC, id DESC");
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

            const { date, imageUrl: existingUrl } = req.body || {};

            // The browser may have uploaded straight to blob already.
            const imageUrl = existingUrl || (await storeUpload("gallery", req.file));
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
            await removeStoredFile(photos[0].imageUrl);
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
        const events = await query("SELECT * FROM events ORDER BY date ASC, id ASC");
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
            const { title, description, date, time, flyerUrl: existingUrl } = req.body || {};

            if (!title || !date || !time) {
                discardUpload(req.file);
                return badRequest(res, "Title, date and time are required");
            }

            const flyerUrl = existingUrl
                ? existingUrl
                : req.file
                  ? await storeUpload("events", req.file)
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
            await removeStoredFile(events[0].flyerUrl);
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
        const sermons = await query("SELECT * FROM sermons ORDER BY createdAt DESC, id DESC");
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
            if (!req.file && !req.body?.audioUrl) {
                return badRequest(res, "No audio file uploaded");
            }

            const { title, date, audioUrl: existingUrl } = req.body || {};
            if (!title) {
                discardUpload(req.file);
                return badRequest(res, "Sermon title is required");
            }

            const audioUrl = existingUrl || (await storeUpload("sermons", req.file));
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
            await removeStoredFile(sermons[0].audioUrl);
            await run("DELETE FROM sermons WHERE id = ?", [req.params.id]);
        }
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

// --- CONTACT ENDPOINT ---
function escapeHtml(value) {
    return String(value).replace(
        /[&<>"']/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[character]
    );
}

app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body || {};
        if (!name || !email || !message) {
            return badRequest(res, "Name, email, and message are required");
        }

        const { EMAIL_USER, EMAIL_PASS, EMAIL_RECEIVER } = process.env;

        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error("[contact] Email credentials missing");
            return res.status(500).json({ error: "Server email configuration is missing." });
        }

        const { default: nodemailer } = await import("nodemailer");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

        const mailOptions = {
            from: `"CAC Possibility Website" <${EMAIL_USER}>`,
            replyTo: email,
            to: EMAIL_RECEIVER || EMAIL_USER,
            subject: `New contact message from ${name}`.slice(0, 200),
            text: `New message from the website contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `<p>New message from the website contact form:</p>
                   <p><strong>Name:</strong> ${safeName}<br/>
                   <strong>Email:</strong> ${safeEmail}</p>
                   <p><strong>Message:</strong></p>
                   <p>${safeMessage}</p>`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Email sent successfully" });
    } catch (err) {
        serverError(res, err);
    }
});

app.use(handleUploadError);

// Unknown API routes should answer with JSON, not an HTML stack trace.
app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Fallback error handler (4 args are required for Express to treat it as
// an error handler, even though `_next` is unused here).
app.use((err, req, res, _next) => {
    serverError(res, err);
});

// Create tables/indexes and the first admin account on cold start, so a fresh
// database just works.
//
// Neither step is allowed to throw: on Vercel a throw here means the function
// never finishes booting, which takes down every route including the static-
// backed public content. A failure is reported through `/api/health` instead.
try {
    await ensureSchema();
    await ensureAdminAccount();
} catch (error) {
    startupError = error;
    console.error("[startup] Database initialisation failed:", error);
}

export default app;
