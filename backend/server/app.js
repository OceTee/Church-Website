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
    verifySession,
    bearerToken,
    ensureAdminAccount,
    getAdminSetupStatus,
    isAuthDisabled,
} from "./auth.js";
import {
    createUpload,
    uploadField,
    isBlobStorage,
    isValidCategory,
    isSafeMediaUrl,
    uploadLimits,
    storeUpload,
    discardUpload,
    removeStoredFile,
    ensureUploadsRoot,
    handleUploadError,
} from "./uploads.js";
import { rateLimit } from "./rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const IS_PRODUCTION_LIKE = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

// The church is in Ibadan, so "today" for a record with no date is the date
// there, not in UTC (which is still yesterday until 1am local time).
const SITE_TIME_ZONE = "Africa/Lagos";

const app = express();

// Set if database initialisation fails on cold start; surfaced by /api/health
// rather than thrown, so a bad deployment still serves its other routes.
let startupError = null;
let initPromise = null;

/**
 * Creates tables/indexes and the first admin account. Never throws: a failure
 * is recorded in `startupError` and the next request retries, so a database
 * blip during a cold start does not leave the instance broken until recycled.
 */
function initialise() {
    if (!initPromise) {
        initPromise = (async () => {
            await ensureSchema();
            await ensureAdminAccount();
            startupError = null;
        })().catch((error) => {
            initPromise = null;
            startupError = error;
            console.error("[startup] Database initialisation failed:", error);
        });
    }
    return initPromise;
}

app.disable("x-powered-by");

// The frontend is a separate app on a different origin, so CORS is required.
// ALLOWED_ORIGIN accepts a comma-separated list of exact origins. Bearer
// tokens are sent in the Authorization header rather than as cookies, so
// `credentials` is deliberately not enabled and no wildcard is used.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (allowedOrigins.length > 0) {
    app.use(
        cors({
            origin(origin, callback) {
                // Same-origin and non-browser callers send no Origin header.
                if (!origin || allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                // Log it, but do not error: omitting the header is the standard
                // way to reject a cross-origin request, and the browser blocks
                // it. Throwing here would turn every stray call into a 500.
                console.warn(`[cors] blocked cross-origin request from ${origin}`);
                return callback(null, false);
            },
            methods: ["GET", "POST", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            maxAge: 86400,
        })
    );
} else if (IS_PRODUCTION_LIKE) {
    console.warn(
        "[cors] ALLOWED_ORIGIN is not set. The frontend is served from a different " +
            "origin, so the browser will block its API calls. Set ALLOWED_ORIGIN to " +
            "the frontend's URL."
    );
}

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
});

// Retry a failed cold-start initialisation before handling the request.
app.use(async (req, res, next) => {
    if (startupError) await initialise();
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

// Public endpoints that do real work per request get a per-IP budget. Without
// one, the admin password can be guessed indefinitely and the contact form
// can flood the church inbox and burn through Gmail's daily sending quota.
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const loginLimit = rateLimit(
    "login",
    { limit: 10, windowMs: FIFTEEN_MINUTES },
    "Too many sign-in attempts. Please wait 15 minutes and try again."
);
const passwordLimit = rateLimit(
    "password",
    { limit: 10, windowMs: FIFTEEN_MINUTES },
    "Too many attempts. Please wait 15 minutes and try again."
);
const contactLimit = rateLimit(
    "contact",
    { limit: 5, windowMs: ONE_HOUR },
    "You have sent several messages already. Please try again later, or email us directly."
);

// Upper bounds for admin-entered text, so a bad request cannot store
// megabytes in a single row.
const TEXT_LIMITS = {
    title: 200,
    description: 5000,
    date: 100,
    time: 50,
    speaker: 120,
    body: 100000,
};

function badRequest(res, message) {
    return res.status(400).json({ error: message });
}

function serverError(res, err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
}

/** A trimmed string field from the request body, or "" if absent/not a string. */
function textField(body, name) {
    const value = body?.[name];
    return typeof value === "string" ? value.trim() : "";
}

/** Returns an error message for the first field that exceeds its limit. */
function lengthError(fields) {
    for (const [name, value] of Object.entries(fields)) {
        if (value.length > TEXT_LIMITS[name]) {
            return `The ${name} is too long (maximum ${TEXT_LIMITS[name]} characters).`;
        }
    }
    return null;
}

function today() {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE }).format(new Date());
}

