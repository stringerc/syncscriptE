import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { analytics } from '../utils/analytics';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasDecided = localStorage.getItem('cookies_accepted') !== null;
    
    // Only show banner if no decision has been made
    if (!hasDecided) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    analytics.enable();
    hideBanner();
  };

  const handleReject = () => {
    analytics.disable();
    hideBanner();
  };

  const hideBanner = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
      isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white border-t border-slate-200 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                    <a 
                      href="/privacy" 
                      className="text-purple-600 hover:text-purple-700 font-medium ml-1"
                    >
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
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleReject}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Reject Non-Essential
              </Button>
              <Button
                onClick={handleAccept}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90"
              >
                Accept All Cookies
              </Button>
            </div>
            
            <button
              onClick={hideBanner}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 md:relative md:top-0 md:right-0"
              aria-label="Close cookie banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}