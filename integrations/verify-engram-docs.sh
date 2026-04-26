#!/usr/bin/env bash
# Smoke-check Engram Swagger after `docker compose up` (run on host).
set -euo pipefail
BASE="${1:-http://127.0.0.1:8000}"
echo "Checking ${BASE} ..."

code=$(curl -sS -o /tmp/engram-root.json -w "%{http_code}" "${BASE}/")
echo "GET / -> HTTP ${code}"
test "$code" = "200" || { echo "FAIL: root"; exit 1; }

for hp in /health /healthz; do
  hcode=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}${hp}" || echo "000")
  echo "GET ${hp} -> HTTP ${hcode}"
done

code=$(curl -sS -o /tmp/engram-docs.html -w "%{http_code}" "${BASE}/docs")
echo "GET /docs -> HTTP ${code}"
test "$code" = "200" || { echo "FAIL: /docs"; exit 1; }

if grep -qiE 'swagger|swagger-ui' /tmp/engram-docs.html; then
  echo "OK: /docs HTML references swagger"
else
  echo "FAIL: /docs body missing swagger (see /tmp/engram-docs.html)"
  exit 1
fi

code=$(curl -sS -o /tmp/engram-openapi.json -w "%{http_code}" "${BASE}/openapi.json")
echo "GET /openapi.json -> HTTP ${code}"
test "$code" = "200" || { echo "FAIL: openapi.json"; exit 1; }

if head -c 20 /tmp/engram-openapi.json | grep -q '{'; then
  echo "OK: openapi.json looks like JSON"
else
  echo "FAIL: openapi.json not JSON"
  exit 1
fi

if curl -sS -I "${BASE}/docs" | grep -qi 'content-security-policy'; then
  echo "WARN: CSP still present on /docs — Swagger may stay blank"
else
  echo "OK: no Content-Security-Policy on /docs response"
fi

echo "All checks passed."
