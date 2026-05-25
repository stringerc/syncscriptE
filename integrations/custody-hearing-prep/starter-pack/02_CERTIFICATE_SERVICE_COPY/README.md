# Certificate of service + filed confirmation

**Policy:** anything that left your office to a tribunal or party in a way that needs proof should have a row in `CERTIFICATE_SERVICE_LOG.csv` with **`filed_confirmation` populated** once you have the receipt, stamp, portal ack, or stored proof.

- Store certificate PDFs here alongside the log, or reference them in `certificate_pdf` column.
- `filed_confirmation` can be: e-filing receipt number, clerk file-mark note, `hand_delivered_signed_2026-04-27`, or a relative path like `proofs/efile_ack_order123.pdf`.

Do not leave `filed_confirmation` blank for rows where `action` is `filed` or `served`.
