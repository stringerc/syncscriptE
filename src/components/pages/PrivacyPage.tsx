import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Eye,
  Database,
  Cookie,
  Share2,
  Shield,
  Clock,
  Baby,
  Globe,
  RefreshCw,
  Mail,
} from 'lucide-react';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <motion.a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </motion.a>

        <motion.header
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-400 text-sm">Last updated: February 18, 2026</p>
        </motion.header>

        <div className="space-y-8">
          <Section icon={Eye} title="Information We Collect">
            We collect information you provide directly: name, email address, and account preferences when you register. When you use SyncScript, we collect usage data such as tasks created, calendar events, and interaction patterns to power our AI features. We also collect device information, IP addresses, and browser type automatically via standard web technologies.
          </Section>

          <Section icon={Database} title="How We Use Your Data">
            Your data is used to provide and improve SyncScript's services, including AI-powered scheduling, energy tracking, and productivity insights. We use aggregated, anonymized data to improve our algorithms. We never sell your personal data to third parties. We may use your email to send transactional messages (receipts, security alerts) and, with your consent, product updates.
          </Section>

          <Section icon={Cookie} title="Cookies & Analytics">
            We use Plausible Analytics, a privacy-friendly analytics tool that does not use cookies and does not track personal data. No cookie consent banner is required. If you log in, we use essential session cookies to maintain your authentication state. We do not use advertising cookies or cross-site trackers.
          </Section>

          <Section icon={Share2} title="Third-Party Services">
            We integrate with third-party services to provide our features: Stripe for payment processing, Supabase for authentication and data storage, and AI providers for intelligent features. Each third party processes data according to their own privacy policies. We only share the minimum data necessary for each service to function. We do not share your data with advertisers.
          </Section>

          <Section icon={Shield} title="Data Security">
            We protect your data with industry-standard security measures including AES-256 encryption at rest, TLS 1.3 encryption in transit, and SOC 2 Type II certified infrastructure. Access to production data is restricted to authorized personnel with multi-factor authentication. We conduct regular security audits and penetration testing.
          </Section>

          <Section icon={Clock} title="Data Retention">
            We retain your account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law (e.g., financial records). Anonymized, aggregated data may be retained indefinitely for service improvement.
          </Section>

          <Section icon={Baby} title="Children's Privacy">
            SyncScript is not intended for children under 13 (or under 16 in the EEA). We do not knowingly collect personal data from children. If we learn that we have collected data from a child, we will delete it promptly. If you believe a child has provided us with personal data, please contact us.
          </Section>

          <Section icon={Globe} title="International Transfers">
            Your data may be processed in the United States and other countries where our service providers operate. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses where required by GDPR.
          </Section>

          <Section icon={RefreshCw} title="Your Rights">
            Depending on your location, you may have rights to access, correct, delete, or port your personal data, and to opt out of certain processing. California residents have additional rights under the CCPA. EU/EEA residents have rights under GDPR. To exercise any of these rights, contact us at the email below. We will respond within 30 days.
          </Section>

          <Section icon={Mail} title="Contact Us">
            For privacy-related questions or to exercise your data rights: <a href="mailto:privacy@syncscript.app" className="text-cyan-400 hover:underline">privacy@syncscript.app</a>. For general support: <a href="mailto:support@syncscript.app" className="text-cyan-400 hover:underline">support@syncscript.app</a>.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="rounded-xl border border-white/10 bg-white/5 p-6 scroll-mt-24"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-cyan-400" />
        {title}
      </h2>
      <p className="text-gray-300 leading-relaxed">{children}</p>
    </motion.section>
  );
}
