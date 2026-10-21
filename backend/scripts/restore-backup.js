import "../server/env.js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { client, isRemoteDatabase } from "../server/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TABLES = ["app_meta", "admins", "birthdays", "events", "gallery", "rate_limits", "sermons"];
const MEDIA_FIELDS = {
    birthdays: ["photoUrl"],
    events: ["flyerUrl"],
    gallery: ["imageUrl"],
    sermons: ["speakerImageUrl"],
};

async function main() {
    const backupDirectory = path.resolve(process.argv[2] || "");
    const apply = process.argv.includes("--apply");
    if (!process.argv[2]) throw new Error("Usage: npm run db:restore -- <backup-folder> [--apply]");
    if (!isRemoteDatabase) throw new Error("Restore requires TURSO_DATABASE_URL; refusing to modify a local database.");

    const [manifest, tables, media] = await Promise.all([
        readFile(path.join(backupDirectory, "manifest.json"), "utf8").then(JSON.parse),
        readFile(path.join(backupDirectory, "data.json"), "utf8").then(JSON.parse),
        readFile(path.join(backupDirectory, "media-index.json"), "utf8").then(JSON.parse),
    ]);
    if (manifest.formatVersion !== 1 || !tables || !Array.isArray(media)) {
        throw new Error("Unsupported or incomplete backup format.");
    }
    for (const table of TABLES) {
        if (!Array.isArray(tables[table])) throw new Error(`Backup is missing the ${table} table.`);
    }

    const target = new URL(process.env.TURSO_DATABASE_URL).host;
    console.log(`Backup created ${manifest.createdAt} for ${manifest.database}.`);
    console.log(`Target database: ${target}`);
    console.log(`Rows to replace: ${TABLES.reduce((sum, table) => sum + tables[table].length, 0)}; managed Blob files: ${media.length}.`);
    if (!apply) {
        console.log("Dry run only. Add --apply to replace all application tables after reviewing this target.");
        return;
    }
    if (!stdin.isTTY) throw new Error("Applying a restore requires an interactive terminal confirmation.");
    const terminal = readline.createInterface({ input: stdin, output: stdout });
    const confirmation = await terminal.question(`Type RESTORE ${target} to replace its application data: `);
    terminal.close();
    if (confirmation !== `RESTORE ${target}`) throw new Error("Confirmation did not match; no database changes were made.");

    const urlMap = new Map();
    const { put } = await import("@vercel/blob");
    for (const item of media) {
        const existing = await fetch(item.url, { method: "HEAD" }).catch(() => null);
        if (existing?.ok) {
            urlMap.set(item.url, item.url);
            continue;
        }
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error("A backed-up Blob file is missing and BLOB_READ_WRITE_TOKEN is not configured; the database was not changed.");
        }
        const bytes = await readFile(path.join(backupDirectory, "media", item.filename));
        const filename = `restore/${Date.now()}/${item.filename}`;
        const uploaded = await put(filename, bytes, {
            access: "public",
            addRandomSuffix: true,
            contentType: item.contentType,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        urlMap.set(item.url, uploaded.url);
    }

    for (const [table, fields] of Object.entries(MEDIA_FIELDS)) {
        for (const row of tables[table]) {
            for (const field of fields) {
                if (urlMap.has(row[field])) row[field] = urlMap.get(row[field]);
            }
        }
    }

    const statements = TABLES.map((table) => ({ sql: `DELETE FROM "${table}"` }));
    for (const table of TABLES) {
        for (const row of tables[table]) {
            const columns = Object.keys(row);
            if (columns.length === 0) continue;
            statements.push({
                sql: `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
                args: columns.map((column) => row[column] ?? null),
            });
        }
    }

    const transaction = await client.transaction("write");
    try {
        for (let offset = 0; offset < statements.length; offset += 200) {
            await transaction.batch(statements.slice(offset, offset + 200));
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback().catch(() => {});
        throw error;
    }

    console.log("Restore completed. Verify the public site and admin login before resuming uploads.");
}

main().catch(async (error) => {
    console.error(`[restore] ${error.message}`);
    await client.close().catch(() => {});
    process.exitCode = 1;
});
