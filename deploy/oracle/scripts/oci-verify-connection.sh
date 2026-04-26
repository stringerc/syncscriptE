#!/usr/bin/env bash
# Quick checks after ~/.oci/config exists (run generate-oci-config.sh first).
set -euo pipefail
command -v oci >/dev/null 2>&1 || { echo "Install: brew install oci-cli" >&2; exit 1; }

echo "==> oci os ns get"
oci os ns get

echo "==> Ashburn region in catalog?"
oci iam region list --query "data[?name=='us-ashburn-1']" --raw-output 2>/dev/null || oci iam region list | head -20

echo "==> Availability domains (need compartment OCID — use root compartment from Console or):"
echo "    oci iam compartment list --all"
