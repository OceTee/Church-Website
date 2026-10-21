import "../server/env.js";
import { client, isRemoteDatabase, ensureSchema } from "../server/db.js";
import { ensureAdminAccount } from "../server/auth.js";

const url = isRemoteDatabase ? "remote libSQL (Turso)" : "local SQLite file";

console.log(`Applying schema to ${url}...`);

try {
    await ensureSchema();
    const tables = await client.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    console.log("Schema applied. Tables present:");
    for (const row of tables.rows) {
        console.log(`  - ${row.name}`);
    }

    // Null when AUTH_DISABLED is set, or in production without ADMIN_PASSWORD;
    // ensureAdminAccount has already logged why.
    const admin = await ensureAdminAccount();
    if (admin) {
        console.log(
            `Admin account "${admin.username}" is ready (password version ${admin.passwordVersion}).`
        );
    } else {
        console.warn("No admin account was created. See the message above.");
    }
    process.exit(0);
} catch (error) {
    console.error("Migration failed:");
    console.error(error);
    process.exit(1);
}
