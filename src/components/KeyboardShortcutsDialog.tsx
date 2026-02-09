import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl/Cmd', 'N'], description: 'Create new task', category: 'Tasks' },
  { keys: ['Ctrl/Cmd', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['Ctrl/Cmd', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl/Cmd', 'S'], description: 'Save changes', category: 'General' },
  { keys: ['Escape'], description: 'Close dialog', category: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'General' },
  { keys: ['Tab'], description: 'Navigate between elements', category: 'Navigation' },
  { keys: ['Enter'], description: 'Confirm action', category: 'General' },
];

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !isTyping) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 gap-2 bg-gray-900/80 backdrop-blur-sm border border-gray-800 hover:bg-gray-800 hover:scale-105 transition-all z-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        onClick={() => setIsOpen(true)}
      >
        <Keyboard className="w-4 h-4" />
        <span className="text-xs">Press ?</span>
      </Button>

      {/* Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog content */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#1e2128] border border-gray-800 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Keyboard className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-88px)]">
                {categories.map((category) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-teal-400 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {shortcuts
                        .filter((s) => s.category === category)
                        .map((shortcut, idx) => (
                          <motion.div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-900/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <span className="text-gray-300 text-sm">{shortcut.description}</span>
                            <div className="flex gap-1">
                              {shortcut.keys.map((key, keyIdx) => (
                                <kbd
                                  key={keyIdx}
                                  className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <p className="text-xs text-gray-500 text-center">
                  Press <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-400 font-mono">?</kbd> anytime to show this dialog
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}