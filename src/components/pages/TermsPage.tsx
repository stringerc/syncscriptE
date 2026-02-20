import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FileCheck,
  Zap,
  User,
  ShieldAlert,
  Copyright,
  CreditCard,
  LogOut,
  Scale,
  Mail,
} from 'lucide-react';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', icon: FileCheck },
  { id: 'description', title: 'Description of Service', icon: Zap },
  { id: 'accounts', title: 'User Accounts', icon: User },
  { id: 'acceptable-use', title: 'Acceptable Use', icon: ShieldAlert },
  { id: 'ip', title: 'Intellectual Property', icon: Copyright },
  { id: 'payment', title: 'Payment Terms', icon: CreditCard },
  { id: 'termination', title: 'Termination', icon: LogOut },
  { id: 'liability', title: 'Limitation of Liability', icon: Scale },
  { id: 'governing-law', title: 'Governing Law', icon: Scale },
  { id: 'contact', title: 'Contact Us', icon: Mail },
];

export function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-gray-400 text-sm">Last updated: February 15, 2026</p>
        </motion.header>

        <div className="space-y-8">
          <TermsSection id={sections[0].id} icon={FileCheck} title="Acceptance of Terms">
            By accessing or using SyncScript, you agree to these Terms of Service. If you do not agree, do not use the service. We may update these terms; continued use after changes constitutes acceptance.
          </TermsSection>

          <TermsSection id={sections[1].id} icon={Zap} title="Description of Service">
            SyncScript is an AI-powered productivity platform that helps you manage calendars, tasks, goals, and team collaboration. Features may change over time. We do not guarantee uninterrupted or error-free service.
          </TermsSection>

          <TermsSection id={sections[2].id} icon={User} title="User Accounts">
            You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your account and for all activity under your account. Notify us immediately of any unauthorized use.
          </TermsSection>

          <TermsSection id={sections[3].id} icon={ShieldAlert} title="Acceptable Use">
            You may not use SyncScript to violate laws, infringe others' rights, distribute malware, or abuse our systems. You may not reverse-engineer, scrape at scale, or resell the service without permission. We may suspend or terminate accounts that violate these terms.
          </TermsSection>

          <TermsSection id={sections[4].id} icon={Copyright} title="Intellectual Property">
            SyncScript and its content, features, and branding are owned by us or our licensors. We grant you a limited, non-exclusive license to use the service for its intended purpose. You retain ownership of content you create; you grant us a license to operate and improve the service using that content.
          </TermsSection>

          <TermsSection id={sections[5].id} icon={CreditCard} title="Payment Terms">
            Paid plans are billed according to the plan you select (e.g., monthly or annually). Fees are non-refundable except as required by law or as stated in our refund policy. We may change pricing with notice; continued use after a price increase constitutes acceptance. Taxes may apply.
          </TermsSection>

          <TermsSection id={sections[6].id} icon={LogOut} title="Termination">
            You may cancel your account at any time. We may suspend or terminate your access for breach of these terms or for operational reasons, with notice where practicable. Upon termination, your right to use the service ends; we may retain data as required by law or our Privacy Policy.
          </TermsSection>

          <TermsSection id={sections[7].id} icon={Scale} title="Limitation of Liability">
            To the maximum extent permitted by law, SyncScript and its affiliates are not liable for indirect, incidental, special, or consequential damages, or for loss of data or profits. Our total liability is limited to the amount you paid us in the twelve months preceding the claim.
          </TermsSection>

          <TermsSection id={sections[8].id} icon={Scale} title="Governing Law">
            These terms are governed by the laws of the State of California, United States, without regard to conflict of law principles. Any disputes shall be resolved in the state or federal courts located in California.
          </TermsSection>

          <TermsSection id={sections[9].id} icon={Mail} title="Contact Us">
            For legal or terms-related questions: <a href="mailto:legal@syncscript.app" className="text-cyan-400 hover:underline">legal@syncscript.app</a>. We will respond within a reasonable time.
          </TermsSection>
        </div>
      </div>
    </div>
  );
}

function TermsSection({
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
      <p className="text-gray-300 leading-relaxed">{children}</p>
    </motion.section>
  );
}
