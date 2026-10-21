import "../server/env.js";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
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
const BLOB_HOST = /\.blob\.vercel-storage\.com$/i;

function plainRow(row) {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value])
    );
}

function safeMediaUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && BLOB_HOST.test(url.hostname);
    } catch {
        return false;
    }
}

async function main() {
    if (!isRemoteDatabase && process.env.BACKUP_ALLOW_LOCAL !== "true") {
        throw new Error("Refusing to back up the local SQLite fallback. Set TURSO_DATABASE_URL for production, or BACKUP_ALLOW_LOCAL=true explicitly.");
    }

    const stamp = new Date().toISOString().replaceAll(":", "-");
    const outputDirectory = path.resolve(
        process.env.BACKUP_OUTPUT_DIR || path.join(__dirname, "..", "backups", stamp)
    );
    await mkdir(path.dirname(outputDirectory), { recursive: true, mode: 0o700 });
    await mkdir(outputDirectory, { recursive: false, mode: 0o700 });
    await mkdir(path.join(outputDirectory, "media"), { mode: 0o700 });

    const transaction = await client.transaction("read");
    let tables;
    try {
        const resultSets = await transaction.batch(TABLES.map((table) => ({ sql: `SELECT * FROM "${table}"` })));
        tables = Object.fromEntries(
            TABLES.map((table, index) => [table, resultSets[index].rows.map(plainRow)])
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback().catch(() => {});
        throw error;
    }

    const mediaUrls = new Set();
    for (const [table, fields] of Object.entries(MEDIA_FIELDS)) {
        for (const row of tables[table]) {
            for (const field of fields) {
                if (safeMediaUrl(row[field])) mediaUrls.add(row[field]);
            }
        }
    }

    const media = [];
    let totalMediaBytes = 0;
    for (const url of mediaUrls) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Could not back up a referenced Blob file (HTTP ${response.status}). No complete backup was written.`);
        }
        const content = Buffer.from(await response.arrayBuffer());
        const extension = path.extname(new URL(url).pathname).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 12);
        const filename = `${createHash("sha256").update(url).digest("hex")}${extension || ".bin"}`;
        await writeFile(path.join(outputDirectory, "media", filename), content, { mode: 0o600, flag: "wx" });
        media.push({ url, filename, contentType: response.headers.get("content-type") || "application/octet-stream", sizeBytes: content.byteLength });
        totalMediaBytes += content.byteLength;
    }

    const schema = await readFile(path.join(__dirname, "..", "server", "schema.sql"), "utf8");
    await writeFile(path.join(outputDirectory, "data.json"), JSON.stringify(tables), { mode: 0o600, flag: "wx" });
    await writeFile(path.join(outputDirectory, "media-index.json"), JSON.stringify(media, null, 2), { mode: 0o600, flag: "wx" });
    await writeFile(path.join(outputDirectory, "schema.sql"), schema, { mode: 0o600, flag: "wx" });

    const manifest = {
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        database: isRemoteDatabase ? new URL(process.env.TURSO_DATABASE_URL).host : "local SQLite",
        tables: Object.fromEntries(TABLES.map((table) => [table, tables[table].length])),
        managedBlobFiles: media.length,
        managedBlobBytes: totalMediaBytes,
        note: "External media URLs are recorded in data.json but their files are not copied. Keep this directory private; it contains admin hashes and personal data.",
    };
    await writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(manifest, null, 2), { mode: 0o600, flag: "wx" });

    console.log(`Backup complete: ${outputDirectory}`);
    console.log(JSON.stringify(manifest, null, 2));
    await client.close();
}

main().catch(async (error) => {
    console.error(`[backup] ${error.message}`);
    await client.close().catch(() => {});
    process.exitCode = 1;
});
