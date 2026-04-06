# Playbook 00 — Git: branch, commit, push, PR

**Goal:** One focused change set, one commit, optional PR.

## Steps

1. `git status` and `git diff HEAD`; `git branch --show-current`.
2. If on `main`: `git checkout -b short-topic-name`.
3. Stage deliberately (`git add -p` or explicit paths).
4. `git commit -m "type(scope): summary" -m "Why."`
5. `git push -u origin HEAD`
6. Optional: `gh pr create --fill`

**Agents:** Prefer completing 1–6 in one turn without unrelated file edits.
