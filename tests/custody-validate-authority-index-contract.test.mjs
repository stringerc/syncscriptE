/**
 * Contract: custody authority index validator (filesystem only).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "custody-validate-authority-index.mjs");

function writeCase(dir, { missingSecondPdf = true } = {}) {
  fs.mkdirSync(path.join(dir, "04_AUTHORITIES"), { recursive: true });
  fs.writeFileSync(path.join(dir, "04_AUTHORITIES", "alpha.pdf"), "%PDF-1.4 minimal fixture\n");
  if (!missingSecondPdf) {
    fs.writeFileSync(path.join(dir, "04_AUTHORITIES", "beta.pdf"), "%PDF-1.4\n");
  }
  fs.writeFileSync(
    path.join(dir, "AUTHORITY_INDEX.csv"),
    [
      "row_id,pdf_filename,short_cite,issue_topic,status,notes",
      "r1,alpha.pdf,A v. B — order,Support,filed,ok",
      "r2,beta.pdf,Statute snippet,Statute,filed,second",
      "",
    ].join("\n"),
  );
  fs.mkdirSync(path.join(dir, "02_CERTIFICATE_SERVICE_COPY"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "02_CERTIFICATE_SERVICE_COPY", "CERTIFICATE_SERVICE_LOG.csv"),
    [
      "log_id,authority_row_id,pdf_filename_or_description,action,date_prepared,date_filed_or_served,method,served_on_or_court,certificate_pdf,filed_confirmation,notes",
      "L1,r1,alpha,filed,2026-01-01,2026-01-02,efile,Court,coa_alpha.pdf,Receipt ABC,",
      "L2,r2,beta,filed,2026-01-01,2026-01-02,efile,Court,coa_beta.pdf,,missing confirmation",
      "",
    ].join("\n"),
  );
}

test("validator fails when PDF missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "custody-val-"));
  writeCase(dir, { missingSecondPdf: true });
  const r = spawnSync(process.execPath, [script, "--root", dir], { encoding: "utf8" });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr + r.stdout, /missing PDF/);
});

test("validator passes when all PDFs exist", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "custody-val-"));
  writeCase(dir, { missingSecondPdf: false });
  const r = spawnSync(process.execPath, [script, "--root", dir], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("strict certificate log fails on empty filed_confirmation", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "custody-val-"));
  writeCase(dir, { missingSecondPdf: false });
  const r = spawnSync(process.execPath, [script, "--root", dir, "--strict-certificate-log"], {
    encoding: "utf8",
  });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr + r.stdout, /filed_confirmation empty/);
});
