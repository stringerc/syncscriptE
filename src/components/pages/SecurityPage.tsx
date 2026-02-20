import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Shield,
  Server,
  Key,
  Lock,
  FileCheck,
  Bug,
  ClipboardCheck,
  Award,
} from 'lucide-react';

const BADGES = [
  { label: 'SOC 2 Type II', icon: Award },
  { label: 'AES-256', icon: Lock },
  { label: 'GDPR Compliant', icon: FileCheck },
  { label: '99.9% Uptime', icon: Shield },
];

export function SecurityPage() {
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
          className="mb-10 text-center md:text-left"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Security
          </h1>
          <p className="mt-2 text-gray-400 text-lg">Your data security is our top priority</p>
          <p className="mt-1 text-gray-500 text-sm">Last updated: February 15, 2026</p>
        </motion.header>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {BADGES.map(({ label, icon: Icon }, i) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center gap-2 text-center"
            >
              <Icon className="w-8 h-8 text-cyan-400" />
              <span className="text-sm font-medium text-white">{label}</span>
            </div>
          ))}
        </motion.div>

        <div className="space-y-8">
          <SecSection icon={Server} title="Infrastructure">
            <p className="text-gray-300 leading-relaxed mb-3">
              SyncScript runs on industry-leading cloud infrastructure (AWS). Data is stored in geographically distributed regions with redundancy and failover.
            </p>
            <p className="text-gray-300 leading-relaxed">
              All data is encrypted at rest using AES-256 and in transit using TLS 1.3. We do not store payment card numbers; payment processing is handled by PCI-DSS compliant providers.
            </p>
          </SecSection>

          <SecSection icon={Key} title="Authentication">
            <p className="text-gray-300 leading-relaxed mb-3">
              We support multi-factor authentication (MFA) to protect your account. Sign-in options include OAuth 2.0 with major identity providers and secure password-based login.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Sessions are managed with secure, httpOnly cookies and short-lived tokens. You can view and revoke active sessions in your account settings.
            </p>
          </SecSection>

          <SecSection icon={Lock} title="Data Protection">
            <p className="text-gray-300 leading-relaxed mb-3">
              We apply encryption standards consistently: AES-256 for data at rest and TLS for all data in transit. Backups are encrypted and stored in separate locations.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Access to production data is restricted by role, audited, and required only for operational and support needs. We follow the principle of least privilege.
            </p>
          </SecSection>

          <SecSection icon={FileCheck} title="Compliance">
            <p className="text-gray-300 leading-relaxed mb-3">
              We align with major privacy and security frameworks: GDPR (EU), CCPA (California), and SOC 2 Type II. Our practices are designed to meet enterprise and regulatory expectations.
            </p>
            <p className="text-gray-300 leading-relaxed">
              We maintain documentation for compliance reviews and can provide summaries or questionnaires upon request for qualified customers.
            </p>
          </SecSection>

          <SecSection icon={Bug} title="Vulnerability Disclosure & Bug Bounty">
            <p className="text-gray-300 leading-relaxed mb-3">
              We welcome reports of security vulnerabilities. If you believe you have found a security issue, please report it responsibly to avoid harm to our users.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Contact: <a href="mailto:security@syncscript.app" className="text-cyan-400 hover:underline">security@syncscript.app</a>. We aim to acknowledge reports promptly and will work with you to understand and address valid findings. We do not pursue legal action against researchers who follow responsible disclosure.
            </p>
          </SecSection>

          <SecSection icon={ClipboardCheck} title="Security Practices">
            <ul className="text-gray-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">Regular audits:</strong> Internal and third-party reviews of our security posture.</li>
              <li><strong className="text-white">Penetration testing:</strong> Periodic tests to identify and remediate vulnerabilities.</li>
              <li><strong className="text-white">Employee training:</strong> Security and privacy training for all personnel with access to systems or data.</li>
              <li><strong className="text-white">Incident response:</strong> Documented procedures to detect, contain, and communicate security incidents.</li>
            </ul>
          </SecSection>
        </div>
      </div>
    </div>
  );
}

function SecSection({
  icon: Icon,
  title,
  children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      className="rounded-xl border border-white/10 bg-white/5 p-6"
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
