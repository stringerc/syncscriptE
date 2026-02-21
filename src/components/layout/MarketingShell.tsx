import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { lazy, Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Menu, X, ArrowLeft, Headphones } from 'lucide-react';
import { MagneticButton } from '../MagneticButton';
import { FloatingOrbs } from '../FloatingOrbs';
import { SmoothScrollProvider, useSmoothScroll } from '../scroll/SmoothScrollProvider';
import { SectionIndicator } from '../scroll/SectionIndicator';
import imgImageSyncScript from "figma:asset/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png";
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";



const FeaturesPage = lazy(() =>
  import('../pages/FeaturesPage').then((m) => ({ default: m.FeaturesPage })),
);
const PricingPage = lazy(() =>
  import('../pages/PricingPage').then((m) => ({ default: m.PricingPage })),
);
const FAQPage = lazy(() =>
  import('../pages/FAQPage').then((m) => ({ default: m.FAQPage })),
);

const PAGE_ORDER = ['/features', '/pricing', '/faq'] as const;
const TRANSITION_MS = 500;

function getPageIndex(pathname: string): number {
  const idx = PAGE_ORDER.indexOf(pathname as (typeof PAGE_ORDER)[number]);
  return idx >= 0 ? idx : 0;
}

function buildPageElement(pathname: string) {
  switch (pathname) {
    case '/features':
      return <FeaturesPage />;
    case '/pricing':
      return <PricingPage />;
    case '/faq':
      return <FAQPage />;
    default:
      return null;
  }
}


type TransitionPhase = 'idle' | 'exiting' | 'entering';

export function MarketingShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [displayedPath, setDisplayedPath] = useState(location.pathname);
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const directionRef = useRef(1);
  const targetPathRef = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const currentIndex = getPageIndex(location.pathname);
  const displayedIndex = getPageIndex(displayedPath);
  const getTransformForExit = useCallback((dir: number) => {
    const toIdx = getPageIndex(targetPathRef.current);
    const fromIdx = getPageIndex(displayedPath);
    const isFaq = toIdx === 2 || fromIdx === 2;
    if (isFaq) return `translateY(${dir > 0 ? -40 : 40}px) scale(0.98)`;
    return `translateX(${dir > 0 ? -100 : 100}px)`;
  }, [displayedPath]);

  const getTransformForEnter = useCallback((dir: number) => {
    const toIdx = getPageIndex(targetPathRef.current);
    const fromIdx = getPageIndex(displayedPath);
    const isFaq = toIdx === 2 || fromIdx === 2;
    if (isFaq) return `translateY(${dir > 0 ? 40 : -40}px) scale(0.98)`;
    return `translateX(${dir > 0 ? 100 : -100}px)`;
  }, [displayedPath]);

  useEffect(() => {
    if (location.pathname === displayedPath) return;

    const newIndex = getPageIndex(location.pathname);
    const oldIndex = getPageIndex(displayedPath);
    directionRef.current = newIndex >= oldIndex ? 1 : -1;
    targetPathRef.current = location.pathname;

    setPhase('exiting');

    clearTimeout(timerRef.current);
    const target = location.pathname;
    timerRef.current = setTimeout(() => {
      setDisplayedPath(target);
      setPhase('entering');
      window.scrollTo({ top: 0, behavior: 'instant' });

      timerRef.current = setTimeout(() => {
        setPhase('idle');
      }, TRANSITION_MS);
    }, TRANSITION_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const transitionStyle: React.CSSProperties = {
    transition: phase !== 'idle'
      ? `opacity ${TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1), transform ${TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1)`
      : 'none',
    opacity: phase === 'exiting' ? 0 : phase === 'entering' ? 1 : 1,
    transform:
      phase === 'exiting'
        ? getTransformForExit(directionRef.current)
        : phase === 'entering'
          ? 'translateX(0) translateY(0) scale(1)'
          : 'none',
  };

  const initialEnterStyle: React.CSSProperties | undefined =
    phase === 'entering'
      ? { transform: getTransformForEnter(directionRef.current), opacity: 0 }
      : undefined;

  const navLinks = [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <SmoothScrollProvider>
    <div className="min-h-screen bg-[#0a0e1a] text-white font-[system-ui,'Space_Grotesk',sans-serif] overflow-x-hidden relative">
      <FloatingOrbs />
      <SectionIndicator />
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 relative"
            aria-label="Go to homepage"
          >
            <ArrowLeft className="w-4 h-4 text-white/0 group-hover:text-cyan-400 -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -left-5" />
            <div className="relative">
              <img src={imgImageSyncScriptLogo} alt="SyncScript" className="w-8 h-8 relative z-10 group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-full bg-cyan-400/0 group-hover:bg-cyan-400/15 blur-md transition-all duration-300 scale-150" />
            </div>
            <img src={imgImageSyncScript} alt="SyncScript" className="h-5 hidden sm:block group-hover:opacity-80 transition-opacity" />
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <MagneticButton
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
              strength={0.2}
            >
              Start Free
            </MagneticButton>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 overflow-hidden relative z-[60] bg-[#0a0e1a]"
            >
              <div className="px-4 py-4 space-y-2">
                <button
                  onClick={() => {
                    navigate('/');
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 text-left px-4 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </button>
                <div className="h-px bg-white/[0.06] mx-2" />
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === link.path
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Page Content with Cinematic Transitions */}
      <main className="relative z-10 min-h-[calc(100vh-4rem)]">
        <div
          key={displayedPath}
          ref={(el) => {
            if (el && phase === 'entering' && initialEnterStyle) {
              Object.assign(el.style, {
                transform: initialEnterStyle.transform,
                opacity: String(initialEnterStyle.opacity),
                transition: 'none',
              });
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  Object.assign(el.style, {
                    transform: 'translateX(0) translateY(0) scale(1)',
                    opacity: '1',
                    transition: `opacity ${TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1), transform ${TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1)`,
                  });
                });
              });
            }
          }}
          style={phase === 'exiting' ? transitionStyle : undefined}
        >
          <Suspense fallback={<div className="min-h-screen" />}>
            {buildPageElement(displayedPath)}
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black/40 border-t border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <button onClick={() => navigate('/features')} className="hover:text-white transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/faq')} className="hover:text-white transition-colors">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <button onClick={() => navigate('/about')} className="hover:text-white transition-colors">
                    About
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/blog')} className="hover:text-white transition-colors">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/careers')} className="hover:text-white transition-colors">
                    Careers
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">
                    Documentation
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/help')} className="hover:text-white transition-colors">
                    Help Center
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/community')} className="hover:text-white transition-colors">
                    Community
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                    Privacy
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
                    Terms
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/security')} className="hover:text-white transition-colors">
                    Security
                  </button>
                </li>
                <li className="pt-2 border-t border-white/10 mt-3">
                  <a
                    href="mailto:support@syncscript.app"
                    className="hover:text-white transition-colors flex items-center gap-2 min-w-0"
                  >
                    <Headphones className="w-4 h-4 shrink-0" />
                    <span className="truncate">support@syncscript.app</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={imgImageSyncScriptLogo} alt="SyncScript" className="w-8 h-8" />
              <img src={imgImageSyncScript} alt="SyncScript" className="h-6" />
            </div>
            <p className="text-sm text-white/50 text-center sm:text-left">
              &copy; 2026 SyncScript. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/SyncScriptApp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Follow us on X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/2rq38UJrDJ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Join our Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </SmoothScrollProvider>
  );
}
