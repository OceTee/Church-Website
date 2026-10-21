import { query, run } from "./db.js";

// Fixed-window rate limiting backed by the database, so the count is shared by
// every serverless instance instead of resetting on each cold start.

/**
 * The client's IP address. On Vercel `x-real-ip` and `x-forwarded-for` are
 * set by the edge network, which overwrites any value the client sends.
 */
export function clientIp(req) {
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    return String(req.headers["x-real-ip"] || "").trim() || forwarded || req.socket?.remoteAddress || "unknown";
}

/**
 * Records one hit for `key` in `bucket` and reports whether it is within
 * `limit` hits per `windowMs`. Fails open: if the database is unreachable the
 * request is allowed, because the route itself will then fail anyway.
 */
export async function hit(bucket, key, { limit, windowMs }) {
    const now = Date.now();
    try {
        const rows = await query(
            `INSERT INTO rate_limits (id, count, resetAt) VALUES (?, 1, ?)
             ON CONFLICT(id) DO UPDATE SET
                 count = CASE WHEN rate_limits.resetAt <= ? THEN 1 ELSE rate_limits.count + 1 END,
                 resetAt = CASE WHEN rate_limits.resetAt <= ? THEN excluded.resetAt ELSE rate_limits.resetAt END
             RETURNING count, resetAt`,
            [`${bucket}:${key}`, now + windowMs, now, now]
        );

        // Expired rows are only ever overwritten, so sweep them occasionally.
        if (Math.random() < 0.02) {
            run("DELETE FROM rate_limits WHERE resetAt <= ?", [now]).catch(() => {});
        }

        const { count, resetAt } = rows[0];
        return {
            allowed: Number(count) <= limit,
            retryAfterSeconds: Math.max(1, Math.ceil((Number(resetAt) - now) / 1000)),
        };
    } catch (error) {
        console.error(`[rate-limit] ${bucket} check failed, allowing request`, error);
        return { allowed: true, retryAfterSeconds: 0 };
    }
}

/** Express middleware that answers 429 once `limit` is exceeded. */
export function rateLimit(bucket, options, message) {
    return async (req, res, next) => {
        const result = await hit(bucket, clientIp(req), options);
        if (result.allowed) return next();
        res.setHeader("Retry-After", String(result.retryAfterSeconds));
        return res.status(429).json({ error: message });
    };
}
