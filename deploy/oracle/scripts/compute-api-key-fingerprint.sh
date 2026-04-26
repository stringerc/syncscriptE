#!/usr/bin/env bash
# Print OCI API key fingerprint (must match Oracle Console for this public key).
# Usage: bash compute-api-key-fingerprint.sh /path/to/API_KEY_public.pem
set -euo pipefail
PUB="${1:?Usage: $0 path/to/public_key.pem}"
if openssl rsa -pubin -in "$PUB" -outform DER 2>/dev/null | openssl md5 -c; then
  exit 0
fi
openssl pkey -pubin -in "$PUB" -outform DER 2>/dev/null | openssl md5 -c
