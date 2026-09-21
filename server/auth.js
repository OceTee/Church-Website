import crypto from "crypto";

const DEFAULT_SECRET = "cac-possibility-dev-secret-change-me";
const DEFAULT_PASSWORD = "admin123";

const SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

if (SECRET === DEFAULT_SECRET) {
    console.warn(
        "[auth] Using default AUTH_SECRET. Set AUTH_SECRET in the environment before deploying."
    );
}
if (ADMIN_PASSWORD === DEFAULT_PASSWORD) {
    console.warn(
        "[auth] Using default ADMIN_PASSWORD. Set ADMIN_PASSWORD in the environment before deploying."
    );
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
    const payload = {
        role: "admin",
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL_MS,
    };
    const data = toBase64Url(JSON.stringify(payload));
    return `${data}.${signatureFor(data)}`;
}

export function verifyToken(token) {
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
