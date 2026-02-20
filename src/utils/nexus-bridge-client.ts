/**
 * Nexus Bridge Client — Lightweight client for connecting to Mission Control
 * from within syncscript.app during development.
 *
 * Connects to:
 *  - Nexus Bridge backend (localhost:5210) for shell, fs, code execution
 *  - OpenClaw Gateway (localhost:18789) for Nexus chat via ACP protocol
 *
 * Dev-only: this entire module is a no-op when MISSION_CONTROL_URL is unreachable.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

const MC_BASE = 'http://127.0.0.1:5210/api'

// ─── Bridge API (shell, fs, code) ───────────────────────────────────────────

export interface ShellResult {
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

export interface FileReadResult {
  path: string
  content: string
  totalLines: number
  totalChars: number
}

export interface BridgeStatus {
  bridge: string
  startedAt: string
  stats: Record<string, number>
  rateLimits: Record<string, { used: number; max: number }>
  spawnedProcesses: number
  auditEntries: number
}

export interface AuditEntry {
  timestamp: string
  category: string
  operation: string
  input: Record<string, unknown>
  output: { success: boolean; summary: string }
  durationMs: number
}

async function bridgeFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${MC_BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Bridge error: ${res.status}`)
  }
  return res.json()
}

export const bridge = {
  // Shell
  exec: (command: string, cwd?: string, timeout?: number): Promise<ShellResult> =>
    bridgeFetch('/nexus-bridge/shell/exec', {
      method: 'POST',
      body: JSON.stringify({ command, cwd, timeout }),
    }),

  spawn: (command: string, args?: string[], cwd?: string) =>
    bridgeFetch<{ pid: number; command: string }>('/nexus-bridge/shell/spawn', {
      method: 'POST',
      body: JSON.stringify({ command, args, cwd }),
    }),

  processes: () =>
    bridgeFetch<{ processes: any[]; total: number }>('/nexus-bridge/shell/processes'),

  kill: (pid: number) =>
    bridgeFetch<{ killed: boolean; pid: number }>(`/nexus-bridge/shell/kill/${pid}`, { method: 'POST' }),

  // File System
  readFile: (path: string, offset?: number, limit?: number): Promise<FileReadResult> =>
    bridgeFetch('/nexus-bridge/fs/read', {
      method: 'POST',
      body: JSON.stringify({ path, offset, limit }),
    }),

  writeFile: (path: string, content: string, createDirs?: boolean) =>
    bridgeFetch<{ written: boolean; path: string; bytes: number }>('/nexus-bridge/fs/write', {
      method: 'POST',
      body: JSON.stringify({ path, content, createDirs }),
    }),

  editFile: (path: string, oldString: string, newString: string, replaceAll?: boolean) =>
    bridgeFetch<{ edited: boolean; path: string; replacements: number }>('/nexus-bridge/fs/edit', {
      method: 'POST',
      body: JSON.stringify({ path, oldString, newString, replaceAll }),
    }),

  glob: (pattern: string, cwd?: string, maxResults?: number) =>
    bridgeFetch<{ files: string[]; total: number }>('/nexus-bridge/fs/glob', {
      method: 'POST',
      body: JSON.stringify({ pattern, cwd, maxResults }),
    }),

  grep: (pattern: string, path?: string, glob?: string, ignoreCase?: boolean) =>
    bridgeFetch<{ matches: string[]; total: number }>('/nexus-bridge/fs/grep', {
      method: 'POST',
      body: JSON.stringify({ pattern, path, glob, ignoreCase }),
    }),

  // Code
  runCode: (code: string, language?: string, cwd?: string, timeout?: number) =>
    bridgeFetch<ShellResult & { language: string }>('/nexus-bridge/code/run', {
      method: 'POST',
      body: JSON.stringify({ code, language, cwd, timeout }),
    }),

  // System
  systemInfo: () =>
    bridgeFetch<Record<string, unknown>>('/nexus-bridge/system/info'),

  // Audit
  audit: (limit?: number) =>
    bridgeFetch<{ entries: AuditEntry[]; total: number }>(`/nexus-bridge/audit?limit=${limit || 30}`),

  // Status
  status: () => bridgeFetch<BridgeStatus>('/nexus-bridge/status'),
}

// ─── Health Check ───────────────────────────────────────────────────────────

let _available: boolean | null = null
let _cacheExpiry = 0

/**
 * Check if Mission Control is running and reachable.
 * Caches result for 15 seconds, then re-probes.
 *
 * Works from any origin (localhost or production HTTPS) because:
 *  - Chrome/Firefox treat localhost as a "potentially trustworthy" origin
 *  - Mixed content (HTTPS -> HTTP localhost) is explicitly allowed
 *  - Mission Control has CORS: * configured
 *
 * Pass `force: true` to bypass the cache.
 */
export async function isMissionControlAvailable(force?: boolean): Promise<boolean> {
  if (!force && _available !== null && Date.now() < _cacheExpiry) return _available

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${MC_BASE}/nexus-bridge/status`, {
      signal: controller.signal,
      // Prevent the browser from caching the probe
      cache: 'no-store',
    })
    clearTimeout(timeout)
    _available = res.ok
  } catch {
    _available = false
  }

  _cacheExpiry = Date.now() + 15_000
  return _available
}
