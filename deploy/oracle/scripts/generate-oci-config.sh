#!/usr/bin/env bash
# Write ~/.oci/config from deploy/oracle/env.local (gitignored).
# Usage (from repo root):
#   cp deploy/oracle/env.local.example deploy/oracle/env.local
#   nano deploy/oracle/env.local
#   bash deploy/oracle/scripts/generate-oci-config.sh
#
# Requires: OCI_USER_OCID, OCI_TENANCY_OCID, OCI_FINGERPRINT, OCI_REGION, OCI_KEY_FILE
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ORACLE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVF="${ORACLE_DIR}/env.local"

if [[ ! -f "$ENVF" ]]; then
  echo "Missing $ENVF — copy env.local.example and fill values (see deploy/oracle/README.md)." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENVF"
set +a

for v in OCI_USER_OCID OCI_TENANCY_OCID OCI_FINGERPRINT OCI_REGION OCI_KEY_FILE; do
  if [[ -z "${!v:-}" || "${!v}" == *REPLACE* ]]; then
    echo "Set $v in deploy/oracle/env.local (no placeholders — copy from Oracle Console → Profile → User settings)." >&2
    exit 1
  fi
done

if [[ "$OCI_KEY_FILE" == *YOU* ]] || [[ "$OCI_KEY_FILE" == *REPLACE* ]]; then
  echo "Set OCI_KEY_FILE to the absolute path of your API key .pem on this Mac." >&2
  exit 1
fi

if [[ "${OCI_FINGERPRINT:-}" == "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99" ]]; then
  echo "Replace OCI_FINGERPRINT in env.local with the fingerprint shown next to your API key in Oracle Console." >&2
  exit 1
fi

if [[ ! -f "$OCI_KEY_FILE" ]]; then
  echo "OCI_KEY_FILE not found: $OCI_KEY_FILE" >&2
  exit 1
fi

mkdir -p ~/.oci
chmod 700 ~/.oci

umask 077
cat > ~/.oci/config <<EOF
[DEFAULT]
user=${OCI_USER_OCID}
fingerprint=${OCI_FINGERPRINT}
tenancy=${OCI_TENANCY_OCID}
region=${OCI_REGION}
key_file=${OCI_KEY_FILE}
EOF

chmod 600 ~/.oci/config
echo "Wrote ~/.oci/config. Test with: oci os ns get"
