/**
 * Keyboard shortcuts cheat-sheet overlay. Toggle with `?` (or Shift+/) when
 * not focused on an input/textarea/contenteditable. Esc to close.
 *
 * Designed to be mounted once near the App root. Doesn't conflict with
 * existing Cmd palette (which uses Cmd/Ctrl+K). Lightweight (no deps).
 */
import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  items: Array<{ keys: string[]; label: string }>;
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['Cmd', 'K'], label: 'Open command palette' },
      { keys: ['?'], label: 'Show this overlay' },
      { keys: ['G', 'D'], label: 'Go to Dashboard' },
      { keys: ['G', 'T'], label: 'Go to Tasks' },
      { keys: ['G', 'C'], label: 'Go to Calendar' },
      { keys: ['G', 'A'], label: 'Go to App AI' },
    ],
  },
  {
    title: 'Tasks',
    items: [
      { keys: ['N'], label: 'New task' },
      { keys: ['/', 'F'], label: 'Search tasks' },
      { keys: ['E'], label: 'Edit selected task' },
      { keys: ['Space'], label: 'Toggle complete' },
    ],
  },
  {
    title: 'Voice & AI',
    items: [
      { keys: ['Cmd', 'Shift', 'V'], label: 'Open immersive voice' },
      { keys: ['Cmd', 'Shift', 'A'], label: 'Quick chat with Nexus' },
      { keys: ['Esc'], label: 'Close any modal / leave voice' },
    ],
  },
  {
    title: 'Editor',
    items: [
      { keys: ['Cmd', 'B'], label: 'Bold' },
      { keys: ['Cmd', 'I'], label: 'Italic' },
      { keys: ['Cmd', 'Z'], label: 'Undo' },
      { keys: ['Cmd', 'Shift', 'Z'], label: 'Redo' },
    ],
  },
];

export function KeyboardShortcutsOverlay(): JSX.Element | null {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip when focus is on an input/contenteditable so typing "?" in a
      // chat composer doesn't pop the overlay.
      const t = e.target as HTMLElement | null;
      const tag = (t?.tagName || '').toLowerCase();
      const editable = !!t?.isContentEditable;
      const inField = editable || tag === 'input' || tag === 'textarea' || tag === 'select';

      if (!open && !inField && e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (open && e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[490] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-shortcuts-title"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-gray-700 bg-[#13141a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <h2 id="kb-shortcuts-title" className="flex items-center gap-2 text-sm font-medium text-white">
            <Keyboard className="w-4 h-4 text-cyan-400" />
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4">
          {SHORTCUTS.map((g) => (
            <div key={g.title}>
              <div className="text-[10px] uppercase tracking-wide text-cyan-400/80 mb-1.5">{g.title}</div>
              <ul className="space-y-1">
                {g.items.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-gray-300">{s.label}</span>
                    <span className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="rounded-md border border-gray-700 bg-gray-900 px-1.5 py-0.5 text-[10px] font-mono text-gray-200"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 px-4 py-2 text-[10px] text-gray-500">
          Press <kbd className="rounded border border-gray-700 bg-gray-900 px-1 font-mono text-gray-300">?</kbd> anytime to reopen ·
          <kbd className="ml-2 rounded border border-gray-700 bg-gray-900 px-1 font-mono text-gray-300">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