/**
 * The blob client sends `clientPayload` as a JSON string. Dashboards built
 * before that was fixed sent a plain object, so both shapes are accepted.
 */
function parseClientPayload(raw) {
    if (raw && typeof raw === "object") return raw;
    if (typeof raw !== "string") return {};
    try {
        const value = JSON.parse(raw);
        return value && typeof value === "object" ? value : {};
    } catch {
        return {};
    }
}

// --- ROOT / HEALTH ENDPOINTS ---
app.get("/api", (req, res) => {
    res.json({ status: "ok", message: "CAC Possibility API is running." });
});

async function databaseStatus() {
    try {
        await query("SELECT 1");
        return { ok: true, error: null };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// Public configuration check so a misconfigured deployment can be diagnosed
// from a browser. Reports booleans only: no error text, which can contain
// hostnames, and nothing about the admin password's strength, which would
// tell an attacker whether guessing it is worthwhile.
app.get("/api/health", async (req, res) => {
    const status = getAdminSetupStatus();
    const database = await databaseStatus();
    const authDisabled = isAuthDisabled();
    const ready = database.ok && (status.ok || authDisabled);

    res.status(ready ? 200 : 503).json({
        status: ready ? "ok" : "needs-attention",
        database: database.ok ? "ok" : "unreachable",
        startupFailed: Boolean(startupError),
        storage: isBlobStorage ? "vercel-blob" : "local-disk",
        authSecretConfigured: Boolean(process.env.AUTH_SECRET),
        authDisabled,
        adminAccount: status.ok ? "created" : "missing",
        adminProblem: status.problem,
        contactEmailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    });
});

// The same check with the detail an administrator needs to fix a problem.
app.get("/api/health/details", requireAuth, async (req, res) => {
    const status = getAdminSetupStatus();
    const database = await databaseStatus();

    res.json({
        database: database.ok ? "ok" : `unreachable: ${database.error}`,
        startupError: startupError ? startupError.message : null,
        passwordWarning: status.passwordWarning,
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
app.post("/api/auth/login", loginLimit, async (req, res) => {
    const { password } = req.body || {};
    const admin = await authenticate(password);

    if (!admin) {
        const status = getAdminSetupStatus();
        if (!status.ok) {
            // Distinguish "the deployment is misconfigured" from "wrong
            // password", otherwise this looks like a failed login forever.
            return res.status(503).json({
                error:
                    status.problem ||
                    "The server is still starting up. Please try again in a moment.",
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
app.post("/api/auth/password", requireAuth, passwordLimit, async (req, res) => {
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

    // The Vercel Blob client talks to this endpoint using an event envelope,
    // never a plain form body:
    //   { type: "blob.generate-client-token", payload: { pathname, clientPayload } }
    //   { type: "blob.upload-completed",    payload: { ... } }
    // Anything else is not a valid upload request.
    const body = req.body || {};
    const type = body.type;
    if (type !== "blob.generate-client-token" && type !== "blob.upload-completed") {
        return res.status(400).json({ error: "Invalid upload request." });
    }

    try {
        // The blob client cannot send the admin bearer token, so the dashboard
        // first exchanges its session for a short-lived single-category grant
        // and passes it as a query parameter instead. A bearer token is still
        // accepted, but only if it survives a password change like any other.
        if (type === "blob.generate-client-token") {
            const { category } = parseClientPayload(body.payload?.clientPayload);
            const grant = String(req.query.grant || "");
            const authorized =
                (await verifySession(bearerToken(req))) ||
                (grant ? verifyUploadGrant(grant, category) : null);
            if (!authorized) {
                return res.status(401).json({ error: "Authentication required" });
            }
        }

        const request = new Request(`https://${req.headers.host}${req.originalUrl}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });

        const { handleUpload } = await import("@vercel/blob/client");

        const result = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                const { category } = parseClientPayload(clientPayload);
                if (!isValidCategory(category)) {
                    throw new Error("Unknown upload category.");
                }
                return {
                    // Phones name every photo IMG_0001.jpg or image.jpg, and
                    // Vercel Blob refuses to overwrite an existing pathname,
                    // so every upload gets a unique suffix.
                    addRandomSuffix: true,
                    ...uploadLimits(category),
                };
            },
        });

        // handleUpload returns a plain object ({ type, clientToken } or
        // { type, response: "ok" }), not a Response, so send it directly.
        res.type("application/json").send(JSON.stringify(result));
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
            const date = textField(req.body, "date");
            const existingUrl = textField(req.body, "imageUrl");

            // The browser may have uploaded straight to blob already, in which
            // case the dashboard sends a JSON body with the URL and no file.
            // Accept either, but never insert without an image.
            if (!req.file && !existingUrl) {
                return badRequest(res, "No image uploaded");
            }

            const problem =
                lengthError({ date }) ||
                (existingUrl && !isSafeMediaUrl(existingUrl) ? "Invalid image URL." : null);
            if (problem) {
                discardUpload(req.file);
                return badRequest(res, problem);
            }

            const imageUrl = existingUrl || (await storeUpload("gallery", req.file));
            const photoDate = date || today();

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
        const events = await query("SELECT * FROM events ORDER BY date ASC, time ASC, id ASC");
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
            const fields = {
                title: textField(req.body, "title"),
                description: textField(req.body, "description"),
                date: textField(req.body, "date"),
                time: textField(req.body, "time"),
            };
            const existingUrl = textField(req.body, "flyerUrl");

            const problem =
                (!fields.title || !fields.date || !fields.time
                    ? "Title, date and time are required"
                    : null) ||
                lengthError(fields) ||
                (existingUrl && !isSafeMediaUrl(existingUrl) ? "Invalid flyer URL." : null);
            if (problem) {
                discardUpload(req.file);
                return badRequest(res, problem);
            }

            const flyerUrl = existingUrl
                ? existingUrl
                : req.file
                  ? await storeUpload("events", req.file)
                  : null;

            const { title, description, date, time } = fields;
            const result = await run(
                "INSERT INTO events (title, description, date, time, flyerUrl) VALUES (?, ?, ?, ?, ?)",
                [title, description, date, time, flyerUrl]
            );

            res.status(201).json({
                id: result.lastID,
                title,
                description,
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
// Sermons are written text. The list leaves out the body, which can be tens of
// kilobytes each; the full text comes from GET /api/sermons/:id.
app.get("/api/sermons", async (req, res) => {
    try {
        const sermons = await query(
            `SELECT id, title, speaker, speakerImageUrl, date, createdAt
             FROM sermons ORDER BY date DESC, createdAt DESC, id DESC`
        );
        res.json(sermons);
    } catch (err) {
        serverError(res, err);
    }
});

app.get("/api/sermons/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(404).json({ error: "Sermon not found" });
        }
        const sermons = await query("SELECT * FROM sermons WHERE id = ?", [id]);
        if (sermons.length === 0) {
            return res.status(404).json({ error: "Sermon not found" });
        }
        res.json(sermons[0]);
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
            const fields = {
                title: textField(req.body, "title"),
                speaker: textField(req.body, "speaker"),
                body: textField(req.body, "body"),
                date: textField(req.body, "date"),
            };
            const existingUrl = textField(req.body, "speakerImageUrl");

            // The speaker photo is optional: without one the site shows the
            // speaker's initials instead.
            const problem =
                (!fields.title || !fields.speaker || !fields.body
                    ? "Title, speaker and sermon text are required"
                    : null) ||
                lengthError(fields) ||
                (existingUrl && !isSafeMediaUrl(existingUrl) ? "Invalid speaker photo URL." : null);
            if (problem) {
                discardUpload(req.file);
                return badRequest(res, problem);
            }

            const speakerImageUrl = existingUrl
                ? existingUrl
                : req.file
                  ? await storeUpload("sermons", req.file)
                  : null;
            const { title, speaker, body } = fields;
            const date = fields.date || today();

            const result = await run(
                "INSERT INTO sermons (title, speaker, speakerImageUrl, body, date) VALUES (?, ?, ?, ?, ?)",
                [title, speaker, speakerImageUrl, body, date]
            );

            res.status(201).json({ id: result.lastID, title, speaker, speakerImageUrl, body, date });
        } catch (err) {
            serverError(res, err);
        }
    }
);

app.delete("/api/sermons/:id", requireAuth, async (req, res) => {
    try {
        const sermons = await query("SELECT * FROM sermons WHERE id = ?", [req.params.id]);
        if (sermons.length > 0) {
            await removeStoredFile(sermons[0].speakerImageUrl);
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

// Bounds for an endpoint anyone on the internet can call. Without a cap this is
// an open relay pointed at the church's Gmail, and it can also be used to burn
// through the account's daily sending quota. 300/254/5000 comfortably covers a
// real enquiry.
const NAME_MAX = 300;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 5000;

app.post("/api/contact", contactLimit, async (req, res) => {
    const { name, email, message, website } = req.body || {};

    // Honeypot: `website` is a field hidden from people but filled in by most
    // spam bots. Report success so the bot moves on, and send nothing.
    if (typeof website === "string" && website.trim() !== "") {
        return res.json({ message: "Thanks — your message has been sent." });
    }

    const senderName = typeof name === "string" ? name.trim() : "";
    const senderEmail = typeof email === "string" ? email.trim() : "";
    const body = typeof message === "string" ? message.trim() : "";

    if (!senderName || !senderEmail || !body) {
        return badRequest(res, "Name, email, and message are required.");
    }

    if (
        senderName.length > NAME_MAX ||
        senderEmail.length > EMAIL_MAX ||
        body.length > MESSAGE_MAX
    ) {
        return badRequest(res, "That message is too long to send.");
    }

    const { EMAIL_USER, EMAIL_PASS, EMAIL_RECEIVER } = process.env;

    if (!EMAIL_USER?.trim() || !EMAIL_PASS?.trim()) {
        console.error(
            "[contact] EMAIL_USER/EMAIL_PASS are not set. The contact form is " +
                "disabled until they are configured -- see backend/.env.example."
        );
        // 503, not 500: nothing is broken, the feature simply is not switched on.
        return res.status(503).json({
            error: "The contact form is not available at the moment. Please email us directly.",
        });
    }

    // A newline inside a header value is header injection. The subject and the
    // display name are built from user input, so strip CR/LF before they reach
    // the transport. Gmail app passwords are displayed in groups of four and
    // usually get copied with the spaces still in them.
    const headerName = senderName.replace(/[\r\n]+/g, " ").slice(0, 200);
    const headerEmail = senderEmail.replace(/[\r\n]+/g, "").slice(0, EMAIL_MAX);
    const appPassword = EMAIL_PASS.replace(/\s+/g, "");

    try {
        const { default: nodemailer } = await import("nodemailer");

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER.trim(), pass: appPassword },
        });

        await transporter.sendMail({
            from: `"CAC Possibility Website" <${EMAIL_USER.trim()}>`,
            replyTo: headerEmail,
            to: (EMAIL_RECEIVER || EMAIL_USER).trim(),
            subject: `New contact message from ${headerName}`,
            text: `New message from the website contact form:\n\nName: ${senderName}\nEmail: ${senderEmail}\n\nMessage:\n${body}`,
            // Escaped: this body is attacker-controlled and lands in a mailbox.
            html: `<p>New message from the website contact form:</p>
                   <p><strong>Name:</strong> ${escapeHtml(senderName)}<br/>
                   <strong>Email:</strong> ${escapeHtml(senderEmail)}</p>
                   <p><strong>Message:</strong></p>
                   <p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>`,
        });

        res.json({ message: "Thanks — your message has been sent." });
    } catch (err) {
        // Nearly always a credential problem: 2FA not enabled, app password
        // revoked or mistyped, quota exhausted. Log the code so it is
        // diagnosable from the Vercel logs, but do not hand SMTP detail to the
        // sender.
        console.error(
            `[contact] send failed: code=${err?.code ?? "?"} status=${err?.responseCode ?? "?"} ${err?.message ?? ""}`.trim()
        );
        res.status(502).json({
            error: "Your message could not be sent just now. Please try again, or email us directly.",
        });
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
// database just works. This never throws: on Vercel a throw here means the
// function never finishes booting, which takes down every route. A failure is
// reported through `/api/health` and retried on the next request instead.
await initialise();

export default app;
