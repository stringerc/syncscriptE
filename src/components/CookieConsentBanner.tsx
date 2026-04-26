import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Cookie, Shield, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { analytics } from '../utils/analytics';

/** Above marketing orbs, floating CTA (z-50), and feedback FAB (z-[9999]). */
const BANNER_Z = 'z-[10050]';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const hasDecided = localStorage.getItem('cookies_accepted') !== null;

    if (!hasDecided) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const hideBanner = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleAccept = () => {
    analytics.enable();
    hideBanner();
  };

  const handleReject = () => {
    analytics.disable();
    hideBanner();
  };

  /** Dismiss without enabling analytics — still record a decision so the bar stays gone. */
  const handleDismiss = () => {
    localStorage.setItem('cookies_accepted', 'false');
    analytics.disable();
    hideBanner();
  };

  if (!isVisible || !mounted) return null;

  const node = (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className={`pointer-events-none fixed bottom-0 left-0 right-0 ${BANNER_Z} transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="pointer-events-auto bg-white border-t border-slate-200 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
        <div className="container relative mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-10 md:pr-0">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    We use cookies to improve your experience
                  </h3>
                  <p className="text-sm text-slate-600">
                    We use cookies for analytics to understand how you use our site and to improve your experience.
                    This helps us build better products. Your data is anonymized and we never share it with third parties.
                    <a href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
                      Learn more in our Privacy Policy
                    </a>
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>GDPR/CCPA Compliant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="w-3 h-3" />
                      <span>Anonymous Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                onClick={handleReject}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Reject Non-Essential
              </Button>
              <Button
                type="button"
                onClick={handleAccept}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90"
              >
                Accept All Cookies
              </Button>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-2 right-2 rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:top-4 md:right-4"
              aria-label="Close cookie banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
