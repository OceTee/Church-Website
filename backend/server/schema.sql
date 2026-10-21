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

-- Written sermons. An older shape (title, date, audioUrl) is rebuilt into this
-- one by migrateSermonsToText() in db.js.
CREATE TABLE IF NOT EXISTS sermons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    speaker TEXT NOT NULL,
    speakerImageUrl TEXT,
    body TEXT NOT NULL,
    date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Members' birthdays, celebrated on the home page on `date` (YYYY-MM-DD).
-- Rows, and their photos, are deleted once the date has passed; see
-- purgePastBirthdays() in app.js.
CREATE TABLE IF NOT EXISTS birthdays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    wishes TEXT NOT NULL,
    photoUrl TEXT NOT NULL,
    date TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- One-off flags, e.g. that the placeholder sermon has been created, so it is
-- not recreated after an admin deletes it.
CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
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

-- Fixed-window request counters for the public endpoints (login, contact).
-- Kept in the database rather than in memory because every serverless
-- instance has its own memory, which would make a per-process limit useless.
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    resetAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gallery_createdAt ON gallery (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (date ASC);
CREATE INDEX IF NOT EXISTS idx_sermons_createdAt ON sermons (createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_birthdays_date ON birthdays (date ASC);
