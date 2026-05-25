# Custody hearing prep — authority index, certificate log, bench sheet

This folder is a **starter pack** you can copy into a dedicated **Custody** repo (or case folder). It encodes three habits that stay “not optional” only when you wire them into your closing checklist.

## Folder layout (recommended)

| Path | Purpose |
|------|---------|
| `AUTHORITY_INDEX.csv` | **Mandatory closing artifact** — one row per authority PDF; `pdf_filename` must match a file under `04_AUTHORITIES/`. |
| `04_AUTHORITIES/` | Source PDFs (court rules, statutes, orders, treatises, etc.). |
| `02_CERTIFICATE_SERVICE_COPY/` | **Always populated** for anything you serve or file that requires proof — certificate + **filed confirmation** (receipt #, e-file ack, stamped copy path, etc.). |
| `HEARING_NOTEBOOK.csv` | **One printable sheet**: footnote `#` → **one line** of argument so you are not flipping the full PDF on the bench. |

## Habit 1 — `AUTHORITY_INDEX.csv` is not “optional printing”

Treat the CSV as **the index of record** for what you might cite or hand up:

1. Add or update a row **when** you add a PDF to `04_AUTHORITIES/`.
2. Before you close a filing batch or walk into a hearing, run validation (see below). If it fails, you do not have a closed loop between index and disk.

## Habit 2 — `02_CERTIFICATE_SERVICE_COPY` always has filed confirmation

`CERTIFICATE_SERVICE_LOG.csv` is the structured counterpart to whatever certificate PDFs you keep beside it.

**Rule:** if you filed or served it, `filed_confirmation` is **non-empty** (receipt id, portal screenshot filename, clerk stamp note, or relative path to a proof PDF under this folder).

## Habit 3 — hearing notebook = footnote → argument line

`HEARING_NOTEBOOK.csv` is intentionally flat:

- `footnote_number` — what you will say aloud or what matches your brief’s footnote call.
- `argument_line` — **one line** (string); expand only if you must, but the goal is a **single sheet** printout.
- `authority_row_id` — optional link back to `AUTHORITY_INDEX.csv` `row_id`.

Export: open in Numbers/Excel or `cat HEARING_NOTEBOOK.csv` and print; or paste into a word processor as a table.

## Filesystem validation (no LLM)

From repo root (SyncScript) or anywhere Node is available:

```bash
npm run custody:validate-authority-index -- --root /path/to/your/custody-repo
```

Or:

```bash
CUSTODY_REPO=/path/to/your/custody-repo npm run custody:validate-authority-index
```

Optional strict certificate check:

```bash
npm run custody:validate-authority-index -- --root /path/to/custody-repo --strict-certificate-log
```

## Copying the starter into your Custody repo

```bash
cp -R /path/to/syncscript/integrations/custody-hearing-prep/starter-pack/* /path/to/your/custody-repo/
```

Then add your PDFs under `04_AUTHORITIES/` and fill the CSVs.

## Disclaimer

This is **organizational tooling**, not legal advice. You remain responsible for local rules, redaction, and privilege.
