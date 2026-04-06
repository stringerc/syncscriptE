# Claude Code (zip) — exhaustive Python audit

**Inventory:** 11 `.py` files. No other Python in that archive.

## 1. File list and roles

1. `examples/hooks/bash_command_validator_example.py` — PreToolUse; validates Bash `command` with regex; **stderr + exit 2** to block.
2. `plugins/security-guidance/hooks/security_reminder_hook.py` — PreToolUse for Write/Edit/MultiEdit; path + substring rules; session state under `~/.claude`; **stderr + exit 2** to block.
3. `plugins/hookify/core/config_loader.py` — Dataclasses `Condition`, `Rule`; custom `---` frontmatter parser; `glob('.claude/hookify.*.local.md')`.
4. `plugins/hookify/core/rule_engine.py` — Evaluates rules; `@lru_cache(maxsize=128)` on case-insensitive regex compile; returns JSON-shaped dicts for deny/block/warn.
5. `plugins/hookify/hooks/pretooluse.py` — stdin JSON → rules → stdout JSON; **`finally: sys.exit(0)`** (fail-open).
6. `plugins/hookify/hooks/posttooluse.py` — same.
7. `plugins/hookify/hooks/stop.py` — `load_rules(event='stop')`.
8. `plugins/hookify/hooks/userpromptsubmit.py` — `load_rules(event='prompt')`.
9–11. Empty `__init__.py` files under `hookify/core`, `hooks`, `matchers`, `utils`.

## 2. Protocol detail (every behavioral branch)

### Stdin

- JSON object. `json.load(sys.stdin)` except security hook uses `read()` + `loads` (same for single object).

### Blocking mechanisms (both exist in repo)

| Mechanism | Scripts |
|-----------|---------|
| Exit **2** + stderr prose | bash validator, security reminder |
| Exit **0** + stdout JSON (`permissionDecision: deny`, etc.) | hookify quartet |

### JSON decode errors

- Bash example: **exit 1** (strict).
- Security hook: **exit 0** (allow tool — lenient).
- Hookify: caught by broad `except`, JSON error message to stdout, **exit 0**.

### Spacing and formatting (source code)

- **4 spaces** per indent; no tabs.
- Two blank lines before top-level defs in PEP-8-typical layout.
- String content: security reminders contain spaces between words as normal prose; code uses single-quoted keys in some `from_dict` (`'field'`) vs double quotes elsewhere — minor inconsistency.
- Type hints: mix of `list[str]` (3.9+) and `List[...]` from `typing` in `config_loader`.

### Regex details (bash validator)

- `^grep\b(?!.*\|)` — line start only; `\b` word boundary; negative lookahead skips lines that contain `|` (pipelines).
- `^find\s+\S+\s+-name\b` — requires non-whitespace after `find` before `-name`.

### Security patterns (first match wins)

- Path lambda or substring `in content` (no token boundaries).
- References like `src/utils/execFileNoThrow.ts` are **Claude Code repo**-specific, not portable.

### Hookify path hack

- `os.environ.get('CLAUDE_PLUGIN_ROOT')` → insert parent and plugin dir at `sys.path[0]`.

### rule_engine edge

- If `hook_event_name` missing from stdin payload, `Stop` vs `PreToolUse` JSON branch may be wrong (falls through to generic `systemMessage`).

## 3. What “better than copying” means here

- **Measure:** one blocking protocol, real YAML/JSON config, no `/tmp` logs in prod hooks, no substring-only security scans without review.
- **SyncScript already has:** guards, contract tests, Edge degradation — align mentally with hookify **fail-open** vs validator **fail-closed**.

## 4. Reproduce inventory

```bash
unzip -l claude-code-main.zip | grep '\.py$'
```

## 5. Related (non-Python + playbooks)

- **`CLAUDE_CODE_NONPYTHON_INVENTORY.md`** — workflows, slash commands, settings, hookify examples.
- **`agent-playbooks/README.md`** — SyncScript operational playbooks inspired by those patterns.
