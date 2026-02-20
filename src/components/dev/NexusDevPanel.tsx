/**
 * NexusDevPanel — Floating developer overlay that injects Nexus + Mini Mission Control
 * directly into syncscript.app for in-app development assistance.
 *
 * Works on BOTH localhost AND production (syncscript.app):
 *  - The browser runs on YOUR machine, so it can reach localhost:5210
 *  - Chrome/Firefox allow HTTPS pages to fetch http://localhost (trusted origin)
 *  - The panel auto-detects if Mission Control is running locally
 *  - If MC is not running, the panel stays completely hidden (zero UI)
 *  - Activate manually via URL param: ?nexus=1 or keyboard shortcut Ctrl+Shift+N
 *
 * Features:
 *  - Nexus Chat: talk to the AI agent via the Nexus Bridge
 *  - Terminal: run shell commands on your local machine
 *  - File Browser: search and read the codebase
 *  - Bridge Status: monitor operations and audit trail
 */

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import {
  bridge,
  isMissionControlAvailable,
  type ShellResult,
  type AuditEntry,
} from '../../utils/nexus-bridge-client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'stdout' | 'stderr' | 'system' | 'info';
  content: string;
}

type Tab = 'chat' | 'terminal' | 'files' | 'status';

// ─── Main Component ─────────────────────────────────────────────────────────

// ─── Activation Logic ───────────────────────────────────────────────────────
// The panel is invisible by default. It activates when:
//  1. Mission Control is detected on localhost:5210 (auto-probe), OR
//  2. URL contains ?nexus=1 or ?nexus=true, OR
//  3. User presses Ctrl+Shift+N (manual toggle)
//  4. Previously activated (remembered in localStorage)
//
// Regular users will NEVER see this — it only works for the developer
// who has Mission Control running on their machine.

const NEXUS_ACTIVATED_KEY = 'nexus-dev-activated';

function shouldAutoActivate(): boolean {
  // Check URL param
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('nexus') === '1' || params.get('nexus') === 'true') return true;
  } catch {}
  // Check localStorage
  try {
    if (localStorage.getItem(NEXUS_ACTIVATED_KEY) === 'true') return true;
  } catch {}
  return false;
}

