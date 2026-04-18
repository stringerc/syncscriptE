/**
 * Single manifest of what Nexus / voice surfaces may do — keep server prompts and UI copy aligned.
 * Edge functions and agent prompts should treat this as the capability contract (deny-by-default outside this list).
 *
 * Do not duplicate long policy text in protected route components; import from here for new surfaces.
 */

export type NexusCapabilityId =
  | 'navigate_app'
  | 'open_external_link'
  | 'library_search'
  | 'library_email_self'
  | 'library_pin'
  | 'companion_focus'
  | 'companion_open_web'
  | 'companion_open_chrome'
  | 'delegate_desktop_agents';

export interface NexusCapability {
  id: NexusCapabilityId;
  /** Short label for UI */
  title: string;
  /** One-line description for consent / marketing */
  description: string;
  /** Risk tier for trust policies */
  tier: 'low' | 'medium' | 'high';
}

export const NEXUS_TOOL_MANIFEST: NexusCapability[] = [
  {
    id: 'navigate_app',
    title: 'Move inside SyncScript',
    description: 'Opens sections you ask for inside the web or mobile app (tasks, calendar, library, settings).',
    tier: 'low',
  },
  {
    id: 'open_external_link',
    title: 'Open links in your browser',
    description: 'Opens HTTPS links in your default browser or new tab — same as tapping a link.',
    tier: 'low',
  },
  {
    id: 'library_search',
    title: 'Search your file library',
    description: 'Finds files you uploaded by name or extracted text (authenticated search API).',
    tier: 'medium',
  },
  {
    id: 'library_email_self',
    title: 'Email a file link to you',
    description: 'Sends a time-limited download link to your account email via SyncScript mail.',
    tier: 'medium',
  },
  {
    id: 'library_pin',
    title: 'Pin to your library',
    description: 'Links a file to your library collection so it stays easy to find on any device.',
    tier: 'low',
  },
  {
    id: 'companion_focus',
    title: 'Focus desktop companion',
    description: 'When Nature Companion is installed, brings the overlay forward (syncscript-companion://focus).',
    tier: 'low',
  },
  {
    id: 'companion_open_web',
    title: 'Open SyncScript in the browser',
    description: 'Uses the Companion to open a path on syncscript.app in your default browser.',
    tier: 'low',
  },
  {
    id: 'companion_open_chrome',
    title: 'Open SyncScript in Chrome',
    description: 'Uses the Companion to open a path in Google Chrome explicitly (allowlisted protocol).',
    tier: 'low',
  },
  {
    id: 'delegate_desktop_agents',
    title: 'Open agent routes on the desktop',
    description: 'Deep-links to agent views; may require desktop trust evaluation when launched from Companion.',
    tier: 'medium',
  },
];

/** Plain-text bullet list for docs and non-React contexts */
export function formatNexusCapabilityListForDocs(): string {
  return NEXUS_TOOL_MANIFEST.map((c) => `- **${c.title}** — ${c.description}`).join('\n');
}
