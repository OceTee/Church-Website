import "./env.js";
import crypto from "crypto";

const DEFAULT_SECRET = "cac-possibility-dev-secret-change-me";
const DEFAULT_PASSWORD = "admin123";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

if (SECRET === DEFAULT_SECRET || ADMIN_PASSWORD === DEFAULT_PASSWORD) {
    const message =
        "[auth] Using a built-in default AUTH_SECRET/ADMIN_PASSWORD. This is allowed for local development only.";
    if (IS_PRODUCTION) {
        // Never fall back to a well-known password in production: anyone who
        // has read the source could sign in to /admin.
        throw new Error(
            "[auth] AUTH_SECRET and ADMIN_PASSWORD must be set in the environment when NODE_ENV=production."
        );
    }
    console.warn(message);
}

function toBase64Url(value) {
    return Buffer.from(value)
        .toString("base64")
        .replace(/=+$/, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function fromBase64Url(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
}

function signatureFor(data) {
    return toBase64Url(
        crypto.createHmac("sha256", SECRET).update(data).digest("base64")
    );
}

function safeEqual(a, b) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
}

export function issueToken() {
    return sign({
        role: "admin",
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL_MS,
    });
}

function sign(payload) {
    const data = toBase64Url(JSON.stringify(payload));
    return `${data}.${signatureFor(data)}`;
}

function unsign(token) {
    if (typeof token !== "string" || !token.includes(".")) return null;

    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    if (!safeEqual(signature, signatureFor(data))) return null;

    try {
        const payload = JSON.parse(fromBase64Url(data));
        if (!payload.exp || Date.now() > payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

export function verifyToken(token) {
    const payload = unsign(token);
    return payload?.role === "admin" ? payload : null;
}

const UPLOAD_GRANT_TTL_MS = 1000 * 60 * 5; // 5 minutes

/**
 * Short-lived, single-category grant used by direct-to-blob uploads. The
 * Vercel blob client cannot send the admin bearer token, so the authenticated
 * dashboard fetches a grant first and passes it as a query parameter instead.
 */
export function issueUploadGrant(category) {
    return sign({
        purpose: "upload",
        category,
        exp: Date.now() + UPLOAD_GRANT_TTL_MS,
    });
}

export function verifyUploadGrant(token, category) {
    const payload = unsign(token);
    if (!payload || payload.purpose !== "upload") return null;
    if (payload.category !== category) return null;
    return payload;
}

export function isValidPassword(password) {
    if (typeof password !== "string" || password.length === 0) return false;
    return safeEqual(password, ADMIN_PASSWORD);
}

export function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ error: "Authentication required" });
    }

    req.admin = payload;
    next();
}
