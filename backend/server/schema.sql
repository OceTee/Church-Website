-- CAC Possibility Assembly Nation — database schema
-- Applied automatically on server start and by `npm run db:migrate`.
-- Every statement is idempotent, so re-running is safe.

CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imageUrl TEXT NOT NULL,
    date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    flyerUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    audioUrl TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Single admin identity. The password is stored as a scrypt hash + salt, never
-- as plaintext, and `passwordVersion` is bumped on every change so that all
-- previously issued session tokens are invalidated.
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    passwordVersion INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_createdAt ON gallery (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (date ASC);
CREATE INDEX IF NOT EXISTS idx_sermons_createdAt ON sermons (createdAt DESC);
