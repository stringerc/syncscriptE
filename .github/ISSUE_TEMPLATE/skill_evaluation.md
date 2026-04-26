---
name: Skill / MCP evaluation (ClawHub or registry)
about: Triage a discovered skill or MCP server before any install in prod
title: 'skill: evaluate <slug-or-server-name>'
labels: ['triage', 'skills']
---

## Source

- [ ] ClawHub slug: 
- [ ] Version / tag: 
- [ ] Link or `clawhub inspect` summary (no secrets):

## Audit snapshot

- **Security line from inspect:** (e.g. OK / SUSPICIOUS / unknown)
- **Overlap with bundled OpenClaw skills?** (github, browser, …)
- **Overlap with in-repo tooling?** (Playwright, Vite, Edge, …)

## Fit for SyncScript

- **Use case** (UX, deploy, test, voice, …): 
- **Touches prod data or secrets?** yes / no — explain:

## Decision

- [ ] **Skip**
- [ ] **Try in non-prod gateway only** (owner + date)
- [ ] **Fork / reimplement in repo** (path / PR)
- [ ] **Document only** (link to research note)

## Owner

@
