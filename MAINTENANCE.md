# Website maintenance guide

## Automated checks

GitHub Actions runs a production frontend build, Playwright route/mobile checks,
serious/critical axe accessibility checks, and backend JavaScript syntax checks
on pushes to `main` and pull requests. Locally, run `npm ci`, `npm run build`,
and `npm run test:e2e` in `frontend/`; run `npm ci` and the `node --check`
commands in the backend workflow from `backend/`.

## Daily alerts and capacity

The backend Vercel project is configured to call `/api/maintenance/monitor`
daily at 08:00 UTC. In Vercel, set a long random `CRON_SECRET` for Production;
Vercel sends it as a Bearer token. The check emails configured alerts using the
existing `EMAIL_USER`, `EMAIL_PASS`, and optional `EMAIL_RECEIVER` settings.
Confirm those SMTP settings can send mail. It warns at 85% of the configured
Turso and Blob ceilings. Set `TURSO_STORAGE_LIMIT_BYTES` and
`BLOB_STORAGE_LIMIT_BYTES` to the real usable capacity for this account; built-in
defaults are conservative estimates and cannot discover plan entitlements.
Existing upload-time oldest-gallery-photo cleanup remains responsible for
making room; the daily monitor only alerts and does not delete files.

## Backups and restore

The daily GitHub Actions backup is disabled until repository variable
`ENABLE_AUTOMATED_BACKUPS` is set to `true`. Configure Actions secrets
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `BLOB_READ_WRITE_TOKEN`. Backups
include application tables and copies of app-managed Vercel Blob photos. They
contain admin password hashes and personal data: restrict GitHub repository and
Actions artifact access, and review the 30-day retention policy against church
privacy obligations. Keep an additional copy outside the repository/GitHub.

Create a fresh backup with `npm run db:backup` from `backend/`. Review the
contents, then preview a restore using `npm run db:restore -- <backup-folder>`.
To apply, use `npm run db:restore -- <backup-folder> --apply` and type the exact
target database host. Restore replaces application tables; verify the site and
admin access afterward. Any non-Vercel external image URLs are preserved as
URLs but are not copied into the media archive.

## Content, SEO, and accessibility

Keep public route metadata and `frontend/public/sitemap.xml` in sync when adding
routes. Update gallery photos and sermons through the admin area. Use keyboard
navigation, reduced-motion preferences, and a mobile viewport during manual
review; axe checks cannot identify every accessibility issue or replace a
human review.

## Before each production release

Review the CI result, Vercel deployment/build logs, `/api/health`, contact-form
delivery, upload/cleanup behavior, and a recent backup artifact. Perform a
periodic restore drill against a disposable Turso database and Blob store.
