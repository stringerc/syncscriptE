"""
Kokoro ONNX TTS Server — Lightweight, fast, free, local.

Uses ONNX Runtime for ~3x faster inference than PyTorch Docker.
Serves an OpenAI-compatible /v1/audio/speech endpoint.

Start: ./venv/bin/python server.py
"""

import io
import os
import time
import logging
import wave
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s [TTS] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("tts")

MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "kokoro.onnx"
VOICES_PATH = MODEL_DIR / "voices.bin"

app = FastAPI(title="Kokoro TTS (ONNX)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

kokoro = None

def get_kokoro():
    global kokoro
    if kokoro is None:
        from kokoro_onnx import Kokoro
        log.info("Loading ONNX model...")
        t0 = time.time()
        kokoro = Kokoro(str(MODEL_PATH), str(VOICES_PATH))
        log.info(f"Model loaded in {time.time()-t0:.1f}s")
        # Warm up
        kokoro.create("warmup", voice="af_heart", speed=1.0, lang="en-us")
        log.info("Voice warmed up")
    return kokoro


def samples_to_wav(samples, sr: int) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        import numpy as np
        audio_int16 = (samples * 32767).astype(np.int16)
        wf.writeframes(audio_int16.tobytes())
    return buf.getvalue()


def samples_to_mp3(samples, sr: int) -> bytes:
    """Convert samples to MP3 using ffmpeg (available on most systems)."""
    import subprocess
    import numpy as np

    audio_int16 = (samples * 32767).astype(np.int16)
    pcm_bytes = audio_int16.tobytes()

    try:
        proc = subprocess.run(
            [
                "ffmpeg", "-y", "-f", "s16le", "-ar", str(sr),
                "-ac", "1", "-i", "pipe:0",
                "-codec:a", "libmp3lame", "-b:a", "128k",
                "-f", "mp3", "pipe:1",
            ],
            input=pcm_bytes,
            capture_output=True,
            timeout=10,
        )
        if proc.returncode == 0 and len(proc.stdout) > 100:
            return proc.stdout
    except Exception:
        pass

    # Fallback: return WAV if ffmpeg unavailable
    return samples_to_wav(samples, sr)


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/v1/audio/speech")
async def speech(request: Request):
    body = await request.json()
    text = body.get("input", "")
    voice = body.get("voice", "af_heart")
    # Map SyncScript / Vercel Kokoro preset ids → ONNX voice ids (local server)
    SYNCSCRIPT_VOICE_ALIASES = {
        "cortana": "af_heart",
        "nexus": "af_kore",
        "nexus_emphatic": "af_kore",
        "nexus_query": "af_sky",
        "commander": "af_kore",
        "professional": "af_sarah",
        "gentle": "af_heart",
        "playful": "af_bella",
        "natural": "af_sky",
    }
    voice = SYNCSCRIPT_VOICE_ALIASES.get(voice, voice)
    fmt = body.get("response_format", "mp3")
    speed = body.get("speed", 1.0)

    if not text.strip():
        return JSONResponse({"error": "No input text"}, status_code=400)

    k = get_kokoro()
    t0 = time.time()

    try:
        samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    except Exception as e:
        log.error(f"Synthesis failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

    elapsed = time.time() - t0
    audio_dur = len(samples) / sr

    if fmt == "wav":
        audio_bytes = samples_to_wav(samples, sr)
        content_type = "audio/wav"
    else:
        audio_bytes = samples_to_mp3(samples, sr)
        content_type = "audio/mpeg"

    log.info(f"Synth: {len(text)}ch → {len(audio_bytes)}b {fmt} in {elapsed*1000:.0f}ms (audio={audio_dur:.1f}s) [{voice}]")

    return Response(
        content=audio_bytes,
        media_type=content_type,
        headers={
            "X-TTS-Latency": f"{elapsed*1000:.0f}ms",
            "X-TTS-Audio-Duration": f"{audio_dur:.1f}s",
            "X-TTS-Voice": voice,
        },
    )


@app.get("/v1/audio/voices")
def list_voices():
    return {
        "voices": [
            {"id": "af_heart", "name": "Heart", "description": "Warm, confident — Cortana-class"},
            {"id": "af_bella", "name": "Bella", "description": "Natural, soothing"},
            {"id": "af_sky", "name": "Sky", "description": "Clear, bright"},
            {"id": "af_jessica", "name": "Jessica", "description": "Energetic, natural"},
            {"id": "af_kore", "name": "Kore", "description": "Balanced, authoritative"},
            {"id": "af_nova", "name": "Nova", "description": "Versatile"},
            {"id": "af_sarah", "name": "Sarah", "description": "Professional"},
        ]
    }


if __name__ == "__main__":
    # Pre-load model before accepting requests
    get_kokoro()
    log.info("Starting TTS server on port 8880")
    uvicorn.run(app, host="0.0.0.0", port=8880, log_level="warning")
