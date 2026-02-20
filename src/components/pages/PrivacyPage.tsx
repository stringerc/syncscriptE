import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Database, Share2, Lock, UserCheck, Cookie, Baby, FileEdit, Mail } from 'lucide-react';

const SECTION_IDS = [
  'information-we-collect',
  'how-we-use',
  'data-sharing',
  'data-security',
  'your-rights',
  'cookies',
  'children',
  'changes',
  'contact',
];

const TOC_ITEMS = [
  { id: SECTION_IDS[0], label: 'Information We Collect' },
  { id: SECTION_IDS[1], label: 'How We Use Your Information' },
  { id: SECTION_IDS[2], label: 'Data Sharing' },
  { id: SECTION_IDS[3], label: 'Data Security' },
  { id: SECTION_IDS[4], label: 'Your Rights' },
  { id: SECTION_IDS[5], label: 'Cookies' },
  { id: SECTION_IDS[6], label: "Children's Privacy" },
  { id: SECTION_IDS[7], label: 'Changes to This Policy' },
  { id: SECTION_IDS[8], label: 'Contact Us' },
];

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
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
          <p className="mt-2 text-gray-400 text-sm">Last updated: February 15, 2026</p>
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-10">
          <nav className="lg:w-56 flex-shrink-0">
            <motion.div
              className="sticky top-8 rounded-xl border border-white/10 bg-white/5 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">On this page</p>
              <ul className="space-y-1">
                {TOC_ITEMS.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors block py-1"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </nav>

          <main className="flex-1 min-w-0 space-y-8">
            <Section id={SECTION_IDS[0]} icon={Database} title="Information We Collect">
              <p className="text-gray-300 leading-relaxed">
                SyncScript collects information necessary to deliver and improve our AI-powered productivity platform.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mt-3">
                <li><strong className="text-white">Personal information:</strong> name, email, account credentials, and profile preferences.</li>
                <li><strong className="text-white">Usage data:</strong> feature usage, session duration, and interaction patterns to improve the product.</li>
                <li><strong className="text-white">Cookies and similar technologies:</strong> to maintain sessions and remember preferences.</li>
              </ul>
            </Section>

            <Section id={SECTION_IDS[1]} icon={Share2} title="How We Use Your Information">
              <p className="text-gray-300 leading-relaxed">
                We use your information to provide, secure, and improve SyncScript.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mt-3">
                <li>Delivering and personalizing the service (calendar, tasks, AI suggestions).</li>
                <li>Improving product quality, reliability, and new features.</li>
                <li>Communicating about your account, updates, and support.</li>
                <li>Complying with legal obligations and enforcing our terms.</li>
              </ul>
            </Section>

            <Section id={SECTION_IDS[2]} icon={Share2} title="Data Sharing">
              <p className="text-gray-300 leading-relaxed">
                We do not sell your personal data. We share data only when necessary to operate the service.
              </p>
              <p className="text-gray-300 leading-relaxed mt-3">
                We may share data with service providers (hosting, analytics, support) under strict agreements. We may disclose information when required by law or to protect our rights and safety.
              </p>
            </Section>

            <Section id={SECTION_IDS[3]} icon={Lock} title="Data Security">
              <p className="text-gray-300 leading-relaxed">
                We protect your data with industry-standard measures.
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mt-3">
                <li><strong className="text-white">Encryption:</strong> AES-256 encryption for data at rest; TLS for data in transit.</li>
                <li><strong className="text-white">Certifications:</strong> SOC 2 Type II certified processes.</li>
                <li>Access controls, monitoring, and incident response procedures.</li>
              </ul>
            </Section>

            <Section id={SECTION_IDS[4]} icon={UserCheck} title="Your Rights">
              <p className="text-gray-300 leading-relaxed">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mt-3">
                <li><strong className="text-white">Access</strong> and receive a copy of your personal data.</li>
                <li><strong className="text-white">Deletion</strong> of your data, subject to legal retention requirements.</li>
                <li><strong className="text-white">Portability</strong> of your data in a machine-readable format.</li>
                <li><strong className="text-white">Opt-out</strong> of marketing and certain analytics; manage preferences in Settings.</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-3">Contact us to exercise these rights.</p>
            </Section>

            <Section id={SECTION_IDS[5]} icon={Cookie} title="Cookies">
              <p className="text-gray-300 leading-relaxed">
                We use essential cookies for authentication and session management, and optional analytics cookies to improve the product.
              </p>
              <p className="text-gray-300 leading-relaxed mt-3">
                You can manage cookie preferences in your browser or in SyncScript settings. Disabling essential cookies may limit some features.
              </p>
            </Section>

            <Section id={SECTION_IDS[6]} icon={Baby} title="Children's Privacy">
              <p className="text-gray-300 leading-relaxed">
                SyncScript is not intended for users under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us and we will delete it promptly.
              </p>
            </Section>

            <Section id={SECTION_IDS[7]} icon={FileEdit} title="Changes to This Policy">
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the "Last updated" date. Material changes may be communicated via email or an in-app notice. Continued use after changes constitutes acceptance.
              </p>
            </Section>

            <Section id={SECTION_IDS[8]} icon={Mail} title="Contact Us">
              <p className="text-gray-300 leading-relaxed">
                For privacy-related questions or requests: <a href="mailto:privacy@syncscript.app" className="text-cyan-400 hover:underline">privacy@syncscript.app</a>. We will respond within a reasonable time.
              </p>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
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
      <div className="prose prose-invert max-w-none">{children}</div>
    </motion.section>
  );
}
