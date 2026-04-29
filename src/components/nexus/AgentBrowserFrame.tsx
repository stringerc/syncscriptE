/**
 * In-app “browser” chrome around the agent view — same product pattern as
 * ChatGPT / Operator: remote Chromium, local UI that looks like a browser.
 * The viewport is still the CDP screencast (or fallback screenshot), not an
 * iframe of arbitrary sites (which would be a different security model).
 */
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Lock, RotateCw, Globe2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgentBrowserFrameProps {
  /** Latest known page URL from agent steps (read-only). */
  url: string | null;
  /** True while the run is actively streaming frames. */
  isLive: boolean;
  children: ReactNode;
}

export function AgentBrowserFrame({ url, isLive, children }: AgentBrowserFrameProps) {
  const secure = url?.startsWith('https:') ?? false;
  const display = url?.trim() || '';

  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700/80 bg-[#0e1016] shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
      )}
      role="region"
      aria-label="Agent browser view"
    >
      {/* Title bar — decorative window controls */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-gray-800/90 bg-[#14161f] px-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/90" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2">
          <Globe2 className="h-3 w-3 shrink-0 text-gray-500" aria-hidden="true" />
          <span className="truncate text-[10px] font-medium tracking-tight text-gray-500">
            Nexus Browser
            {isLive ? <span className="text-emerald-500/90"> · live</span> : null}
          </span>
        </div>
        <span className="w-14 shrink-0" aria-hidden="true" />
      </div>

      {/* Toolbar — navigation is agent-controlled; controls are hints only */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-gray-800/80 bg-[#11131a] px-2">
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title="Back — controlled by the agent"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 opacity-50"
            aria-disabled="true"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            title="Forward — controlled by the agent"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 opacity-50"
            aria-disabled="true"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            title="The live stream updates as the page changes"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 opacity-50"
            aria-disabled="true"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-700/90 bg-[#0a0b10] px-2.5 py-1.5"
          title={display || undefined}
        >
          {display ? (
            secure ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" aria-label="Secure connection" />
            ) : (
              <Globe2 className="h-3.5 w-3.5 shrink-0 text-amber-500/70" aria-hidden="true" />
            )
          ) : (
            <Globe2 className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-hidden="true" />
          )}
          <span
            className="min-w-0 flex-1 truncate font-mono text-[11px] text-gray-300"
            role="status"
            aria-live="polite"
          >
            {display || (isLive ? 'Connecting…' : 'No URL yet')}
          </span>
        </div>
      </div>

      {/* Viewport — CDP screencast canvas */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#06070a]">{children}</div>
    </div>
  );
}
