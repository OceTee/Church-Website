// Recovery tool: creates or replaces the admin password directly in the
// database, bypassing the "only seed when empty" rule.
//
// Run it against the SAME database the deployment uses. If TURSO_DATABASE_URL
// and TURSO_AUTH_TOKEN are set, it targets the production database; otherwise
// it targets the local SQLite file.
//
//   npm run db:set-password -- "your-new-password"
//
// This is a CLI maintenance script. There is deliberately no HTTP route that
// can call it.

import "../server/env.js";
import readline from "readline/promises";
import { stdin, stdout } from "process";
import { client, isRemoteDatabase, ensureSchema, run, query } from "../server/db.js";
import { hashPassword, passwordWarning } from "../server/passwords.js";

const target = isRemoteDatabase
    ? `REMOTE libSQL/Turso database (${process.env.TURSO_DATABASE_URL})`
    : "LOCAL SQLite file (server/database.sqlite)";

async function prompt(question) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer;
}

const targetWarning = isRemoteDatabase
    ? "This is the PRODUCTION database. Everyone will be signed out."
    : "This is the LOCAL database. The production password is unaffected.";

console.log(`Target: ${target}`);
console.log(`       ${targetWarning}`);
console.log("");

const isInteractive = process.stdin.isTTY && process.argv[2] === undefined;

const password = process.argv[2] ?? (isInteractive ? await prompt("New admin password: ") : null);

if (!password) {
    console.error(
        "No password given. Pass it as an argument:\n" +
            '  npm run db:set-password -- "your-new-password"'
    );
    process.exit(1);
}

const warning = passwordWarning(password);
if (warning) {
    console.warn(`WARNING: ${warning}\n`);
}

const confirm = isInteractive
    ? await prompt(`Type "yes" to continue for ${target.split(" ")[0]}: `)
    : "y";

if (confirm.trim().toLowerCase() !== "yes" && confirm.trim().toLowerCase() !== "y") {
    console.log("Aborted. Nothing changed.");
    process.exit(1);
}

try {
    await ensureSchema();

    const { hash, salt } = await hashPassword(password);
    const existing = await query("SELECT id, passwordVersion FROM admins ORDER BY id LIMIT 1");

    if (existing.length > 0) {
        const version = Number(existing[0].passwordVersion) + 1;
        await run(
            "UPDATE admins SET passwordHash = ?, passwordSalt = ?, passwordVersion = ? WHERE id = ?",
            [hash, salt, version, existing[0].id]
        );
        console.log(`Password replaced (passwordVersion ${version}). All sessions invalidated.`);
    } else {
        await run(
            "INSERT INTO admins (username, passwordHash, passwordSalt, passwordVersion) VALUES (?, ?, ?, 1)",
            ["admin", hash, salt]
        );
        console.log("Admin account created (passwordVersion 1).");
    }

    const check = await query("SELECT username, passwordVersion FROM admins");
    console.log("Current state:", JSON.stringify(check));
    console.log("");
    console.log("You can now sign in at /admin/login with that password.");
    if (isRemoteDatabase) {
        console.log("The ADMIN_PASSWORD env var is not needed any more — the database is the source of truth.");
    }

    await client.close();
    process.exit(0);
} catch (error) {
    console.error("Failed to set the password:");
    console.error(error);
    process.exit(1);
}
