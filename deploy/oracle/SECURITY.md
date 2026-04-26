# Oracle API keys — security

- **Never commit** `*.pem` private keys or full `~/.oci/config` to git. This repo contains **templates only**.
- If a **private key path or secret was pasted into chat**, treat it as **potentially exposed** → **rotate** the API key in Oracle Console (Identity → Users → API Keys) and delete the old key.
- Store keys under **`~/.oci/`** with **`chmod 600`**.
