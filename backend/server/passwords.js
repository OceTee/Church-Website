import "./env.js";
import crypto from "crypto";

// Password hashing, kept separate from auth.js so that CLI maintenance scripts
// can reuse it without importing the request-handling auth logic.

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_PASSWORD = "admin123";

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

export async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = await deriveKey(password, salt);
    return { hash: derived.toString("hex"), salt: salt.toString("hex") };
}

export async function verifyHashedPassword(password, hash, salt) {
    if (typeof password !== "string" || password.length === 0) return false;

    const derived = await deriveKey(password, Buffer.from(salt, "hex"));
    const expected = Buffer.from(hash, "hex");

    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
}

export function passwordWarning(password) {
    if (typeof password !== "string" || password.length === 0) {
        return "Password is empty.";
    }
    if (password === DEFAULT_PASSWORD) {
        return `The password "${DEFAULT_PASSWORD}" is the development default and is public in the source code. Change it.`;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password is only ${password.length} characters; ${MIN_PASSWORD_LENGTH}+ is recommended.`;
    }
    return null;
}

export { MIN_PASSWORD_LENGTH, DEFAULT_PASSWORD };
