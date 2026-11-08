// Sermon transcription jobs.
//
// An admin picks a Telegram recording on the dashboard; the API records a job
// and starts the "Transcribe sermon audio" GitHub Actions workflow, which runs
// Whisper on GitHub's free runners and POSTs progress and the finished text
// back to /api/transcriptions/:id/report. The text is kept as a draft until
// the admin loads it into the sermon form, reviews it and publishes.
//
// Environment (see .env.example):
//   GITHUB_DISPATCH_TOKEN       fine-grained token with Actions: read & write
//   TRANSCRIBE_CALLBACK_SECRET  shared with the workflow's repository secret
//   GITHUB_REPOSITORY_SLUG      defaults to OceTee/Church-Website
//   GITHUB_DISPATCH_REF         branch holding the workflow, defaults to main

import crypto from "crypto";
import { query, run } from "./db.js";

const REPO = process.env.GITHUB_REPOSITORY_SLUG || "OceTee/Church-Website";
const REF = process.env.GITHUB_DISPATCH_REF || "main";
const WORKFLOW = "transcribe.yml";
export const TEXT_MAX = 100000;

const STATUSES = new Set(["running", "done", "failed"]);

export function isTranscriptionConfigured() {
    return Boolean(process.env.GITHUB_DISPATCH_TOKEN && process.env.TRANSCRIBE_CALLBACK_SECRET);
}

/** Constant-time check of the secret the workflow sends with each report. */
export function isValidCallbackSecret(given) {
    const expected = process.env.TRANSCRIBE_CALLBACK_SECRET || "";
    if (!expected || typeof given !== "string") return false;
    const a = crypto.createHash("sha256").update(given).digest();
    const b = crypto.createHash("sha256").update(expected).digest();
    return crypto.timingSafeEqual(a, b);
}

const LIST_COLUMNS =
    "id, audioId, title, date, status, progress, error, runUrl, audioSeconds, createdAt, updatedAt, " +
    "length(text) AS textLength";

export function listTranscriptions() {
    return query(`SELECT ${LIST_COLUMNS} FROM transcriptions ORDER BY id DESC LIMIT 20`);
}

export async function getTranscription(id) {
    const rows = await query("SELECT * FROM transcriptions WHERE id = ?", [id]);
    return rows[0] || null;
}

async function dispatchWorkflow(jobId, audioId) {
    const response = await fetch(
        `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "church-website-api",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref: REF,
                inputs: { job_id: String(jobId), audio_id: String(audioId) },
            }),
            signal: AbortSignal.timeout(15000),
        }
    );
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
            `GitHub refused to start the job (${response.status}${detail.message ? `: ${detail.message}` : ""}).`
        );
    }
}

/** Records a job and starts the workflow. Returns the stored job. */
export async function startTranscription({ audioId, title, date }) {
    const { lastID } = await run(
        "INSERT INTO transcriptions (audioId, title, date, status) VALUES (?, ?, ?, 'queued')",
        [audioId, title, date]
    );
    try {
        await dispatchWorkflow(lastID, audioId);
    } catch (error) {
        await run(
            "UPDATE transcriptions SET status = 'failed', error = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
            [error.message.slice(0, 500), lastID]
        );
        throw error;
    }
    return getTranscription(lastID);
}

/**
 * Applies a report from the workflow. A finished job (done or failed) is not
 * reopened, so a late progress report cannot overwrite the result.
 */
export async function applyReport(id, body) {
    const job = await getTranscription(id);
    if (!job) return { status: 404, error: "Unknown job." };
    if (!STATUSES.has(body.status)) return { status: 400, error: "Invalid status." };
    if (job.status === "done" || job.status === "failed") return { status: 409, error: "Job already finished." };

    const text = typeof body.text === "string" ? body.text.slice(0, TEXT_MAX) : null;
    const progress = Number.isFinite(body.progress) ? Math.min(Math.max(body.progress, 0), 1) : null;
    const audioSeconds = Number.isFinite(body.audioSeconds) ? body.audioSeconds : null;
    const runUrl = typeof body.runUrl === "string" && /^https:\/\/github\.com\//.test(body.runUrl) ? body.runUrl : null;
    const error = typeof body.error === "string" ? body.error.slice(0, 500) : null;

    await run(
        `UPDATE transcriptions SET
            status = ?,
            progress = COALESCE(?, progress),
            audioSeconds = COALESCE(?, audioSeconds),
            runUrl = COALESCE(?, runUrl),
            text = CASE WHEN ? = 'done' THEN ? ELSE text END,
            error = CASE WHEN ? = 'failed' THEN ? ELSE NULL END,
            updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [body.status, progress, audioSeconds, runUrl, body.status, text, body.status, error, id]
    );
    return { status: 200 };
}

export async function deleteTranscription(id) {
    const { changes } = await run("DELETE FROM transcriptions WHERE id = ?", [id]);
    return changes > 0;
}
