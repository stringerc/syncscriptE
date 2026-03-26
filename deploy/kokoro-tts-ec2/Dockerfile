# Kokoro ONNX TTS — same API as SyncScript /api/ai/tts expects (POST /v1/audio/speech).
# Target: EC2 amd64 (set platform when building on Apple silicon).
FROM python:3.11-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENV PYTHONUNBUFFERED=1
EXPOSE 8880

HEALTHCHECK --interval=30s --timeout=15s --start-period=180s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8880/health | grep -q healthy

ENTRYPOINT ["/app/entrypoint.sh"]
