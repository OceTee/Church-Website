import "./env.js";
import crypto from "crypto";
import { query, run } from "./db.js";

const DEFAULT_SECRET = "cac-possibility-dev-secret-change-me";
const DEFAULT_PASSWORD = "admin123";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MIN_PASSWORD_LENGTH = 8;

if (SECRET === DEFAULT_SECRET) {
    if (IS_PRODUCTION) {
        // The secret only signs session tokens, but a known secret means anyone
        // can mint a valid admin token, so it has no production default.
        throw new Error(
            "[auth] AUTH_SECRET must be set in the environment when NODE_ENV=production."
        );
    }
    console.warn(
        "[auth] Using the default AUTH_SECRET. This is allowed for local development only."
    );
}

// --- Password hashing -------------------------------------------------------
// scrypt with a per-password random salt. The plaintext is never stored, so a
// leaked database does not hand over the admin password.

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(
            Buffer.from(password, "utf8"),
            salt,
            SCRYPT_KEY_LENGTH,
            SCRYPT_OPTIONS,
            (err, derived) => (err ? reject(err) : resolve(derived))
        );
    });
}

/**
 * Returns an error message, or null when the password is acceptable. The
 * built-in development default is rejected in production but tolerated
 * locally, so `npm run dev` works out of the box while a real deployment can
 * never end up on a guessable password.
 */
export function validatePasswordStrength(password) {
    if (typeof password !== "string" || password.length === 0) {
        return "Password is required.";
    }

    if (IS_PRODUCTION) {
        if (password.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }
        if (password === DEFAULT_PASSWORD) {
            return "That password is too easy to guess. Choose something else.";
        }
    }

    return null;
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = await deriveKey(password, salt);
    return { hash: derived.toString("hex"), salt: salt.toString("hex") };
}

async function verifyHashedPassword(password, hash, salt) {
    if (typeof password !== "string" || password.length === 0) return false;

    const derived = await deriveKey(password, Buffer.from(salt, "hex"));
    const expected = Buffer.from(hash, "hex");

    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
}

// --- Admin account ---------------------------------------------------------
// There is a single admin identity, so no username is involved.

async function findAdmin() {
    const rows = await query("SELECT * FROM admins ORDER BY id LIMIT 1");
    return rows[0] || null;
}

export async function getAdminVersion() {
    const admin = await findAdmin();
    return admin ? Number(admin.passwordVersion) : 0;
}

/**
 * Creates the admin account the first time the database is used, seeded from
 * ADMIN_PASSWORD. Deliberately does nothing when an account already exists,
 * so a password changed from the admin panel survives every cold start and
 * redeploy.
 */
export async function ensureAdminAccount() {
    const existing = await findAdmin();
    if (existing) return existing;

    const seed = process.env.ADMIN_PASSWORD || (IS_PRODUCTION ? null : DEFAULT_PASSWORD);

    if (!seed) {
        throw new Error(
            "[auth] No admin account exists and ADMIN_PASSWORD is not set. " +
                "Set ADMIN_PASSWORD in the environment to create the first one."
        );
    }

    const problem = validatePasswordStrength(seed);
    if (problem) {
        throw new Error(`[auth] ${problem}`);
    }

    const { hash, salt } = await hashPassword(seed);
    await run(
        "INSERT INTO admins (username, passwordHash, passwordSalt, passwordVersion) VALUES (?, ?, ?, 1)",
        ["admin", hash, salt]
    );

    console.log(
        IS_PRODUCTION
            ? "[auth] Created the admin account from ADMIN_PASSWORD."
            : `[auth] Created the local admin account (password: "${seed}").`
    );

    return findAdmin();
}

export async function authenticate(password) {
    const admin = await findAdmin();
    if (!admin) return null;

    const matches = await verifyHashedPassword(
        password,
        admin.passwordHash,
        admin.passwordSalt
    );
    if (!matches) return null;

    return { id: admin.id, version: Number(admin.passwordVersion) };
}

/**
 * Replaces the admin password. Bumps `passwordVersion`, which invalidates every
 * session token issued before the change.
 */
export async function changePassword(currentPassword, newPassword) {
    const admin = await findAdmin();
    if (!admin) return { error: "Authentication required" };

    const matches = await verifyHashedPassword(
        currentPassword,
        admin.passwordHash,
        admin.passwordSalt
    );
    if (!matches) return { error: "Your current password is incorrect." };

    const problem = validatePasswordStrength(newPassword);
    if (problem) return { error: problem };

    const { hash, salt } = await hashPassword(newPassword);
    const version = Number(admin.passwordVersion) + 1;

    await run("UPDATE admins SET passwordHash = ?, passwordSalt = ?, passwordVersion = ? WHERE id = ?", [
        hash,
        salt,
        version,
        admin.id,
    ]);

    return { version };
}

// --- Tokens ----------------------------------------------------------------

export function issueToken(version) {
    return sign({
        role: "admin",
        ver: version,
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

export async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ error: "Authentication required" });
    }

    // A password change bumps the version, which retires older tokens.
    const currentVersion = await getAdminVersion();
    if (Number(payload.ver) !== currentVersion) {
        return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    req.admin = payload;
    next();
}
