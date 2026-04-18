import { NEXUS_TOOL_MANIFEST } from '../../config/nexus-tool-manifest';

type Variant = 'elite' | 'marketing';

/**
 * Public copy for what Nexus / voice can do — sourced from `nexus-tool-manifest.ts`.
 * Used on marketing surfaces (not protected dashboard routes).
 */
export function NexusCapabilityBlurb({ variant = 'marketing' }: { variant?: Variant }) {
  const items = NEXUS_TOOL_MANIFEST.slice(0, 6);

  if (variant === 'elite') {
    return (
      <section
        data-testid="nexus-capabilities-landing"
        className="mx-auto max-w-6xl px-4 py-12 md:py-16 border-t border-white/10"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">What you can ask inside SyncScript</h2>
        <p className="mt-3 text-sm text-[#b9c7d8] max-w-3xl">
          Your assistant stays inside clear boundaries: it helps you move around the app, open safe links, search files you uploaded, and (when you install the desktop companion) hand off to your browser with your consent.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-[#d0dce8]">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 bg-[#111924]/80 px-4 py-3">
              <span className="font-medium text-[#e6edf4]">{c.title}</span>
              <span className="block mt-1 text-[#9fb2c8] text-xs leading-relaxed">{c.description}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      data-testid="nexus-capabilities-landing"
      className="py-16 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">What you can ask inside SyncScript</h2>
        <p className="text-white/65 text-sm sm:text-base max-w-3xl mb-8">
          Your assistant stays inside clear boundaries: it helps you move around the app, open safe links, search files you uploaded, and (when you install the desktop companion) hand off to your browser with your consent.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white/85"
            >
              <span className="font-medium text-white">{c.title}</span>
              <span className="block mt-1 text-white/55 text-xs leading-relaxed">{c.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
