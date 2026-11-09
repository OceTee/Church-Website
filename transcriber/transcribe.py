"""Transcribe one Telegram sermon recording and send the text to the API.

Run by .github/workflows/transcribe.yml when an admin presses "Transcribe"
on the dashboard. It downloads the recording from the API's range endpoint,
runs Whisper (faster-whisper, on the CPU) and reports progress and the final
text back to the API, which keeps it as a draft for the admin to review.

Environment:
  API_BASE         e.g. https://church-website-api.vercel.app/api
  JOB_ID           the transcription job's id in the API database
  AUDIO_ID         the Telegram post id of the recording
  CALLBACK_SECRET  shared secret the API checks on every report
  RUN_URL          link to this Actions run (optional, shown to the admin)
  WHISPER_MODEL    defaults to large-v3-turbo

Local test without the API:  python transcribe.py --local recording.mp3
"""

import json
import os
import sys
import time
import traceback
import urllib.error
import urllib.request

PARAGRAPH_SECONDS = 60
PROGRESS_EVERY_SECONDS = 60
CHUNK_BYTES = 2 * 1024 * 1024  # the API serves audio in 2 MB ranges


def env(name, default=None):
    value = os.environ.get(name, default)
    if value is None:
        sys.exit(f"Missing environment variable {name}")
    return value


def http(method, url, body=None, headers=None, attempts=4):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(attempts):
        request = urllib.request.Request(url, data=data, method=method, headers={
            "User-Agent": "church-website-transcriber",
            **({"Content-Type": "application/json"} if data else {}),
            **(headers or {}),
        })
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.status, dict(response.headers), response.read()
        except urllib.error.HTTPError as error:
            if error.code < 500 or attempt == attempts - 1:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == attempts - 1:
                raise
        time.sleep(5 * (attempt + 1))


def report(**fields):
    """Sends a status update for this job. Never prints the transcript."""
    if os.environ.get("LOCAL_ONLY"):
        return
    url = f"{env('API_BASE')}/transcriptions/{env('JOB_ID')}/report"
    http("POST", url, fields, {"X-Transcribe-Secret": env("CALLBACK_SECRET").strip()})


def download(audio_id, path):
    url = f"{env('API_BASE')}/telegram/audio/{audio_id}/stream"
    offset, total = 0, None
    with open(path, "wb") as out:
        while total is None or offset < total:
            _, headers, chunk = http("GET", url, headers={"Range": f"bytes={offset}-{offset + CHUNK_BYTES - 1}"})
            content_range = headers.get("Content-Range") or headers.get("content-range") or ""
            if "/" in content_range:
                total = int(content_range.rsplit("/", 1)[1])
            if not chunk:
                break
            out.write(chunk)
            offset += len(chunk)
            if total is None:  # a server that ignored the Range header sent it all
                break
    print(f"Downloaded {offset / 1e6:.1f} MB", flush=True)
    return path


def to_paragraphs(segments):
    """Joins Whisper's segments into paragraphs of about a minute each."""
    paragraphs, current, start = [], [], None
    for segment in segments:
        text = segment.text.strip()
        if not text:
            continue
        if start is None:
            start = segment.start
        current.append(text)
        long_enough = segment.end - start >= PARAGRAPH_SECONDS
        if (long_enough and text[-1:] in ".!?") or segment.end - start >= PARAGRAPH_SECONDS * 1.5:
            paragraphs.append(" ".join(current))
            current, start = [], None
    if current:
        paragraphs.append(" ".join(current))
    return "\n\n".join(paragraphs)


def transcribe(path):
    from faster_whisper import WhisperModel

    model_name = os.environ.get("WHISPER_MODEL", "large-v3-turbo")
    threads = os.cpu_count() or 4
    print(f"Loading {model_name} on {threads} CPU threads", flush=True)
    model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=threads)

    started = time.time()
    segments, info = model.transcribe(
        path,
        # Sermons mix English and Yoruba, so detect the language per segment
        # instead of once for the whole recording.
        multilingual=True,
        # Skip silence and long music, which makes Whisper invent text.
        vad_filter=True,
        # Stops one misheard phrase from repeating through what follows.
        condition_on_previous_text=False,
    )
    duration = info.duration or 0
    print(f"Audio is {duration / 60:.1f} min", flush=True)

    collected, last_report = [], time.time()
    for segment in segments:
        collected.append(segment)
        if time.time() - last_report >= PROGRESS_EVERY_SECONDS:
            last_report = time.time()
            done = min(segment.end / duration, 1) if duration else None
            print(f"  {segment.end / 60:.1f} of {duration / 60:.1f} min after {(time.time() - started) / 60:.1f} min", flush=True)
            try:
                report(status="running", progress=done, audioSeconds=duration)
            except Exception as error:  # progress is optional; keep going
                print(f"  (progress report failed: {error})", flush=True)

    elapsed = time.time() - started
    print(f"Transcribed {duration / 60:.1f} min of audio in {elapsed / 60:.1f} min", flush=True)
    return to_paragraphs(collected), duration


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--local":
        os.environ["LOCAL_ONLY"] = "1"
        text, _ = transcribe(sys.argv[2])
        print("\n" + text)
        return

    audio_id = env("AUDIO_ID")
    try:
        report(status="running", progress=0, runUrl=os.environ.get("RUN_URL"))
        path = download(audio_id, "/tmp/sermon-audio")
        text, duration = transcribe(path)
        report(status="done", progress=1, text=text, audioSeconds=duration)
        print("Draft sent to the API.", flush=True)
    except Exception as error:
        traceback.print_exc()
        if isinstance(error, urllib.error.HTTPError) and error.code == 401:
            print("The API rejected TRANSCRIBE_CALLBACK_SECRET: the repository secret and the "
                  "backend's environment variable must hold exactly the same value.", flush=True)
        try:
            report(status="failed", error=str(error)[:500])
        finally:
            sys.exit(1)


if __name__ == "__main__":
    main()
