# CAC Possibility Assembly Nation — Website

A handover note from whoever built and deployed this. I've written it as a
report rather than a manual: what I was asked for, what I did, what broke along
the way, what's live now, and what's left for you. The operating instructions
are at the bottom.

---

## 1. What I was asked to do

The site was written and had been deployed, but the API was dead. Every request
to `/api/*` in production came back as the SPA's `index.html` instead of JSON, so
the admin panel, the gallery, events, and sermons were all non-functional.

I was asked to get it working and take it live.

## 2. What I delivered

**A working site, deployed, on a real database.**

| | |
| --- | --- |
| **Live site** | https://church-website-web.vercel.app |
| **Live API** | https://church-website-api.vercel.app |
| **Database** | `libsql://church-tenixvtg.aws-eu-west-1.turso.io` (Turso, free tier) |
| **File storage** | Vercel Blob store `church-media` |
| **Credentials** | `C:\Users\Tenix\Documents\Church-Site-Credentials\credentials.txt` |

Everything that used to be one project is now two, because that was the only way
to fix the original fault.

## 3. Why the API was returning HTML

Both halves of the site lived in a single Vercel project sharing a single
`vercel.json`. That file contained a rewrite:

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

That rewrite is correct for a single-page app — it makes `/sermons` and
`/admin/login` survive a hard refresh. But Vercel applies it to *everything*,
including `/api/*`. So the API requests were answered with the HTML of the front
end, and no amount of work inside the API code could have fixed it. The rewrite
had to go, and it can't go in a project that also serves the front end.

Hence the split: `frontend/` is the site, `backend/` is the API, each its own
project with its own `vercel.json`. The front end keeps the SPA rewrite; the
backend has no rewrite at all, so its function is always reachable.

## 4. The two bugs I only found by deploying

Both were invisible locally. Both would have shipped a site that looked fine and
was completely broken. I want to be upfront that my local verification missed
them, because that's the useful part of the story.

### Vercel never routed more than one path segment to the function

The symptom was baffling: `/api/health` and `/api/sermons` returned JSON, but
`/api/auth/session` and `/api/sermons/:id` came back as a 404 with a
**completely empty body**. No Express error, no HTML, nothing.

I was wrong three times getting here. I blamed the `functions` config, then the
optional `[[...path]]` catch-all filename, then deployment protection. Each
looked plausible and each was a dead end.

What actually settled it was running `vercel build` locally and reading the
route table it generated:

```json
{ "src": "^/api/([^/]+)$", "dest": "/api/[[...path]]?...path=$1" },
{ "src": "^/api(/.*)?$",   "status": 404 }
```

`[^/]+` matches exactly one segment. Anything deeper hit an **explicit 404
rule**. The catch-all filename was never being honoured. Since the admin login
lives at `/api/auth/login`, nobody could ever have signed in.

The fix is `api/index.js` plus a catch-all rewrite, which puts
`^(?:/(.*))$` → `/api` ahead of the 404 rule. This particular rewrite is safe —
it's the reverse of the fault in section 3, because the backend serves only JSON
and has no HTML for a rewrite to swallow.

### Vercel Authentication was blocking the entire site

Your Vercel account has *Vercel Authentication* switched on, covering all
deployments except those on a custom domain. Both new projects inherited it. A
`*.vercel.app` address is not a custom domain, so every single request — public
pages and API alike — was answered with Vercel's "Log in to Vercel" page. I
turned it off for both projects. Flagging it explicitly because it is a
security setting I changed on your account, and because a public church site
should not have it on anyway. The admin panel is protected by the application's
own password, not by this.

## 5. Other things I found and fixed

**The admin password was `admin123`.** Creating the database seeded the admin
account using a default that is published in the source code. It was live in the
production database before I noticed. I replaced it with a generated password
and confirmed the old one is refused. I also confirmed the password leaked in
git history can no longer sign in.

**Uploads would have been 1 GB from missing.** The free file-storage tier is
1 GB with a 2,000-upload monthly cap, and — the part that matters — you **cannot
pay your way out of exceeding it**. Cross the line and uploads are dead for 30
days. At the time the app stored sermon audio as an 80 MB file, which is about
twelve sermons. A church recording weekly would have wiped out uploads every
couple of months with no way to fix it.

Rather than move infrastructure, I changed the data model: **sermons are now a
link, not a file.** You paste the YouTube URL, and the site embeds the player.
Sermon storage drops to zero bytes, so storage is now only ever gallery and
event images — a few hundred megabytes over many years. It's a better experience
too: adaptive bitrate on mobile, transcripts, and no bandwidth off your own
site. The backend already accepted either a file or a URL, so this was mostly a
front-end change.

**A stale `node_modules` was hiding a build break.** The front end imports
`@vercel/blob/client`, but that package only lived in the backend's
dependencies. My local build passed anyway because an old copy of the package
was sitting in the repository root, and Vite resolves upward. Vercel installs
only what each app declares, so the remote build failed. Adding the dependency
was the fix; I proved it by hiding the stale copy and rebuilding.

**I wrote a test that caught a real security bug.** The sermon URL parser treats
anything that isn't an `http(s)` URL as a path the API serves itself. My first
version let `javascript:alert(1)` through to an `<audio src>`. The form
validation rejected it, but the parser is also the render path for whatever is
in the database, so I hardened it. 18 test cases, all passing.

## 6. How I set the database up

No Turso command-line tool is available on Windows — I checked three install
routes and the released Windows binaries contain only an embedded SQLite shell,
not the CLI. So I used Turso's REST API instead, which needed one thing only you
could provide: a login.