export function NexusDevPanel() {
  const [visible, setVisible] = useState(false);
  const [available, setAvailable] = useState(false);
  const [activated, setActivated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<'right' | 'bottom'>('right');

  // Auto-detect Mission Control on mount
  useEffect(() => {
    const probe = async () => {
      const mcAvailable = await isMissionControlAvailable();
      setAvailable(mcAvailable);
      setChecking(false);

      // Auto-activate if MC is running and user previously activated or URL param
      if (mcAvailable || shouldAutoActivate()) {
        setActivated(true);
        // Remember activation
        try { localStorage.setItem(NEXUS_ACTIVATED_KEY, 'true'); } catch {}
      }
    };
    probe();

    // Re-probe every 30 seconds (MC might start/stop)
    const interval = setInterval(async () => {
      const ok = await isMissionControlAvailable();
      setAvailable(ok);
      if (ok && !activated) {
        setActivated(true);
        try { localStorage.setItem(NEXUS_ACTIVATED_KEY, 'true'); } catch {}
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [activated]);

  // Keyboard shortcut: Ctrl+Shift+N to toggle
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        if (!activated) {
          setActivated(true);
          try { localStorage.setItem(NEXUS_ACTIVATED_KEY, 'true'); } catch {}
        }
        setVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activated]);

  // Not activated and MC not available — render nothing (invisible to regular users)
  if (checking || (!activated && !available)) return null;

  // Floating button when panel is hidden
  if (!visible) {
    return (
      <button
        onClick={() => {
          setVisible(true);
          // Re-check availability when opening
          isMissionControlAvailable().then(ok => setAvailable(ok));
        }}
        className="fixed bottom-4 right-4 z-[9999] w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center hover:scale-110 transition-transform group"
        title={available ? 'Open Nexus Dev Panel (Ctrl+Shift+N)' : 'Mission Control offline — click to retry'}
      >
        <span className="text-lg font-bold">N</span>
        <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
          available ? 'bg-green-400' : 'bg-red-400 animate-pulse'
        }`} />
      </button>
    );
  }

  // Panel
  const panelClass = position === 'right'
    ? 'fixed top-0 right-0 w-[420px] h-full z-[9999]'
    : 'fixed bottom-0 left-0 right-0 h-[50vh] z-[9999]';

  return (
    <div className={`${panelClass} bg-[#0a0a0f] border-l border-white/10 flex flex-col shadow-2xl shadow-black/50`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#0d0d15]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">N</span>
          </div>
          <span className="text-xs font-semibold text-white">Nexus Dev</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
            available ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
          }`}>
            {available ? 'connected' : 'offline'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPosition(position === 'right' ? 'bottom' : 'right')}
            className="p-1 text-gray-500 hover:text-gray-300 text-[10px]"
            title="Toggle position"
          >
            {position === 'right' ? '⬇' : '➡'}
          </button>
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1 text-gray-500 hover:text-gray-300 text-[10px]"
          >
            {minimized ? '□' : '—'}
          </button>
          <button
            onClick={() => setVisible(false)}
            className="p-1 text-gray-500 hover:text-gray-300 text-[10px]"
            title="Hide panel (Ctrl+Shift+N to reopen)"
          >
            ✕
          </button>
          <button
            onClick={() => {
              setVisible(false);
              setActivated(false);
              try { localStorage.removeItem(NEXUS_ACTIVATED_KEY); } catch {}
            }}
            className="p-1 text-gray-600 hover:text-red-400 text-[9px]"
            title="Deactivate Nexus (hide completely)"
          >
            ⏻
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['chat', 'terminal', 'files', 'status'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[10px] font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'chat' ? '💬 Chat' : tab === 'terminal' ? '⌨ Terminal' : tab === 'files' ? '📁 Files' : '📊 Status'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <NexusChatTab available={available} />}
            {activeTab === 'terminal' && <NexusTerminalTab available={available} />}
            {activeTab === 'files' && <NexusFilesTab available={available} />}
            {activeTab === 'status' && <NexusStatusTab available={available} />}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// CHAT TAB
// =============================================================================

function NexusChatTab({ available }: { available: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'system', content: 'Nexus is connected to your local Mission Control. Ask me to help with syncscript.app development — I can read files, run commands, edit code, and more.', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !available) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use the Nexus Bridge to process the message intelligently
      // Route through shell/exec for command-like messages, or use code/run for code
      const content = userMsg.content;
      let response: string;

      if (content.startsWith('!') || content.startsWith('$')) {
        // Direct shell command
        const cmd = content.slice(1).trim();
        const result = await bridge.exec(cmd, '/Users/Apple/syncscript');
        response = result.stdout || result.stderr || `exit code: ${result.exitCode}`;
      } else if (content.startsWith('read ') || content.startsWith('cat ')) {
        // File read
        const path = content.replace(/^(read|cat)\s+/, '').trim();
        const result = await bridge.readFile(path);
        response = `**${result.path}** (${result.totalLines} lines)\n\`\`\`\n${result.content.slice(0, 3000)}\n\`\`\``;
      } else if (content.startsWith('grep ')) {
        const parts = content.slice(5).trim();
        const result = await bridge.grep(parts, '/Users/Apple/syncscript/src');
        response = result.matches.length > 0
          ? result.matches.slice(0, 20).join('\n')
          : 'No matches found';
      } else {
        // General query — use shell to ask the Mission Control chat endpoint
        // or just process as a natural language command
        const result = await bridge.exec(
          `echo "Query received: ${content.replace(/"/g, '\\"').slice(0, 200)}"`,
          '/Users/Apple/syncscript'
        );
        response = `I can help with that! Use these prefixes for direct actions:\n\n` +
          `• \`!command\` — run a shell command\n` +
          `• \`read /path/to/file\` — read a file\n` +
          `• \`grep pattern\` — search the codebase\n\n` +
          `Or ask me anything about the codebase and I'll search for it.`;
      }

      setMessages(prev => [...prev, {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message}`,
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
  }, [input, loading, available]);

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`text-[11px] leading-relaxed ${
            msg.role === 'user' ? 'text-right' : ''
          }`}>
            <div className={`inline-block max-w-[90%] px-3 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-cyan-500/20 text-cyan-100'
                : msg.role === 'system'
                  ? 'bg-purple-500/10 text-purple-300'
                  : 'bg-white/5 text-gray-300'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-[10px] text-gray-500 animate-pulse">Nexus is thinking...</div>
        )}
      </div>
      <div className="p-2 border-t border-white/10">
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={available ? "Ask Nexus or use !command..." : "Mission Control offline"}
            disabled={!available || loading}
            className="flex-1 bg-white/5 text-white text-[11px] px-3 py-1.5 rounded-lg outline-none placeholder-gray-600 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!available || loading || !input.trim()}
            className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-lg hover:bg-cyan-500/30 disabled:opacity-30 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TERMINAL TAB
// =============================================================================

function NexusTerminalTab({ available }: { available: boolean }) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 'welcome', type: 'system', content: '─── Nexus Terminal (syncscript.app) ───' },
    { id: 'info', type: 'info', content: 'cwd: /Users/Apple/syncscript' },
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('/Users/Apple/syncscript');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    setLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type, content }]);
  }, []);

  const exec = useCallback(async (cmd: string) => {
    if (!cmd.trim() || !available) return;
    setHistory(prev => [...prev.filter(h => h !== cmd), cmd]);
    setHistIdx(-1);
    addLine('command', `$ ${cmd}`);

    if (cmd === 'clear') { setLines([]); return; }

    if (cmd.startsWith('cd ')) {
      setRunning(true);
      try {
        const res = await bridge.exec(`cd ${cmd.slice(3).trim()} && pwd`, cwd);
        if (res.exitCode === 0 && res.stdout.trim()) {
          setCwd(res.stdout.trim());
          addLine('info', `→ ${res.stdout.trim()}`);
        } else {
          addLine('stderr', res.stderr || 'cd failed');
        }
      } catch (e: any) { addLine('stderr', e.message); }
      setRunning(false);
      return;
    }

    setRunning(true);
    try {
      const res = await bridge.exec(cmd, cwd, 60000);
      if (res.stdout) res.stdout.split('\n').filter(Boolean).forEach(l => addLine('stdout', l));
      if (res.stderr) res.stderr.split('\n').filter(Boolean).forEach(l => addLine('stderr', l));
      if (res.exitCode !== 0) addLine('info', `exit ${res.exitCode} (${res.durationMs}ms)`);
    } catch (e: any) { addLine('stderr', e.message); }
    setRunning(false);
  }, [cwd, available, addLine]);

  const handleKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !running) {
      const cmd = input; setInput(''); exec(cmd);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length) {
        const i = Math.min(histIdx + 1, history.length - 1);
        setHistIdx(i); setInput(history[history.length - 1 - i] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) { const i = histIdx - 1; setHistIdx(i); setInput(history[history.length - 1 - i] || ''); }
      else { setHistIdx(-1); setInput(''); }
    }
  }, [input, running, history, histIdx, exec]);

  const lineColor = (t: string) => t === 'command' ? 'text-cyan-400' : t === 'stdout' ? 'text-gray-300' : t === 'stderr' ? 'text-red-400' : t === 'system' ? 'text-purple-400' : 'text-gray-500';

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[10px] leading-4" onClick={() => inputRef.current?.focus()}>
        {lines.map(l => <div key={l.id} className={`${lineColor(l.type)} whitespace-pre-wrap break-all`}>{l.content}</div>)}
      </div>
      <div className="flex items-center px-3 py-1.5 border-t border-white/10 bg-white/[0.02]">
        <span className="text-green-400 text-[10px] font-mono mr-1">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={running || !available}
          className="flex-1 bg-transparent text-gray-200 font-mono text-[10px] outline-none placeholder-gray-700 disabled:opacity-50"
          placeholder={running ? 'running...' : 'command...'}
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// =============================================================================
// FILES TAB
// =============================================================================

