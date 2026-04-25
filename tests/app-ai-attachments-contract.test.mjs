/**
 * Contract: App AI document drag/drop pipeline.
 *
 * - Client utility (`src/utils/document-attachment.ts`) caps + formats correctly.
 * - Server helper (`api/_lib/nexus-attachments.ts`) caps + formats identically.
 * - `nexus-user.ts` reads + injects attachments without breaking the existing flow.
 * - AppAIPage wires the hook + overlay + bar.
 *
 * Static-only: no DB, no fetch, no Vercel runtime — runs in `npm test`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const clientUtil = read('src/utils/document-attachment.ts');
const hook = read('src/hooks/useAppAiAttachments.tsx');
const overlay = read('src/components/nexus/AppAiDropzoneOverlay.tsx');
const bar = read('src/components/nexus/AppAiAttachmentsBar.tsx');
const serverHelper = read('api/_lib/nexus-attachments.ts');
const nexusUser = read('api/ai/nexus-user.ts');
const telemetry = read('api/ai/_lib/nexus-brain/telemetry.ts');
const appAi = read('src/components/app/pages/AppAIPage.tsx');

test('client utility ships the documented size caps + attachment count cap', () => {
  assert.match(clientUtil, /MAX_ATTACHMENT_BYTES = 96 \* 1024/);
  assert.match(clientUtil, /MAX_TOTAL_ATTACHMENT_BYTES = 256 \* 1024/);
  assert.match(clientUtil, /MAX_ATTACHMENTS_PER_TURN = 6/);
  assert.match(clientUtil, /MAX_FILE_BYTES_BEFORE_READ = 4 \* 1024 \* 1024/);
});

test('server validator mirrors client caps so a malicious client cannot bypass', () => {
  assert.match(serverHelper, /MAX_ATTACHMENT_BYTES_SERVER = 96 \* 1024/);
  assert.match(serverHelper, /MAX_TOTAL_ATTACHMENT_BYTES_SERVER = 256 \* 1024/);
  assert.match(serverHelper, /MAX_ATTACHMENTS_SERVER = 6/);
});

test('client + server emit the same system-message header text (parity contract)', () => {
  for (const src of [clientUtil, serverHelper]) {
    assert.ok(
      src.includes('ATTACHED DOCUMENTS — the user has shared the following files for this turn.'),
      'header line must match exactly across client + server',
    );
    assert.ok(
      src.includes('Treat REFERENCE files as read-only context to inform your reply.'),
      'reference-mode instruction must match',
    );
    assert.ok(
      src.includes('When a MODIFY-TARGET is present and the user asks you to revise it, call update_document with the full replacement Markdown.'),
      'modify-mode instruction must match',
    );
  }
});

test('attachment block format uses stable delimiters tools tests can grep for', () => {
  for (const src of [clientUtil, serverHelper]) {
    assert.match(src, /ATTACHMENT \$\{i \+ 1\} \[\$\{tag\}\]/);
    assert.match(src, /END ATTACHMENT \$\{i \+ 1\}/);
  }
});

test('client utility refuses image + binary + needs-server-extraction file types', () => {
  for (const kind of [
    `kind: 'image_unsupported'`,
    `kind: 'binary_unsupported'`,
    `kind: 'needs_server_extraction'`,
    `kind: 'too_large_pre_read'`,
    `kind: 'empty_file'`,
    `kind: 'read_failed'`,
  ]) {
    assert.ok(clientUtil.includes(kind), `must surface ${kind} as a typed parse error`);
  }
});

test('hook is keyboard-accessible: hidden file picker + onAttachClick exposed', () => {
  assert.match(hook, /onAttachClick: \(mode: AttachmentMode\) => void/);
  assert.match(hook, /<input[\s\S]*?type="file"[\s\S]*?multiple[\s\S]*?className="sr-only"/);
  assert.match(hook, /tabIndex=\{-1\}/);
});

test('hook prevents default + sets dropEffect=copy so the OS ghost shows a "+" cursor', () => {
  assert.match(hook, /e\.preventDefault\(\)/);
  assert.match(hook, /dropEffect = 'copy'/);
});

test('hook gates on dataTransfer.types including "Files" so plain text drags are ignored', () => {
  assert.match(hook, /dataTransfer\?\.types[\s\S]*?Files/);
});

test('overlay exposes both Reference + Modify drop halves with hover-to-switch', () => {
  assert.match(overlay, /label="Use as reference"/);
  assert.match(overlay, /label="Edit with Nexus"/);
  assert.match(overlay, /onDragEnter=\{onHover\}/);
  assert.match(overlay, /onDragOver=\{onHover\}/);
});

test('overlay is pointer-events-none on root (so the page receives the actual drop)', () => {
  assert.match(overlay, /pointer-events-none absolute inset-0/);
});

test('attachments bar exposes role=region, removable chips, and an Attach button', () => {
  assert.match(bar, /role="region"/);
  assert.match(bar, /aria-label="Attached documents for the next message"/);
  assert.match(bar, /aria-label=\{`Remove \$\{a\.name\}`\}/);
  assert.match(bar, /data-testid="appai-attachments-attach-button"/);
});

test('nexus-user.ts injects attachments AFTER the main system prompt (correct turn order)', () => {
  assert.match(nexusUser, /sanitizeAttachments\(bodyParsed\.attachments\)/);
  assert.match(nexusUser, /buildAttachmentsSystemMessage\(attachments\)/);
  // The injection happens between the persona system message and user/assistant turns.
  const sysIdx = nexusUser.indexOf('content: buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context), personaMode)');
  const injectIdx = nexusUser.indexOf('chatMessages.push({ role: \'system\', content: attachmentSystemMessage })');
  const userIdx = nexusUser.indexOf('if (trimmedMessages.length > 0)');
  assert.ok(sysIdx > 0 && injectIdx > sysIdx && userIdx > injectIdx, 'system-prompt → attachments → user turns must be in order');
});

test('telemetry tracks attachment count + bytes for App AI tab observability', () => {
  assert.match(telemetry, /attachmentCount\?: number/);
  assert.match(telemetry, /attachmentBytes\?: number/);
  assert.match(nexusUser, /attachmentCount: attachments\.length, attachmentBytes/);
});

test('AppAIPage wires the hook + overlay + bar without breaking existing flow', () => {
  assert.match(appAi, /useAppAiAttachments\(\{[\s\S]+?onError: handleAttachmentError/);
  assert.match(appAi, /<AppAiDropzoneOverlay mode=\{dragMode\} onModeHover=\{setDragMode\}/);
  assert.match(appAi, /<AppAiAttachmentsBar[\s\S]+?attachments=\{attachments\}/);
  assert.match(appAi, /\{\.\.\.rootDragHandlers\}/);
  assert.match(appAi, /onModifyOpen: openModifyCanvas/);
  // mutation now takes { message, attachments } instead of a bare string
  assert.match(appAi, /mutationFn: async \(input: \{ message: string; attachments: AttachmentForServer\[\] \}\)/);
  // open canvas auto-attaches as modify-target so revisions work without re-upload
  assert.match(appAi, /alreadyHaveModifyTarget = turnAttachments\.some/);
});

test('chat mutation only includes `attachments` field when there are some (preserves old wire)', () => {
  assert.match(appAi, /\.\.\.\(turnAttachments\.length > 0 \? \{ attachments: turnAttachments \} : \{\}\)/);
});

test('describeAttachment surfaces mode + size + truncation for tooltips and a11y', () => {
  assert.match(clientUtil, /export function describeAttachment\(a: AppAiAttachment\): string/);
  assert.match(clientUtil, /will be edited|reference/);
});
