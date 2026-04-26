#!/usr/bin/env bash
# Fill SUBNET_OCID + AVAILABILITY_DOMAINS in deploy/oracle/instance-launch.env using the OCI CLI.
# Requires: ~/.oci/config (run deploy/oracle/scripts/generate-oci-config.sh after a real env.local).
#
# Subnet = primary VNIC subnet of OCI_INSTANCE_ID (default: your existing iad instance).
#
# Usage:
#   bash deploy/oracle/scripts/populate-instance-launch-from-oci.sh
#   OCI_INSTANCE_ID=ocid1.instance... bash deploy/oracle/scripts/populate-instance-launch-from-oci.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORACLE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVF="${ORACLE_DIR}/instance-launch.env"
DEFAULT_INSTANCE_ID="${OCI_INSTANCE_ID:-ocid1.instance.oc1.iad.anuwcljt57onejqcnf5cmqu3telv2jmaqvectrpzfcniwodofnsvkboq6sjq}"

command -v oci >/dev/null 2>&1 || { echo "Install: brew install oci-cli" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "Install: brew install jq" >&2; exit 1; }

[[ -f "$HOME/.oci/config" ]] || {
  echo "Missing ~/.oci/config — fill deploy/oracle/env.local (real values), then:" >&2
  echo "  bash deploy/oracle/scripts/generate-oci-config.sh" >&2
  exit 1
}
[[ -f "$ENVF" ]] || { echo "Missing $ENVF" >&2; exit 1; }

TENANCY="$(awk -F= '/^tenancy=/{gsub(/ /,"",$2); print $2; exit}' "$HOME/.oci/config")"
[[ -n "$TENANCY" ]] || { echo "Could not read tenancy from ~/.oci/config" >&2; exit 1; }

echo "→ Subnet from instance VNIC: $DEFAULT_INSTANCE_ID"
SUBNET_ID="$(oci compute instance list-vnics --instance-id "$DEFAULT_INSTANCE_ID" --query 'data[0]."subnet-id"' --raw-output)"
if [[ -z "$SUBNET_ID" || "$SUBNET_ID" == "null" ]]; then
  echo "Could not read subnet-id from list-vnics. Check OCI_INSTANCE_ID and policies." >&2
  exit 1
fi

echo "→ Availability domains"
ADS_SPACE="$(oci iam availability-domain list --compartment-id "$TENANCY" | jq -r '.data[].name' | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
if [[ -z "${ADS_SPACE// /}" ]]; then
  echo "No availability domains returned." >&2
  exit 1
fi

export ENVF
export POP_SUBNET_ID="$SUBNET_ID"
export POP_ADS="AVAILABILITY_DOMAINS=\"${ADS_SPACE}\""

python3 <<'PY'
import os, re
from pathlib import Path
path = Path(os.environ["ENVF"])
text = path.read_text()
subnet = os.environ["POP_SUBNET_ID"]
ads = os.environ["POP_ADS"]
text, n1 = re.subn(r"^SUBNET_OCID=.*$", f"SUBNET_OCID={subnet}", text, count=1, flags=re.M)
text, n2 = re.subn(r"^AVAILABILITY_DOMAINS=.*$", ads, text, count=1, flags=re.M)
if n1 != 1 or n2 != 1:
    raise SystemExit(f"Replace failed: SUBNET {n1}, ADS {n2} (expected 1 each)")
path.write_text(text)
print("Updated:", path)
print("SUBNET_OCID=", subnet)
print(ads)
PY

echo "Done. Verify $ENVF then: npm run oracle:retry-a1-launch"