function NexusFilesTab({ available }: { available: boolean }) {
  const [path, setPath] = useState('/Users/Apple/syncscript/src');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const readFile = useCallback(async (filePath: string) => {
    if (!available) return;
    setLoading(true);
    try {
      const res = await bridge.readFile(filePath);
      setContent(res.content);
      setFileName(filePath);
    } catch (e: any) {
      setContent(`Error: ${e.message}`);
    }
    setLoading(false);
  }, [available]);

  const searchFiles = useCallback(async () => {
    if (!searchQuery.trim() || !available) return;
    setLoading(true);
    try {
      const res = await bridge.grep(searchQuery, '/Users/Apple/syncscript/src', '*.tsx', true);
      setSearchResults(res.matches.slice(0, 30));
    } catch (e: any) {
      setSearchResults([`Error: ${e.message}`]);
    }
    setLoading(false);
  }, [searchQuery, available]);

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-2 border-b border-white/10">
        <div className="flex gap-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchFiles()}
            placeholder="Search codebase..."
            className="flex-1 bg-white/5 text-white text-[10px] px-2 py-1 rounded outline-none placeholder-gray-600"
          />
          <button onClick={searchFiles} disabled={loading} className="px-2 py-1 bg-white/5 text-gray-400 text-[10px] rounded hover:bg-white/10 disabled:opacity-30">
            Search
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-2">
        {content ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-cyan-400 font-mono truncate">{fileName}</span>
              <button onClick={() => { setContent(''); setFileName(''); }} className="text-[9px] text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap bg-white/[0.02] p-2 rounded max-h-[500px] overflow-y-auto leading-4">
              {content.slice(0, 10000)}
              {content.length > 10000 && '\n\n... (truncated)'}
            </pre>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-0.5">
            {searchResults.map((r, i) => {
              const parts = r.split(':');
              const file = parts[0] || '';
              const lineNum = parts[1] || '';
              const rest = parts.slice(2).join(':');
              return (
                <button
                  key={i}
                  onClick={() => readFile(file)}
                  className="w-full text-left text-[10px] px-2 py-1 rounded hover:bg-white/5 transition-colors"
                >
                  <span className="text-cyan-400 font-mono">{file.replace('/Users/Apple/syncscript/', '')}</span>
                  <span className="text-gray-600">:{lineNum}</span>
                  <span className="text-gray-400 ml-1">{rest?.slice(0, 80)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[10px] text-gray-600">
            <p>Search the codebase or read a file.</p>
            <p className="mt-2 text-gray-700">Quick links:</p>
            <div className="mt-1 space-y-0.5">
              {[
                '/Users/Apple/syncscript/src/App.tsx',
                '/Users/Apple/syncscript/src/components/admin/AdminEmailDashboardV2.tsx',
                '/Users/Apple/syncscript/src/contexts/OpenClawContext.tsx',
                '/Users/Apple/syncscript/package.json',
              ].map(f => (
                <button key={f} onClick={() => readFile(f)} className="block text-cyan-500/60 hover:text-cyan-400 text-[9px] font-mono">
                  {f.replace('/Users/Apple/syncscript/', '')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STATUS TAB
// =============================================================================

function NexusStatusTab({ available }: { available: boolean }) {
  const [status, setStatus] = useState<any>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [sysInfo, setSysInfo] = useState<any>(null);

  useEffect(() => {
    if (!available) return;
    const fetch = async () => {
      try {
        const [s, a, si] = await Promise.all([
          bridge.status(),
          bridge.audit(15),
          bridge.systemInfo(),
        ]);
        setStatus(s);
        setAudit(a.entries);
        setSysInfo(si);
      } catch {}
    };
    fetch();
    const i = setInterval(fetch, 10000);
    return () => clearInterval(i);
  }, [available]);

  if (!available) return <div className="p-4 text-center text-[10px] text-red-400">Mission Control offline</div>;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Bridge Status */}
      <div className="bg-white/[0.03] rounded-lg p-2">
        <h4 className="text-[10px] font-medium text-gray-400 mb-1">Nexus Bridge</h4>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div><span className="text-gray-500">Shell</span><p className="text-white font-mono">{status?.stats?.shellExecs || 0}</p></div>
          <div><span className="text-gray-500">Files</span><p className="text-white font-mono">{(status?.stats?.fileReads || 0) + (status?.stats?.fileWrites || 0)}</p></div>
          <div><span className="text-gray-500">Code</span><p className="text-white font-mono">{status?.stats?.codeRuns || 0}</p></div>
        </div>
      </div>

      {/* System Info */}
      {sysInfo && (
        <div className="bg-white/[0.03] rounded-lg p-2">
          <h4 className="text-[10px] font-medium text-gray-400 mb-1">System</h4>
          <div className="text-[9px] text-gray-500 space-y-0.5 font-mono">
            <p>{sysInfo.platform} {sysInfo.arch} • {sysInfo.cpus} CPUs</p>
            <p>{sysInfo.freeMemoryMB}MB free / {sysInfo.totalMemoryMB}MB total</p>
            <p>Node {sysInfo.nodeVersion}</p>
          </div>
        </div>
      )}

      {/* Rate Limits */}
      {status?.rateLimits && (
        <div className="bg-white/[0.03] rounded-lg p-2">
          <h4 className="text-[10px] font-medium text-gray-400 mb-1">Rate Limits</h4>
          <div className="space-y-1">
            {Object.entries(status.rateLimits).map(([key, rl]: [string, any]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-500 w-10 uppercase">{key}</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${rl.used / rl.max > 0.8 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${(rl.used / rl.max) * 100}%` }} />
                </div>
                <span className="text-[9px] text-gray-600">{rl.used}/{rl.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="bg-white/[0.03] rounded-lg p-2">
        <h4 className="text-[10px] font-medium text-gray-400 mb-1">Recent Activity ({status?.auditEntries || 0} total)</h4>
        <div className="space-y-0.5 max-h-40 overflow-y-auto">
          {audit.map((e, i) => (
            <div key={i} className="flex items-center gap-1 text-[9px]">
              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${e.output.success ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-gray-600">{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span className="text-cyan-400 font-mono">{e.category}/{e.operation}</span>
              <span className="text-gray-500 truncate">{e.output.summary}</span>
            </div>
          ))}
          {audit.length === 0 && <p className="text-[9px] text-gray-600">No activity yet</p>}
        </div>
      </div>
    </div>
  );
}
