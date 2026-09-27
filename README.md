# Church Website

CAC Possibility Assembly Nation — React 19 + Vite frontend with an Express 5 API,
deployed entirely on Vercel (static SPA + serverless function).

---

## Stack

| Concern    | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | React 19, Vite 8, Tailwind v4, React Router 7                     |
| API        | Express 5, deployed as a Vercel serverless function (`backend/api/`)  |
| Database   | libSQL — Turso in production, a local SQLite file in development   |
| Uploads    | Vercel Blob in production, `public/uploads` in development         |
| Auth       | Single shared admin password, scrypt-hashed, HMAC-signed 12-hour tokens |

### Why not just SQLite + local uploads?

Vercel functions have no persistent, writable filesystem. A `database.sqlite`
file and anything written to `backend/public/uploads` are discarded on the next cold
start and after every deploy. That is why production uses Turso and Vercel Blob,
and why the code falls back to the local file/disk drivers when those env vars
are absent. Local development is therefore unchanged — no accounts needed.

---

## Local development

The repository is a monorepo with two independently deployable apps:

```
frontend/   React + Vite SPA          -> its own Vercel project
backend/    Express 5 API + /api/*    -> its own Vercel project
```

They are separate because a single-project deployment cannot serve both: a
`"/(.*)" -> "/index.html"` rewrite makes Vercel return the SPA's HTML for every
`/api/*` request, so the API is unreachable. Splitting them gives the frontend
a real API and the API a real function.

```bash
npm run setup           # installs root, backend and frontend dependencies
npm run dev             # Vite on :5173, API on :5000
```

`npm run dev` starts both processes. Vite proxies `/api` and `/uploads` to
`http://localhost:5000`, so the browser only ever talks to one origin.

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to
`frontend/.env`. Both have working local defaults, so they are optional.

Other scripts:

| Script                   | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `npm run build`          | Production frontend build into `frontend/dist/`  |
| `npm run lint`           | ESLint across both apps                         |
| `npm run db:migrate`     | Apply `backend/server/schema.sql` to the database |
| `npm run db:set-password` | Set or reset the admin password                 |
| `npm run dev:backend`    | Run the API alone (no Vite)                      |
| `npm run deploy:backend` | Deploy the backend to Vercel (production)        |
| `npm run deploy:frontend`| Deploy the frontend to Vercel (production)       |

---

## Deploying to Vercel

Two projects, deployed from the two subdirectories. The order matters: deploy
the backend first so you know its URL for the frontend's `VITE_API_URL`.

```bash
vercel link --cwd backend    # or: cd backend && vercel link
vercel --cwd backend --prod
```

Then set the backend's env vars (Vercel dashboard > backend project >
Settings > Environment Variables, and redeploy):

| Variable                | Required | Purpose                                        |
| ----------------------- | -------- | ---------------------------------------------- |
| `ALLOWED_ORIGIN`        | yes      | Frontend origin, e.g. `https://site.vercel.app`. Comma-separate for several. |
| `TURSO_DATABASE_URL`    | yes      | Persistent database                            |
| `TURSO_AUTH_TOKEN`      | yes      | Database credentials                           |
| `BLOB_READ_WRITE_TOKEN` | yes      | Persistent uploads                             |
| `AUTH_SECRET`           | yes      | Signs admin session tokens. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_PASSWORD`        | first run only | Seeds the first admin account. Ignored once the account exists, so a password changed in the panel survives redeploys. |
| `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_RECEIVER` | for the contact form | `EMAIL_PASS` is a Gmail **App Password**, not the account password. |

Generate `AUTH_SECRET` with:
`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

