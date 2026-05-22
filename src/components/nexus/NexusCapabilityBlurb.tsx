import { motion } from 'framer-motion';
import { NEXUS_TOOL_MANIFEST } from '../../config/nexus-tool-manifest';

type Variant = 'elite' | 'marketing';

const CAPABILITY_ICONS: Record<string, string> = {
  navigate_app: '⚡',
  open_external_link: '🔗',
  library_search: '🔍',
  library_email_self: '📨',
  library_pin: '📌',
  companion_focus: '🎯',
  companion_open_web: '🌐',
  companion_open_chrome: '⛏️',
  delegate_desktop_agents: '🤖',
};

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
        className="mx-auto max-w-6xl border-t border-white/[0.06] bg-[#070c12]/50 px-4 py-16 md:px-6 md:py-20"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}
      >
        <h2 className="text-fluid-3xl font-semibold tracking-tight text-white">What you can ask inside SyncScript</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#9eb0c4] md:text-base">
          Your assistant stays inside clear boundaries: it helps you create tasks, schedule calendar holds, search your files, and navigate the app — by voice, chat, or the same tools the web app uses.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-[#d0dce8]">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0f1620] to-[#0a1018] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <span className="font-medium text-[#e8f0f7]">{c.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#8da3bb]">{c.description}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      data-testid="nexus-capabilities-landing"
      className="py-20 sm:py-28 lg:py-32 relative overflow-hidden"
    >
      {/* Ambient background glow — matches CTA section language */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-indigo-950/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Centered heading — matches FAQ section above */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">
            What Nexus Can Do
          </h2>
          <p className="text-lg sm:text-xl text-white/60 font-light max-w-2xl mx-auto">
            Your AI assistant works within clear boundaries — by voice, chat, or the same tools the web app uses.
          </p>
        </motion.div>

        {/* Capability cards — glassmorphism + hover lift, matches page design language */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {items.map((c, index) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm
                px-5 py-4 transition-all duration-300
                hover:border-cyan-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-500/[0.06]
                hover:-translate-y-0.5 cursor-default"
            >
              {/* Icon accent */}
              <span className="text-xl mb-2 block opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                {CAPABILITY_ICONS[c.id] || '✦'}
              </span>
              <span className="font-semibold text-white/90 block mb-1">{c.title}</span>
              <span className="text-white/50 text-xs leading-relaxed block">{c.description}</span>

              {/* Subtle top-edge shine on hover */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 to-transparent group-hover:via-cyan-400/30 transition-all duration-500 rounded-t-2xl" />
            </motion.li>
          ))}
        </ul>

        {/* Trust signal — reinforces boundary clarity */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 text-center text-xs text-white/30 tracking-wide"
        >
          No unbounded shell access · No raw system commands · You stay in control
        </motion.p>
      </div>
    </section>
  );
}
