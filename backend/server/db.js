import "./env.js";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PLACEHOLDER_SERMON } from "./placeholderSermon.js";

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

/**
 * Sermons used to be links to recordings (title, date, audioUrl) and are now
 * written sermons. An old-shape table is rebuilt once, inside one transaction,
 * using the CREATE statement from schema.sql. Any old rows are kept, with the
 * recording link as their body, so nothing is lost.
 */
async function migrateSermonsToText(schemaStatements) {
    const columns = (await client.execute("PRAGMA table_info(sermons)")).rows.map((row) => row.name);
    if (!columns.includes("audioUrl")) return;

    // The index moves with the renamed table, so it is dropped first or the
    // schema's CREATE INDEX IF NOT EXISTS would skip the new table.
    await client.batch(
        [
            "ALTER TABLE sermons RENAME TO sermons_old",
            "DROP INDEX IF EXISTS idx_sermons_createdAt",
            ...schemaStatements,
            `INSERT INTO sermons (id, title, speaker, speakerImageUrl, body, date, createdAt)
             SELECT id, title, '', NULL, 'Recording: ' || audioUrl, date, createdAt FROM sermons_old`,
            "DROP TABLE sermons_old",
        ].map((sql) => ({ sql })),
        "write"
    );
    console.log("[db] Migrated sermons to the written-sermon format.");
}

/**
 * Events gained an optional end date so a programme can run over several
 * days. A database created before that gets the column added once.
 */
async function migrateEventsEndDate() {
    const columns = (await client.execute("PRAGMA table_info(events)")).rows.map((row) => row.name);
    if (columns.includes("endDate")) return;
    await client.execute("ALTER TABLE events ADD COLUMN endDate TEXT");
    console.log("[db] Added events.endDate for multi-day events.");
}

/** Creates the sample sermon once per database. See placeholderSermon.js. */
async function seedPlaceholderSermon() {
    const claimed = await client.execute({
        sql: "INSERT INTO app_meta (key, value) VALUES ('placeholderSermonSeeded', ?) ON CONFLICT(key) DO NOTHING",
        args: [new Date().toISOString()],
    });
    if (Number(claimed.rowsAffected) === 0) return;

    const { title, speaker, speakerImageUrl, body } = PLACEHOLDER_SERMON;
    await client.execute({
        sql: "INSERT INTO sermons (title, speaker, speakerImageUrl, body, date) VALUES (?, ?, ?, ?, date('now'))",
        args: [title, speaker, speakerImageUrl, body],
    });
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
            // Comments are stripped first so a `;` inside one cannot split a
            // statement in half.
            const sql = fs
                .readFileSync(path.join(__dirname, "schema.sql"), "utf8")
                .replace(/--.*$/gm, "");
            const statements = sql
                .split(";")
                .map((statement) => statement.trim())
                .filter(Boolean);

            await client.batch(statements.map((statement) => ({ sql: statement })), "write");
            await migrateSermonsToText(statements);
            await migrateEventsEndDate();
            await seedPlaceholderSermon();
        })().catch((error) => {
            // Let the next caller retry instead of caching a failure forever.
            schemaPromise = null;
            throw error;
        });
    }
    return schemaPromise;
}