Never set `AUTH_DISABLED` on the public backend. The admin routes can delete
sermons, events and gallery entries, so the bypass is a full content wipe by
anyone who finds the API. A missing `AUTH_SECRET` still starts the server but
signs sessions with a per-instance random value, so admins are signed out on
every cold start. `/api/health` reports these as booleans and never returns a
secret. See [Admin access](#admin-access).

Deploy the frontend, pointing it at the backend:

```bash
vercel link --cwd frontend
vercel env add VITE_API_URL production   # https://<backend>.vercel.app/api
vercel --cwd frontend --prod
```

`VITE_API_URL` is inlined at build time, so it must be set before the build
step runs. A production build with it missing **fails** rather than shipping a
frontend that calls itself and receives HTML.

Verify the API is really returning JSON, not the SPA:

```bash
curl -i https://<backend>.vercel.app/api/health
# Content-Type: application/json
```

### 1. Create the database (Turso)

1. Sign in at <https://turso.new> and create a database, e.g. `church`.
2. Copy the **Database URL** and the **Auth Token** it shows you.

### 2. Create blob storage (Vercel Blob)

1. In the **backend** Vercel project: **Storage → Create → Blob**.
2. Vercel adds a `BLOB_READ_WRITE_TOKEN` environment variable automatically.

> A **Hobby** plan store works with browser-side uploads. If you enable
> client uploads and they fail, switch the store to **Pro**.

### 3. Create the tables

The API applies `backend/server/schema.sql` on every cold start, so tables are
created automatically. To initialise explicitly (or to inspect the result), run
locally with the same env vars set:

```bash
npm run db:migrate
```

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

`/admin/login` takes a single shared password. The password is stored in the
database as a **scrypt hash with a random salt** — the plaintext is never kept,
so a leaked database does not hand it over. The session is a 12-hour
HMAC-signed token in `localStorage` under `cac_admin_token`.

There are no individual user accounts. Use a long, unique password.

### Setting the first password

`ADMIN_PASSWORD` is only read when the `admins` table is **empty**. On the
first boot the server hashes that value and creates the account; on every boot
afterwards the table is already populated, so the env var is ignored. That
means a password changed from the panel survives redeploys and cold starts.

To use one password everywhere, set the same `ADMIN_PASSWORD` in your local
`.env` and in the Vercel environment variables.

### Changing it later

**Admin panel → Change Admin Password.** Requires the current password. In
production a short password is *allowed* but reported as a warning through
`/api/health`, and `admin123` is called out explicitly because it is published
in this repository. Weak passwords are never rejected outright: a working admin
panel matters more than a policy, and the warning tells you what to fix.

Changing it bumps a `passwordVersion` counter embedded in every session token,
so **all other devices and browsers are signed out immediately** — a stolen
token cannot outlive a password change. The device that made the change
receives a fresh token and stays signed in.

Note that the local and production databases are separate. Changing the
password in one does not change the other; set the same initial value in both
if you want them to match, or point local development at the Turso database by
setting `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env` (but then local
uploads write to the production Blob store, so prefer keeping them separate).

### Recovering from a lost password

If you cannot sign in and cannot remember the password, set it directly in the
database. This deliberately bypasses the "only seed when empty" rule, so it
works whether or not an admin account already exists:

```bash
# Locally (backend/server/database.sqlite)
npm run db:set-password -- "your-new-password"

# Against the production database — needs the Turso credentials in .env
TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… \
  npm run db:set-password -- "your-new-password"
```

Run it with no argument to be prompted, and to be asked for confirmation. It
prints which database it is about to change and refuses to run without a
password. Weak passwords are accepted with a warning, never silently.

Afterwards the database is the source of truth and the `ADMIN_PASSWORD` env var
is no longer consulted. Bumping `passwordVersion` signs out every existing
session.

There is deliberately **no HTTP route** that can call this script.

### Disabling authentication (temporary)

Setting `AUTH_DISABLED=true` opens the admin panel with no login at all. Every
`requireAuth` route accepts any request, `/admin` renders without redirecting,
`/api/config` reports `authMode: "disabled"`, and a warning banner appears on
the dashboard. The server prints a loud banner on boot, adding
"THIS IS A PUBLIC DEPLOYMENT" when `NODE_ENV=production`.

> **Never enable this on the public deployment.** The admin routes include
> `DELETE /api/sermons/:id`, `/api/events/:id` and `/api/gallery/:id`, so an
> open panel lets any visitor erase the site's content permanently. There is
> no rate limit or lockout on the admin routes to slow that down.

It is safe for local work, and it is a single flag to undo — delete the line
and restart. The password, its hash, and the login screen are all left intact
rather than commented out, so nothing has to be un-commented later.

### Diagnosing a deployment

`GET /api/health` reports configuration state as booleans and messages — never
secret values:

```json
{
  "status": "ok",
  "database": "ok",
  "storage": "vercel-blob",
  "authSecretConfigured": true,
  "adminAccount": "created",
  "passwordWarning": null,
  "contactEmailConfigured": true
}
```

`status` is `"needs-attention"` (HTTP 503) when `database` is unreachable or
`adminAccount` is `"missing"`. Visit `<your-domain>/api/health` directly, or use
the **"Having trouble signing in? Check the server"** link on the login page.

Nothing in startup is allowed to throw. A missing `ADMIN_PASSWORD`, a missing
`AUTH_SECRET` or an unreachable database is reported here and as a `503` on the
login route, while every other route keeps serving — so a misconfigured
deployment shows a specific, actionable message instead of appearing as a
failed password or a blank error.

---

## Notes

- `backend/server/database.sqlite` and `backend/public/uploads/` are gitignored.
  If the database file was previously committed, run
  `git rm --cached backend/server/database.sqlite` so the local database is not
  shipped to production.
- `backend/.env.example` and `frontend/.env.example` contain placeholders only.
  Never commit a real `.env`.
- The frontend rewrites `/(.*)` to `/index.html` so client-side routes survive a
  hard refresh. The backend has **no** rewrite, so its `/api/*` function is
  always reachable. Keeping that rewrite out of the backend is what makes the
  split necessary and sufficient.
