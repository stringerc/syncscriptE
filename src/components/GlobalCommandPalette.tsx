import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

interface CommandItem {
  label: string;
  path: string;
  keywords: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  { label: 'Dashboard', path: '/dashboard', keywords: ['home', 'overview', 'main'] },
  { label: 'Tasks & Goals', path: '/tasks', keywords: ['workstream', 'projects', 'todos'] },
  { label: 'Calendar', path: '/calendar', keywords: ['schedule', 'events', 'timeline'] },
  { label: 'Financials', path: '/financials', keywords: ['finance', 'money', 'cashflow'] },
  { label: 'Email Hub', path: '/email', keywords: ['inbox', 'mail'] },
  { label: 'Agents', path: '/agents', keywords: ['ai', 'assistant', 'nexus'] },
  { label: 'Analytics', path: '/analytics', keywords: ['insights', 'metrics'] },
  { label: 'Team', path: '/team', keywords: ['collaboration', 'members'] },
  { label: 'Integrations', path: '/integrations', keywords: ['apps', 'connections'] },
  { label: 'Enterprise Tools', path: '/enterprise', keywords: ['optimizer', 'scorecard'] },
  { label: 'Settings', path: '/settings', keywords: ['preferences', 'config'] },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function GlobalCommandPalette() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && normalize(event.key) === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const tag = normalize(target?.tagName || '');
        const typing = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
        if (!typing) {
          event.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return COMMAND_ITEMS;
    return COMMAND_ITEMS.filter((item) => {
      const haystack = `${item.label} ${item.path} ${item.keywords.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const onSelect = (item: CommandItem) => {
    setOpen(false);
    if (pathname !== item.path) {
      navigate(item.path);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Quick Navigation</DialogTitle>
          <DialogDescription>
            Press Ctrl+K or Cmd+K to open. Press ? anywhere on dashboard pages.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find pages and tools..."
              className="pl-9"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-700 bg-[#0f1319]">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400">No matching pages.</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="w-full text-left px-3 py-2.5 border-b last:border-b-0 border-gray-800 hover:bg-[#171c25] transition-colors"
                >
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.path}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
