import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

/**
 * Global keyboard shortcuts hook
 * Handles navigation, search, and modal shortcuts
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow ESC to blur inputs
        if (event.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Mode navigation shortcuts (Cmd/Ctrl + 1-4)
      if (modifierKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: Home (Cmd+1)');
            navigate('/home');
            break;
          case '2':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: Do (Cmd+2)');
            navigate('/do');
            break;
          case '3':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: Plan (Cmd+3)');
            navigate('/plan');
            break;
          case '4':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: Manage (Cmd+4)');
            navigate('/manage');
            break;
          case 'k':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: AI Assistant (Cmd+K) - Coming soon!');
            // TODO: Open AI Assistant modal
            break;
        }
      }

      // Single key shortcuts (no modifier)
      if (!modifierKey && !event.shiftKey && !event.altKey) {
        switch (event.key) {
          case '/':
            event.preventDefault();
            console.log('⌨️ Keyboard shortcut: Focus search (/)');
            // Focus search input
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case 'e':
            // Only trigger on Home mode
            if (location.pathname === '/home') {
              event.preventDefault();
              console.log('⌨️ Keyboard shortcut: Quick energy update (E)');
              // TODO: Open energy selector modal
            }
            break;
          case 'Escape':
            console.log('⌨️ Keyboard shortcut: Close modal (ESC)');
            // Close any open dialogs/modals
            const closeButtons = document.querySelectorAll('[data-dialog-close]');
            closeButtons.forEach(button => {
              if (button instanceof HTMLElement) {
                button.click();
              }
            });
            break;
        }
      }

      // Help shortcut (Shift + ?)
      if (event.shiftKey && event.key === '?') {
        event.preventDefault();
        console.log('⌨️ Keyboard shortcut: Show help (?)');
        showKeyboardHelp();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Log shortcuts on mount
    console.log('⌨️ Keyboard shortcuts enabled:');
    console.log('   Cmd/Ctrl + 1-4: Switch modes');
    console.log('   Cmd/Ctrl + K: AI Assistant');
    console.log('   /: Focus search');
    console.log('   E: Quick energy (Home mode)');
    console.log('   ESC: Close modals');
    console.log('   Shift + ?: Show help');

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location]);
}

/**
 * Show keyboard shortcuts help overlay
 */
function showKeyboardHelp() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: `${mod} + 1`, action: 'Home mode' },
    { keys: `${mod} + 2`, action: 'Do mode (Tasks)' },
    { keys: `${mod} + 3`, action: 'Plan mode (Calendar)' },
    { keys: `${mod} + 4`, action: 'Manage mode (Admin)' },
    { keys: `${mod} + K`, action: 'AI Assistant' },
    { keys: '/', action: 'Focus search' },
    { keys: 'E', action: 'Quick energy update (Home)' },
    { keys: 'ESC', action: 'Close modal' },
    { keys: 'Shift + ?', action: 'Show this help' },
  ];

  console.table(shortcuts);
  
  // TODO: Show a nice modal with shortcuts
  alert(`Keyboard Shortcuts:\n\n${shortcuts.map(s => `${s.keys}: ${s.action}`).join('\n')}`);
}
