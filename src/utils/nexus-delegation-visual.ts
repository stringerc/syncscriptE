/**
 * Maps Nexus tool traces to lightweight “delegation” hints for voice satellites and chat badges.
 * One primary voice (Nexus); satellites = which specialist surface was engaged, not separate speakers.
 */

import type { VoiceDelegationHint } from '@/types/voice-engine'

export type DelegationHint = VoiceDelegationHint

export function toolTraceToDelegationHints(
  trace: Array<Record<string, unknown>> | undefined,
  assistantSnippet?: string,
): DelegationHint[] {
  const out: DelegationHint[] = []
  const seen = new Set<string>()
  if (!Array.isArray(trace)) {
    return maybeAddMapFromSnippet(seen, out, assistantSnippet)
  }

  for (const t of trace) {
    if (!t || t.ok !== true) continue
    const tool = String(t.tool || '')
    if (tool === 'create_task' || tool === 'add_note') {
      if (!seen.has('tasks')) {
        seen.add('tasks')
        out.push({ id: 'tasks', label: 'Tasks', color: '#3b82f6' })
      }
    } else if (tool === 'create_document' || tool === 'update_document') {
      if (!seen.has('docs')) {
        seen.add('docs')
        out.push({ id: 'docs', label: 'Canvas', color: '#a855f7' })
      }
    } else if (tool === 'propose_calendar_hold') {
      if (!seen.has('calendar')) {
        seen.add('calendar')
        out.push({ id: 'calendar', label: 'Calendar', color: '#f59e0b' })
      }
    } else if (tool === 'send_invoice' || tool === 'send_document_for_signature') {
      if (!seen.has('flow')) {
        seen.add('flow')
        out.push({ id: 'flow', label: 'Flow', color: '#10b981' })
      }
    }
  }

  maybeAddMapFromSnippet(seen, out, assistantSnippet)
  return out.slice(0, 6)
}

function maybeAddMapFromSnippet(seen: Set<string>, out: DelegationHint[], assistantSnippet?: string) {
  const mapUrl =
    assistantSnippet &&
    (assistantSnippet.match(/https:\/\/maps\.google\.com\/[^\s)]+/i)?.[0] ||
      assistantSnippet.match(/https:\/\/goo\.gl\/maps\/[^\s)]+/i)?.[0])
  if (mapUrl && !seen.has('maps')) {
    seen.add('maps')
    out.push({ id: 'maps', label: 'Maps', color: '#22c55e' })
  }
}
