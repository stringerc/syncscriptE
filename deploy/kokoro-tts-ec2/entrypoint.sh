#!/bin/sh
set -e
cd /app
mkdir -p models

if [ ! -f models/kokoro.onnx ]; then
  echo "[entrypoint] Downloading kokoro.onnx (~310MB)…"
  curl -fsSL "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx" -o models/kokoro.onnx
fi

if [ ! -f models/voices.bin ]; then
  echo "[entrypoint] Downloading voices.bin (~27MB)…"
  curl -fsSL "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin" -o models/voices.bin
fi

exec python server.py
