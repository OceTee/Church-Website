# Church Website

CAC Possibility Assembly Nation — React 19 + Vite frontend with an Express 5 API,
deployed entirely on Vercel (static SPA + serverless function).

---

## Stack

| Concern    | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | React 19, Vite 8, Tailwind v4, React Router 7                     |
| API        | Express 5, deployed as a Vercel serverless function (`api/`)       |
| Database   | libSQL — Turso in production, a local SQLite file in development   |
| Uploads    | Vercel Blob in production, `public/uploads` in development         |
| Auth       | Single shared admin password, HMAC-signed 12-hour bearer tokens    |

### Why not just SQLite + local uploads?

Vercel functions have no persistent, writable filesystem. A `database.sqlite`
file and anything written to `public/uploads` are discarded on the next cold
start and after every deploy. That is why production uses Turso and Vercel Blob,
and why the code falls back to the local file/disk drivers when those env vars
are absent. Local development is therefore unchanged — no accounts needed.

---

## Local development

```bash
npm install
cp .env.example .env     # optional; safe defaults work for local dev
npm run db:migrate       # creates/updates server/database.sqlite
npm run dev              # Vite on :5173, API on :5000
```

`npm run dev` starts both processes. Vite proxies `/api` and `/uploads` to
`http://localhost:5000`, so the browser only ever talks to one origin.

Other scripts:

| Script                | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `npm run build`       | Production frontend build into `dist/`    |
| `npm run lint`        | ESLint across frontend, server and `api/` |
| `npm run db:migrate`  | Apply `server/schema.sql` to the database |
| `npm start`           | Run the API alone (no Vite)               |

---

## Deploying to Vercel

### 1. Create the database (Turso)

1. Sign in at <https://turso.new> and create a database, e.g. `church`.
2. Copy the **Database URL** and the **Auth Token** it shows you.

### 2. Create blob storage (Vercel Blob)

1. In the Vercel project: **Storage → Create → Blob**.
2. Vercel adds a `BLOB_READ_WRITE_TOKEN` environment variable automatically.

> A **Hobby** plan store works with browser-side uploads. If you enable
> client uploads and they fail, switch the store to **Pro**.

### 3. Import the repository

Push the repository to GitHub, then **Add New → Project** in Vercel and import
it. `vercel.json` already supplies the build command, output directory and
rewrite rules, so no build settings need changing.

### 4. Add environment variables

Project **Settings → Environment Variables**, for *all* environments:

| Variable                | Required | Value                                          |
| ----------------------- | -------- | ---------------------------------------------- |
| `AUTH_SECRET`           | yes      | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_PASSWORD`        | yes      | The password used at `/admin/login`            |
| `TURSO_DATABASE_URL`    | yes      | `libsql://…turso.io` from step 1              |
| `TURSO_AUTH_TOKEN`      | yes      | Auth token from step 1                        |
| `BLOB_READ_WRITE_TOKEN` | yes      | Added automatically in step 2                 |
| `EMAIL_USER`            | contact  | Gmail address that sends the message          |
| `EMAIL_PASS`            | contact  | Gmail **App Password** (not the account password) |
| `EMAIL_RECEIVER`        | optional | Where form messages should land; defaults to `EMAIL_USER` |

`AUTH_SECRET` and `ADMIN_PASSWORD` have no production fallback — the API throws
on boot without them rather than running on a well-known default.

### 5. Create the tables

The API applies `server/schema.sql` on every cold start, so tables are created
automatically. To initialise explicitly (or to inspect the result), run locally
with the same env vars set:

```bash
npm run db:migrate
```

### 6. Deploy

Every push to the main branch redeploys. Check **Settings → Environment
Variables** if the first deploy fails — a missing variable is the usual cause.

### 7. Point the front end at the deployment

`src/lib/urls.js` defaults to same-origin `/api`, which is already correct for
a single Vercel project. `VITE_API_URL` / `VITE_ASSET_URL` are only needed if
the API is hosted somewhere else, and must be set at **build** time.

---

## How uploads work

Vercel functions cap a request body at **4.5 MB**, which is far below the 80 MB
sermon-audio limit. So the transport is chosen at runtime:

1. The dashboard calls `GET /api/config`, which reports `uploadMode`.
2. **`server` mode** (no `BLOB_READ_WRITE_TOKEN`, i.e. local): the browser sends
   `multipart/form-data` to `/api/gallery`, `/api/events` or `/api/sermons`, and
   the API writes to `public/uploads` and inserts the row.
3. **`direct` mode** (on Vercel): the browser requests a 5-minute,
   category-scoped upload grant from `POST /api/uploads/grant`, PUTs the file
   straight to Vercel Blob, then POSTs only the resulting URL to the API, which
   inserts the row.

Sizes and MIME types are validated server-side on both paths. `@vercel/blob/client`
is dynamically imported, so it is never bundled into the pages visitors load.

---

## Admin access

`/admin/login` takes the single `ADMIN_PASSWORD`. The session is a 12-hour
HMAC-signed token in `localStorage` under `cac_admin_token`. There are no
individual user accounts, so use a long, unique password and rotate it if it
ever leaks.

---

## Notes

- `server/database.sqlite` and `public/uploads/` are gitignored. If they were
  previously committed, run `git rm --cached server/database.sqlite` so the
  local database is not shipped to production.
- `.env.example` contains placeholders only. Never commit a real `.env`.
- `/api/*` is handled by the serverless function; every other path falls through
  to `/index.html` so client-side routes survive a hard refresh.