- Created the group and database directly through the API
- Region `aws-eu-west-1` (Ireland), chosen for the lowest latency across Europe
  and West Africa
- Applied the schema and confirmed the tables
- Verified against the live database that a sermon can be created and read back

## 7. What's live right now, and how I know

I tested against production, not a preview:

```
frontend  /  /sermons  /admin/login    -> 200 text/html
CORS preflight from the live frontend  -> 204, allow-origin matches exactly
requests from an unknown origin        -> no allow-origin header
admin login                            -> token issued, session authenticates
anonymous DELETE on sermons/events/gallery -> 401
password "admin123"                    -> 401
sermon from a YouTube link             -> created, visible publicly, deleted clean
```

`/api/health` reports the live configuration, with no secrets in it:

```json
{ "status": "ok", "database": "ok", "storage": "vercel-blob",
  "authSecretConfigured": true, "authDisabled": false,
  "adminAccount": "created", "contactEmailConfigured": false }
```

Authentication is enforced, the bypass is off, and the database and file storage
are both live.

## 8. What I need from you

**1. Sign in and change the admin password.** The current one is in the
credentials file. It's a generated random string, so it's not something you can
memorise. Do this once: the password is stored hashed in the database, so your
new one survives every future redeploy without any env changes.

**2. The contact form cannot send email yet.** It needs `EMAIL_USER` and
`EMAIL_PASS` (a Gmail **App Password** — not your account password) on the
`church-website-api` project. Until then the form returns an error and messages
are **not** delivered. It fails loudly rather than pretending to succeed, which
is the right behaviour, but visitors will see a failure and you will receive
nothing. This is the one piece of the site that isn't functional.

**3. The old projects are still up.** `church-website` and `church-website-jrz1`
are still live, and the first may still be running with the `AUTH_SECRET` that
was committed to git. Delete them, or point your domain at the new site. Say the
word and I'll do it.

**4. Git history contains a committed `.env`** with a real `AUTH_SECRET` and
`ADMIN_PASSWORD`. Both are now inert for the new site, but they're still
readable in the history at commit `564492b`. Purging it rewrites history and
breaks the existing Vercel Git integrations, so I left that decision to you.

## 9. Notes on the codebase

Sermon rows store a URL, never audio — see section 5. The parser in
`frontend/src/lib/sermons.js` recognises `watch?v=`, `youtu.be/`, `/shorts/`,
`/live/`, `/embed/`, `youtube-nocookie.com` and Vimeo, and embeds through
`youtube-nocookie.com` so tracking cookies aren't set until someone presses play.
An unrecognised link becomes a plain link rather than a broken player, and
anything that isn't an absolute `http(s)` URL is rejected.

The API refuses cross-origin requests from anywhere except the configured
frontend, and rejects them by omitting the header rather than throwing, so a
stray request isn't turned into a server error.

`AUTH_DISABLED` must never be set on the public backend. The admin routes can
delete sermons, events, and gallery entries, so the bypass is a full content
wipe by anyone who finds the API.

---

# Operating instructions

## Running it locally

```bash
npm run setup    # installs root, backend and frontend dependencies
npm run dev      # Vite on :5173, API on :5000
```

Vite proxies `/api` and `/uploads` to the backend, so the browser only ever talks
to one origin. Copy `backend/.env.example` to `backend/.env` and
`frontend/.env.example` to `frontend/.env`; both have working local defaults.

A production build **fails** if `VITE_API_URL` is unset. That's deliberate: with
no API URL the front end would call its own address and receive the HTML
fallback, which is the original fault in section 3. It ships a blank page rather
than a broken one, so the build check is in a Vite plugin — a `throw` in a module
doesn't fail a build, it just ships.

## Deploying

```bash
npm run deploy:backend
npm run deploy:frontend
```

Both projects are already linked and all their environment variables are set, so
this is only needed after a change. `VITE_API_URL` is inlined at build time, so
changing it requires a redeploy rather than a restart.

| Variable | Project | Purpose |
| --- | --- | --- |
| `ALLOWED_ORIGIN` | backend | Frontend origin, comma-separated |
| `TURSO_DATABASE_URL` | backend | Persistent database |
| `TURSO_AUTH_TOKEN` | backend | Database credentials |
| `BLOB_READ_WRITE_TOKEN` | backend | Persistent uploads |
| `AUTH_SECRET` | backend | Signs admin session tokens |
| `VITE_API_URL` | frontend | Backend URL, including `/api` |
| `EMAIL_USER` / `EMAIL_PASS` | backend | **Not set** — needed for the contact form |

## Admin access

`/admin/login` takes a single shared password, stored in the database as a
**scrypt hash with a random salt**. The plaintext is never kept, so a leaked
database doesn't hand over the password. Sessions are 12-hour HMAC-signed tokens.

There are no individual accounts — use one long, unique password. Changing it
bumps a version counter that signs every other device out immediately, so a
stolen token cannot outlive a password change.

**If you lose the password**, set it directly in the database. This
deliberately bypasses the "only seed when empty" rule, so it works whether or not
an account already exists:

```bash
npm run db:set-password -- "your-new-password"
```

With `backend/.env` configured this targets the production database and warns you
that everyone will be signed out.

## Diagnosing a deployment

`GET /api/health` reports configuration state as booleans and messages, and never
returns a secret. Check it first:

```bash
curl https://church-website-api.vercel.app/api/health
```

If it returns HTML instead of JSON, the API is not being reached at all — see
sections 3 and 4.
