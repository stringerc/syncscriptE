import { motion } from 'motion/react';
import { ArrowLeft, Key, Zap, Shield, Code2, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router';

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const endpoints = [
  { method: 'GET', path: '/v1/me', desc: 'Get current user profile and preferences.' },
  { method: 'GET', path: '/v1/events', desc: 'List calendar events with optional date range and calendar filters.' },
  { method: 'POST', path: '/v1/events', desc: 'Create a new calendar event.' },
  { method: 'PUT', path: '/v1/events/:id', desc: 'Update an existing event.' },
  { method: 'DELETE', path: '/v1/events/:id', desc: 'Delete an event.' },
];

const codeExample = `// List events (include API key in header)
const res = await fetch('https://api.syncscript.app/v1/events?from=2025-02-01&to=2025-02-28', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
});
const events = await res.json();`;

export function ApiPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </motion.a>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">API Reference</h1>
          <p className="text-white/70 text-lg">Build powerful integrations with SyncScript</p>
        </motion.div>

        <motion.section
          className="mb-12 rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold mb-4">Overview</h2>
          <ul className="space-y-3 text-white/80 text-sm">
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">REST API</strong> — JSON over HTTPS. Base URL: <code className="bg-white/10 px-1 rounded">https://api.syncscript.app</code></span>
            </li>
            <li className="flex items-start gap-3">
              <Key className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Authentication</strong> — Use API keys in the <code className="bg-white/10 px-1 rounded">Authorization: Bearer &lt;key&gt;</code> header.</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span><strong className="text-white">Rate limits</strong> — 100 requests/minute per key; higher limits on paid plans.</span>
            </li>
          </ul>
        </motion.section>

        <h2 className="text-xl font-bold mb-4">Endpoints</h2>
        <div className="space-y-3 mb-12">
          {endpoints.map((ep, i) => (
            <motion.div
              key={ep.path + ep.method}
              className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-sm flex flex-wrap items-start gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-cyan-300 font-mono text-sm">{ep.path}</code>
              <p className="text-sm text-white/70 w-full mt-1">{ep.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.section
          className="mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" /> Code example
          </h2>
          <pre className="rounded-xl bg-[#0d1117] border border-white/10 p-4 text-sm text-white/90 overflow-x-auto font-mono">
            <code>{codeExample}</code>
          </pre>
        </motion.section>

        <motion.section
          className="mb-12 rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" /> SDKs
          </h2>
          <p className="text-white/70 text-sm mb-2">Official SDKs (coming soon): JavaScript/TypeScript, Python.</p>
          <p className="text-sm text-white/50">Until then, use the REST API with fetch or your preferred HTTP client.</p>
        </motion.section>

        <motion.div
          className="rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-white/10 backdrop-blur-sm text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-semibold text-lg mb-2">Get your API key</h3>
          <p className="text-sm text-white/70 mb-4">Create and manage API keys in Settings → API.</p>
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors font-medium"
            onClick={() => navigate('/settings')}
          >
            Go to Settings
          </button>
        </motion.div>
      </div>
    </div>
  );
}
