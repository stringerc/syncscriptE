// Guest Mode Banner Component
// Research-backed UX: Nielsen Norman Group - Progressive disclosure pattern
// Shows status, time remaining, and strategic save prompts

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Download, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';

export function GuestModeBanner() {
  const { user, checkGuestStatus, exportGuestData } = useAuth();
  const navigate = useNavigate();
  const [guestStatus, setGuestStatus] = useState<{
    isGuest: boolean;
    timeRemaining?: { days: number; hours: number };
  }>({ isGuest: false });
  const [showBanner, setShowBanner] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchGuestStatus() {
      try {
        const status = await checkGuestStatus();
        setGuestStatus(status);
      } catch (error) {
        // Silently handle errors - don't show banner if we can't check status
        console.debug('[GuestBanner] Failed to check guest status, hiding banner');
        setGuestStatus({ isGuest: false });
      }
    }

    // Only fetch if user is explicitly marked as a guest
    if (user?.isGuest === true) {
      fetchGuestStatus();
      // Check status every minute
      const interval = setInterval(fetchGuestStatus, 60000);
      return () => clearInterval(interval);
    } else {
      // Reset guest status if user is not a guest
      setGuestStatus({ isGuest: false });
    }
  }, [user, checkGuestStatus]);

  async function handleExportData() {
    setExporting(true);
    try {
      const result = await exportGuestData();
      
      if (result.success && result.data) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syncscript-guest-backup-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  function handleSaveProgress() {
    navigate('/signup?from=guest');
  }

  if (!guestStatus.isGuest || !showBanner) {
    return null;
  }

  const { timeRemaining } = guestStatus;
  const isExpiringSoon = timeRemaining && timeRemaining.days === 0 && timeRemaining.hours < 24;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600/95 via-violet-600/95 to-purple-600/95 backdrop-blur-lg shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Status Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="font-medium text-white">Guest Mode</span>
            </div>

            {/* Time Remaining */}
            {timeRemaining && (
              <div className="hidden sm:flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {timeRemaining.days > 0
                    ? `${timeRemaining.days}d ${timeRemaining.hours}h remaining`
                    : `${timeRemaining.hours}h remaining`}
                </span>
              </div>
            )}

            {/* Expiring Soon Warning */}
            {isExpiringSoon && (
              <div className="flex items-center gap-2 bg-orange-500/30 px-2 py-1 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-300" />
                <span className="text-xs text-orange-100 font-medium">
                  Save soon!
                </span>
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Export Button (Mobile Hidden) */}
            <Button
              onClick={handleExportData}
              disabled={exporting}
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-white hover:bg-white/20 border-white/30"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>

            {/* Save Progress Button */}
            <Button
              onClick={handleSaveProgress}
              size="sm"
              className="bg-white text-indigo-600 hover:bg-white/90 font-medium"
            >
              Save Progress
            </Button>

            {/* Close Button */}
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Time Remaining (Below Banner) */}
        {timeRemaining && (
          <div className="sm:hidden px-4 pb-2 text-center text-white/80 text-xs">
            <Clock className="w-3 h-3 inline mr-1" />
            {timeRemaining.days > 0
              ? `${timeRemaining.days} days ${timeRemaining.hours} hours remaining`
              : `${timeRemaining.hours} hours remaining`}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
