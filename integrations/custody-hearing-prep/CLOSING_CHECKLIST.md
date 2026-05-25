# Mandatory closing checklist (before filing lock or hearing day)

Use this as a **hard stop** — not a “nice to print” list.

1. **`AUTHORITY_INDEX.csv`**
   - Every PDF you rely on in `04_AUTHORITIES/` has a row.
   - `pdf_filename` is the **basename** (e.g. `Smith_2024_order.pdf`), not a full path.
   - Run: `npm run custody:validate-authority-index -- --root <custody-repo>` until it exits **0**.

2. **`02_CERTIFICATE_SERVICE_COPY/CERTIFICATE_SERVICE_LOG.csv`**
   - Every **filed** or **served** item has `filed_confirmation` filled (receipt, stamp note, or path to proof).
   - Optional strict mode: add `--strict-certificate-log` to the validator after you adopt the column rules in your repo.

3. **`HEARING_NOTEBOOK.csv`**
   - Each footnote you will use on the bench has **one** `argument_line` (single sheet / quick scan).
   - `authority_row_id` matches `AUTHORITY_INDEX.csv` when you want traceability.

4. **Print pack (physical or PDF export)**
   - Hearing notebook sheet(s).
   - Certificate + filed confirmation bundle for anything still challenged.
