/**
 * Public API documentation — `/docs/api`. Loads RapiDoc (a tiny embedded
 * OpenAPI viewer) from a CDN as a Web Component, points it at the static
 * `/openapi.json` we host alongside the build.
 *
 * Why RapiDoc and not Mintlify / ReadMe.com:
 *   - Zero hosted-doc subscription cost.
 *   - Spec lives in the repo + ships with the deploy → impossible to drift.
 *   - Drops in as a single <rapi-doc> tag with theming attributes.
 *
 * If we outgrow this, we can swap to Mintlify (drop a config + redirect
 * `/docs/api` → `docs.syncscript.app`) without changing the API itself.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'rapi-doc': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, string | undefined>,
        HTMLElement
      >;
    }
  }
}

const RAPIDOC_SCRIPT_ID = 'rapi-doc-cdn';

export function ApiDocsPage() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(RAPIDOC_SCRIPT_ID)) return;
    const s = document.createElement('script');
    s.type = 'module';
    s.id = RAPIDOC_SCRIPT_ID;
    // Pinned version — do not use a placeholder; broken CDN URLs silently fail the whole viewer.
    s.src = 'https://unpkg.com/rapidoc@9.3.8/dist/rapidoc-min.js';
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <div data-marketing-root className="min-h-screen bg-[#0a0b10] text-white">
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <span className="text-sm text-slate-500">/</span>
          <span className="text-sm font-medium text-white">API documentation</span>
          <a
            href="/openapi.json"
            className="ml-auto rounded border border-slate-700 px-2 py-0.5 font-mono text-xs text-slate-300 hover:bg-slate-800"
            rel="noopener noreferrer"
          >
            openapi.json
          </a>
          <a
            href="https://www.syncscript.app/trust"
            className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-200 hover:bg-cyan-500/20"
          >
            Trust portal
          </a>
        </div>
      </div>

      {/* RapiDoc viewer. Theming aligned with the SyncScript dark palette. */}
      <rapi-doc
        spec-url="/openapi.json"
        render-style="read"
        theme="dark"
        bg-color="#0a0b10"
        primary-color="#22d3ee"
        text-color="#e2e8f0"
        nav-bg-color="#0d0e13"
        nav-text-color="#cbd5e1"
        nav-hover-bg-color="#1e293b"
        nav-accent-color="#22d3ee"
        regular-font="Inter, system-ui, sans-serif"
        mono-font="ui-monospace, SFMono-Regular, Menlo, monospace"
        show-header="false"
        show-info="true"
        allow-authentication="true"
        allow-server-selection="false"
        allow-try="true"
        schema-style="table"
        schema-expand-level="1"
        default-schema-tab="schema"
        info-description-headings-in-navbar="true"
        style={{ height: 'calc(100vh - 49px)', width: '100%' }}
      />
    </div>
  );
}
