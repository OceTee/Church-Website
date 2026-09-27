import "./env.js";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localFilePath = path.join(__dirname, "database.sqlite");
const remoteUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Production talks to a remote libSQL (Turso) database. Local development
// falls back to a SQLite file so the app keeps working with no setup.
const url = remoteUrl || `file:${localFilePath.replace(/\\/g, "/")}`;

if (!remoteUrl && !process.env.NODE_ENV) {
    console.log(`[db] Using local SQLite file: ${localFilePath}`);
}

export const isRemoteDatabase = Boolean(remoteUrl);

export const client = createClient({
    url,
    ...(authToken ? { authToken } : {}),
});

// libSQL only accepts primitives, and rejects `undefined`.
function normalizeParam(value) {
    if (value === undefined) return null;
    if (typeof value === "boolean") return value ? 1 : 0;
    return value;
}

export async function query(sql, params = []) {
    const result = await client.execute({
        sql,
        args: params.map(normalizeParam),
    });
    return result.rows;
}

export async function run(sql, params = []) {
    const result = await client.execute({
        sql,
        args: params.map(normalizeParam),
    });
    return {
        lastID: Number(result.lastInsertRowid ?? 0),
        changes: Number(result.rowsAffected ?? 0),
    };
}

let schemaPromise = null;

/**
 * Creates any missing tables/indexes. Safe to call repeatedly and safe to call
 * concurrently — the first call does the work, the rest await the same promise.
 * The statements are batched so a cold start costs a single round trip.
 */
export function ensureSchema() {
    if (!schemaPromise) {
        schemaPromise = (async () => {
            const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
            const statements = sql
                .split(";")
                .map((statement) => statement.trim())
                .filter(Boolean);

            await client.batch(statements.map((statement) => ({ sql: statement })), "write");
        })().catch((error) => {
            // Let the next caller retry instead of caching a failure forever.
            schemaPromise = null;
            throw error;
        });
    }
    return schemaPromise;
}
