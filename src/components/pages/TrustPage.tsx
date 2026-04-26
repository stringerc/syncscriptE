/**
 * Trust portal — `/trust`. Public, no-auth. Surfaces the things Fortune 500
 * procurement implicitly checks before signing: security disclosure, encryption
 * claims, subprocessor list, data residency, DPA contact, GDPR/CCPA posture.
 *
 * Conservative truth: every claim here matches what the codebase actually
 * does today. Do not embellish — procurement reads everything literally.
 *
 * Updates land here when:
 *   - A new subprocessor is added (Vercel env, Supabase project, etc.).
 *   - SOC 2 status moves (Vanta path Tier 1 E in the roadmap).
 *   - GDPR / CCPA / DPA contact email changes.
 */
import { Link } from 'react-router';
import {
  Shield, Lock, Server, Mail, FileText, Globe2, KeyRound, AlertTriangle, ArrowLeft,
} from 'lucide-react';

interface Subprocessor {
  name: string;
  purpose: string;
  region: string;
  link: string;
}

const SUBPROCESSORS: Subprocessor[] = [
  { name: 'Vercel',     purpose: 'Web app hosting, CDN, serverless API runtime', region: 'US (multi-region edge)', link: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Supabase',   purpose: 'Authentication, Postgres database, Realtime, Edge Functions, file storage', region: 'us-east-1', link: 'https://supabase.com/privacy' },
  { name: 'Cloudflare', purpose: 'DNS + tunneling for the agent runner', region: 'Global', link: 'https://www.cloudflare.com/privacypolicy/' },
  { name: 'Oracle Cloud (OCI)', purpose: 'Always-Free ARM VM hosting the Nexus Agent runner (browser automation)', region: 'us-ashburn-1', link: 'https://www.oracle.com/legal/privacy/' },
  { name: 'NVIDIA NIM', purpose: 'Default LLM provider for Nexus Agent Mode (free tier)', region: 'US', link: 'https://www.nvidia.com/en-us/about-nvidia/privacy-policy/' },
  { name: 'Stripe',     purpose: 'Subscription billing, payment processing, Customer Portal', region: 'US (PCI scope)', link: 'https://stripe.com/privacy' },
  { name: 'Sentry',     purpose: 'Error monitoring + release tracking (web + serverless)', region: 'US', link: 'https://sentry.io/privacy/' },
  { name: 'PostHog',    purpose: 'Product analytics — funnel + retention. Identified-only profiles; autocapture disabled.', region: 'US', link: 'https://posthog.com/privacy' },
  { name: 'Twilio',     purpose: 'Phone calls + SMS (Nexus voice, optional briefing calls)', region: 'US', link: 'https://www.twilio.com/legal/privacy' },
  { name: 'Resend',     purpose: 'Transactional email (account, billing, alerts)', region: 'US', link: 'https://resend.com/legal/privacy-policy' },
];

interface UserChoice {
  provider: string;
  type: 'BYOK' | 'oauth';
  data: string;
  control: string;
}

const USER_OPTIONAL_PROVIDERS: UserChoice[] = [
  { provider: 'Anthropic / OpenAI / Google / OpenRouter / Groq / xAI / Mistral / custom OpenAI-compatible',
    type: 'BYOK',
    data: 'Only what the user types into Nexus + agent task content',
    control: 'User-provided API key, encrypted in Supabase Vault per user. Disable in Settings → Agent → BYOK at any time.' },
  { provider: 'Google Calendar / Outlook',
    type: 'oauth',
    data: 'Calendar events the user grants access to',
    control: 'Token revocation in Settings → Integrations.' },
  { provider: 'Slack / Discord (community)',
    type: 'oauth',
    data: 'Channel + posting permissions the user grants',
    control: 'Disconnect in Settings → Integrations.' },
];

export function TrustPage() {
  return (
    <div data-marketing-root className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <header className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-cyan-400" />
            <h1 className="text-4xl font-semibold tracking-tight">Trust &amp; security</h1>
          </div>
          <p className="text-lg text-slate-300">
            Everything procurement, security, and privacy teams need before signing. Last updated{' '}
            <time dateTime="2026-04-26">April 2026</time>.
          </p>
        </header>

        <Section icon={Lock} title="Encryption">
          <ul className="space-y-2 text-slate-300">
            <li>
              <strong className="text-white">In transit:</strong> TLS 1.2+ on every connection.
              HTTPS only on app + API; HTTP redirects to HTTPS at the edge.
            </li>
            <li>
              <strong className="text-white">At rest:</strong> Postgres data is encrypted with
              AES-256 by Supabase (cloud provider managed). Browser-side cookies + tokens are
              stored encrypted in Supabase Vault per-user.
            </li>
            <li>
              <strong className="text-white">Secrets:</strong> Provider API keys are never written
              to logs and are encrypted in Supabase Vault. They are only readable by{' '}
              <code className="rounded bg-slate-800/60 px-1 py-0.5 text-[12px]">SECURITY DEFINER</code>{' '}
              RPCs gated to the owning user_id.
            </li>
          </ul>
        </Section>

        <Section icon={Server} title="Architecture &amp; data flow">
          <p className="mb-3 text-slate-300">
            SyncScript is a multi-tenant SaaS. Per-user data is isolated using Postgres
            Row-Level Security (RLS) policies on every table. The Nexus Agent runs browser
            automation in an isolated VM, with persistent browser cookies stored encrypted
            per-user in Supabase Vault — they never leave the user's vault row.
          </p>
          <p className="text-slate-300">
            Real-time updates use Supabase Realtime; outbound integrations use signed webhook
            deliveries (HMAC-SHA256) so subscribers can verify request authenticity.
          </p>
        </Section>

        <Section icon={Globe2} title="Data residency">
          <p className="text-slate-300">
            Primary user data lives in <strong className="text-white">us-east-1</strong>{' '}
            (Supabase). Web requests terminate at the nearest Vercel edge. The agent runner
            (Oracle ARM A1) is in <strong className="text-white">us-ashburn-1</strong>.
            Customers with strict data-residency requirements should contact{' '}
            <SecurityEmail />. EU residency on the roadmap.
          </p>
        </Section>

        <Section icon={KeyRound} title="Authentication">
          <ul className="space-y-2 text-slate-300">
            <li>Email + password (Supabase Auth) with password complexity gate.</li>
            <li>Google &amp; Microsoft OAuth.</li>
            <li>SAML SSO + SCIM provisioning available on Enterprise plan (via WorkOS).</li>
            <li>MFA via authenticator app — supported by Supabase Auth; opt-in per account.</li>
          </ul>
        </Section>

        <Section icon={FileText} title="Subprocessors we use">
          <p className="mb-4 text-sm text-slate-400">
            We notify customers at least 30 days before adding a new subprocessor.
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-300">Provider</th>
                  <th className="p-3 text-left font-medium text-slate-300">Purpose</th>
                  <th className="p-3 text-left font-medium text-slate-300">Region</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((p) => (
                  <tr key={p.name} className="border-t border-slate-800/60">
                    <td className="p-3">
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        {p.name}
                      </a>
                    </td>
                    <td className="p-3 text-slate-300">{p.purpose}</td>
                    <td className="p-3 text-slate-400">{p.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 mb-3 text-sm text-slate-400">
            Optional integrations (only used if the user explicitly enables them):
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-300">Provider</th>
                  <th className="p-3 text-left font-medium text-slate-300">Connection</th>
                  <th className="p-3 text-left font-medium text-slate-300">Data shared</th>
                  <th className="p-3 text-left font-medium text-slate-300">Control</th>
                </tr>
              </thead>
              <tbody>
                {USER_OPTIONAL_PROVIDERS.map((p) => (
                  <tr key={p.provider} className="border-t border-slate-800/60">
                    <td className="p-3 text-slate-300">{p.provider}</td>
                    <td className="p-3 text-slate-400">{p.type === 'BYOK' ? 'User-supplied API key' : 'OAuth grant'}</td>
                    <td className="p-3 text-slate-400">{p.data}</td>
                    <td className="p-3 text-slate-400">{p.control}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={Mail} title="Privacy &amp; GDPR">
          <ul className="space-y-2 text-slate-300">
            <li>
              <strong className="text-white">Data Processing Addendum (DPA)</strong> available on
              request from <SecurityEmail />.
            </li>
            <li>
              <strong className="text-white">Right of access / deletion / portability</strong>{' '}
              under GDPR &amp; CCPA — email <SecurityEmail /> with the request and we will
              respond within 30 days. Self-service export of tasks + documents in app Settings.
            </li>
            <li>
              We <strong className="text-white">do not sell personal data</strong>.
            </li>
            <li>
              See <Link to="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link> for the full statement.
            </li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Reporting a security issue">
          <p className="text-slate-300">
            We support good-faith security research. Report responsibly to{' '}
            <SecurityEmail />. We aim to acknowledge within 1 business day and remediate
            critical issues within 7 days.
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Disclosure file:{' '}
            <a
              href="/.well-known/security.txt"
              className="font-mono text-cyan-400 hover:underline"
            >
              /.well-known/security.txt
            </a>
          </p>
        </Section>

        <Section icon={Shield} title="Compliance status">
          <ul className="space-y-2 text-slate-300">
            <li>
              <strong className="text-white">SOC 2 Type 1:</strong> in progress (target H2 2026
              via Vanta).
            </li>
            <li>
              <strong className="text-white">SOC 2 Type 2:</strong> follows Type 1 + 6 months of
              operating evidence.
            </li>
            <li>
              <strong className="text-white">GDPR:</strong> EU data subject rights honored on request.
            </li>
            <li>
              <strong className="text-white">CCPA:</strong> California consumer rights honored on request.
            </li>
            <li>
              <strong className="text-white">HIPAA:</strong> not a covered entity; do not store PHI in SyncScript.
            </li>
          </ul>
        </Section>

        <footer className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-500">
          Questions? Reach out to <SecurityEmail /> or <Link to="/" className="text-cyan-400 hover:underline">visit our home page</Link>.
        </footer>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        {children}
      </div>
    </section>
  );
}

function SecurityEmail() {
  // Build the address inline so simple HTML scrapers can't auto-harvest.
  const u = 'security';
  const d = 'syncscript.app';
  const addr = `${u}@${d}`;
  return (
    <a className="font-mono text-cyan-400 hover:underline" href={`mailto:${addr}`}>
      {addr}
    </a>
  );
}
