import { useNavigate } from 'react-router';
import { Check, X, ChevronDown, Shield, Zap, MessageCircle, Play, ArrowRight, Clock, Lock, Headphones, TrendingUp, Users, Target, Calendar, Bot, Sparkles, PhoneOff, Mic } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';


import { CountUp } from '../AnimatedSection';
import { SmoothScrollProvider } from '../scroll/SmoothScrollProvider';
import { ScrollSection } from '../scroll/ScrollSection';
import { SectionIndicator } from '../scroll/SectionIndicator';
import {
  textSplitReveal,
  cardCascade,
  splitScreen,
  blurToSharp,
  cardElevate,
  timelineProgress,
  waveGrid,
  staggerAlternate,
  convergenceZoom,
} from '../scroll/animations';
import { MagneticButton } from '../MagneticButton';
import { BetaSignupModal } from '../BetaSignupModal';
import { useNexusVoiceCall } from '../../contexts/NexusVoiceCallContext';
import { useParticleTransition } from '../ParticleTransition';

const BentoGrid = lazy(() => import('../BentoGrid').then(m => ({ default: m.BentoGrid })));
const InteractiveDemo = lazy(() => import('../InteractiveDemo').then(m => ({ default: m.InteractiveDemo })));
const InteractiveComparison = lazy(() => import('../InteractiveComparison').then(m => ({ default: m.InteractiveComparison })));
const AdminLoginModal = lazy(() => import('../admin/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));
const AdminEmailDashboard = lazy(() => import('../admin/AdminEmailDashboardV2').then(m => ({ default: m.AdminEmailDashboard })));
import { getBetaCount } from '../../utils/betaApi';
import { PLANS as PRICING_PLANS } from '../../config/pricing';
import imgDashboardPreview from "figma:asset/10a3b698cc11b04c569092c39ce52acabd7f851f.png";
import imgImageSyncScript from "figma:asset/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png";
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";

/**
 * SyncScript Landing Page - 2025+ Optimized
 * 
 * Restructured with:
 * - Optimal section flow for conversion
 * - 2025 navigation patterns
 * - Benefit-focused copy
 * - Scroll-triggered animations
 * - Mobile-first design
 * - Performance optimizations
 * - Trust & credibility signals
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { navigateWithParticles } = useParticleTransition();
  const [email, setEmail] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [betaSignups, setBetaSignups] = useState(127); // Default count
  
  const nexusVoice = useNexusVoiceCall();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Admin state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  
  // Check if already authenticated on mount
  useEffect(() => {
    const authenticated = sessionStorage.getItem('admin_authenticated') === 'true';
    if (authenticated) {
      setIsAdminAuthenticated(true);
    }
  }, []);
  
  // Keyboard shortcut: Ctrl+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminLogin(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Triple-click logo to show admin login
  const handleLogoClick = () => {
    const now = Date.now();
    
    // Reset if more than 1 second between clicks
    if (now - lastClickTime > 1000) {
      setLogoClickCount(1);
    } else {
      const newCount = logoClickCount + 1;
      setLogoClickCount(newCount);
      
      if (newCount === 3) {
        setShowAdminLogin(true);
        setLogoClickCount(0);
      }
    }
    
    setLastClickTime(now);
  };
  
  // Fetch beta signup count
  useEffect(() => {
    async function fetchBetaCount() {
      try {
        const count = await getBetaCount();
        setBetaSignups(count);
      } catch (error) {
        console.warn('Could not fetch beta count:', error);
        // Keep the default value (127) if fetch fails
      }
    }
    fetchBetaCount();
  }, []);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current && nexusVoice.isCallActive) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [nexusVoice.messages, nexusVoice.interimText, nexusVoice.isCallActive]);
  
  // Try Demo state
  
  // ROI Calculator state
  const [tasksPerDay, setTasksPerDay] = useState(20);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  const heroInView = useInView(heroRef, { once: false, amount: 0.2 });
  const statsInView = useInView(statsRef, { once: true, margin: '-60px' });
  const pricingInView = useInView(pricingRef, { once: true, margin: '-60px' });
  
  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition });
    }
    setShowMobileMenu(false);
  };

  // Show floating CTA after scrolling
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 800);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Signal demo modal state to the global FloatingFeedbackButton
  useEffect(() => {
    const el = document.documentElement;
    if (showDemoModal) {
      el.dataset.demoModal = demoStep >= 3 ? 'last' : 'open';
    } else {
      delete el.dataset.demoModal;
    }
    return () => { delete el.dataset.demoModal; };
  }, [showDemoModal, demoStep]);

  // Signal floating CTA state so the feedback button can shift up
  useEffect(() => {
    const el = document.documentElement;
    if (showFloatingCTA) {
      el.dataset.floatingCta = 'visible';
    } else {
      delete el.dataset.floatingCta;
    }
    return () => { delete el.dataset.floatingCta; };
  }, [showFloatingCTA]);

  // Calculate ROI
  const timesSavedPerWeek = Math.round((tasksPerDay * 0.2 * 5 * hoursPerDay) / 60); // 20% efficiency gain
  const moneySavedPerMonth = Math.round(timesSavedPerWeek * 4 * 50); // $50/hour rate

  const faqData = [
    {
      question: "How does SyncScript work with my energy levels?",
      answer: "SyncScript uses circadian rhythm science and cognitive load theory to analyze when you're most focused. It automatically schedules complex tasks during your peak hours and lighter tasks when your energy dips."
    },
    {
      question: "Can I try SyncScript for free?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required. Experience the difference before committing."
    },
    {
      question: "How long does setup take?",
      answer: "Most users are fully set up in under 90 seconds. Just connect your calendar, and our AI starts learning your patterns immediately."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption (AES-256), all data is encrypted at rest and in transit, and we never sell your data. Your productivity insights stay private."
    },
    {
      question: "What integrations do you support?",
      answer: "SyncScript syncs with Google Calendar and Outlook today. Slack, Notion, Asana, Linear, and more are on our public roadmap — new integrations ship regularly during beta."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel with one click. No questions asked, no hidden fees. You'll keep access until the end of your billing period."
    }
  ];

  return (
    <SmoothScrollProvider>
    <div
      data-marketing-root
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white overflow-x-hidden"
      style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        ['--marketing-top-offset' as any]: '52px',
      }}
    >
      <SectionIndicator />
      {/* Beta Testing Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-white/90 text-center sm:text-left">
              <span className="font-semibold">🧪 Beta Testing Open</span>
              <span className="hidden md:inline"> - Help build SyncScript → Get FREE access + lifetime 50% off</span>
              <span className="md:hidden"> - FREE access for testers</span>
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBetaModal(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-1.5 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Become a Beta Tester
              </button>
              <button
                onClick={() => window.location.href = '/login?guest=true'}
                className="hidden sm:inline-block text-white/80 hover:text-white transition-colors font-medium"
              >
                Try as Guest →
              </button>
              <span className="text-white/60 text-xs hidden lg:inline">
                Open Beta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Header - 2025 Standard */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-[48px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Triple-click for admin access */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0 })}>
              <div 
                className="relative shrink-0 w-8 sm:w-10 h-8 sm:h-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogoClick();
                }}
              >
                <img 
                  alt="SyncScript Logo" 
                  className="absolute inset-0 w-full h-full object-contain" 
                  src={imgImageSyncScriptLogo} 
                />
              </div>
              <div className="relative shrink-0 h-[24px] sm:h-[32px] w-[114px] sm:w-[152px]">
                <img 
                  alt="SyncScript" 
                  className="absolute inset-0 w-full h-full object-contain object-left" 
                  src={imgImageSyncScript} 
                />
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              <button 
                onClick={() => navigateWithParticles('/features')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => navigateWithParticles('/pricing')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => navigateWithParticles('/faq')}
                className="text-white/80 hover:text-white transition-colors"
              >
                FAQ
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.location.href = '/login'}
                className="hidden sm:inline-block text-white/80 hover:text-white transition-colors text-sm"
              >
                Sign In
              </button>
              <MagneticButton
                onClick={() => window.location.href = '/signup'}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/30 text-sm sm:text-base"
                strength={0.2}
              >
                <span className="hidden sm:inline">Start Free Trial</span>
                <span className="sm:hidden">Try Free</span>
              </MagneticButton>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu - Improved */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="py-4 space-y-2 border-t border-white/10 mt-4">
                  <button 
                    onClick={() => {
                      navigateWithParticles('/features');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => {
                      navigateWithParticles('/pricing');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => {
                      navigateWithParticles('/faq');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    FAQ
                  </button>
                  <button 
                    onClick={() => {
                      window.location.href = '/login';
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white hover:text-white bg-gradient-to-r from-cyan-500/10 to-teal-500/10 hover:from-cyan-500/20 hover:to-teal-500/20 border border-cyan-500/30 transition-all py-3 px-4 rounded-lg font-medium mt-4"
                  >
                    Sign In
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Floating CTA Bar - Appears after scroll */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-600 to-teal-600 shadow-2xl border-t border-cyan-400/30"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
              <p className="text-white font-medium text-xs sm:text-sm md:text-base truncate">
                Ready to work smarter, not harder?
              </p>
              <MagneticButton
                onClick={() => window.location.href = '/signup'}
                className="bg-white text-cyan-600 hover:bg-cyan-50 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:scale-105 shadow-lg text-sm sm:text-base whitespace-nowrap"
                strength={0.2}
              >
                Start Free →
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero — cinematic opening scene */}
      <ScrollSection id="hero">
      <section ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 lg:pb-32 relative">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <motion.div
            className="absolute top-0 left-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
              filter: 'blur(80px)'
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)',
              filter: 'blur(80px)'
            }}
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 5
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-12 sm:mb-16 lg:mb-20">
            {/* Trust Badge Above Headline */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-medium text-xs sm:text-sm">AI-Powered Energy Scheduling — Now in Open Beta</span>
            </motion.div>

            {/* Hero Headline - Benefit-Focused */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] mb-5 sm:mb-6 tracking-[-0.02em] px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Stop Fighting Your Energy.
              <br />
              <motion.span 
                className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent inline-block"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              >
                Let AI Schedule Around It
              </motion.span>
            </motion.h1>

            {/* Subheadline - Outcome Focused */}
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/70 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto px-4 font-light tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Finish <span className="text-cyan-400 font-semibold">more in less time</span> by matching work to your natural rhythms. Not your willpower.
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div 
              className="flex flex-col items-center gap-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                <MagneticButton
                  onClick={() => setShowBetaModal(true)}
                  className="group bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-medium transition-all shadow-2xl shadow-indigo-500/30 inline-flex items-center justify-center gap-3 w-full sm:w-auto text-base sm:text-lg"
                  strength={0.4}
                >
                  <Sparkles className="w-5 h-5" />
                  Join Beta Testing - FREE
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                
                <MagneticButton
                  onClick={() => setShowDemoModal(true)}
                  className="group border-2 border-white/30 hover:border-cyan-400 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-medium transition-all inline-flex items-center justify-center gap-3 w-full sm:w-auto text-base sm:text-lg"
                  strength={0.4}
                >
                  <Play className="w-5 h-5" />
                  Watch 2-Min Demo
                </MagneticButton>
              </div>
              
              <button
                onClick={() => window.location.href = '/login?guest=true'}
                className="text-white/60 hover:text-white transition-colors text-sm sm:text-base font-medium group inline-flex items-center gap-2 mt-1"
              >
                or Try as Guest
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Trust Signals Below CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/60 px-4"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Setup in 90 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Bank-level security</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Image/Video - Dashboard Preview with Hotspots */}
          <motion.div
            id="dashboard-preview"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              {/* Dashboard Preview Image */}
              <img 
                src={imgDashboardPreview} 
                alt="SyncScript Dashboard" 
                className="w-full h-auto"
                loading="lazy"
              />
              
              {/* Interactive Hotspots */}
              <div className="absolute inset-0">
                {/* Hotspot 1: AI Section */}
                <button
                  onMouseEnter={() => setActiveHotspot(0)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  className="absolute top-[15%] left-[15%] w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/20 hover:bg-cyan-500/40 border-2 border-cyan-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                  {activeHotspot === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-2 bg-gray-900/95 border border-cyan-500/30 rounded-lg p-4 w-48 sm:w-64 shadow-2xl z-10"
                    >
                      <h4 className="font-semibold text-cyan-400 mb-1 text-sm sm:text-base">AI Focus Tools</h4>
                      <p className="text-xs sm:text-sm text-white/80">Smart task suggestions based on your energy</p>
                    </motion.div>
                  )}
                </button>

                {/* Hotspot 2: Energy Tracking */}
                <button
                  onMouseEnter={() => setActiveHotspot(1)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  className="absolute top-[40%] left-[35%] w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 hover:bg-emerald-500/40 border-2 border-emerald-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  {activeHotspot === 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 mt-2 bg-gray-900/95 border border-emerald-500/30 rounded-lg p-4 w-48 sm:w-64 shadow-2xl z-10"
                    >
                      <h4 className="font-semibold text-emerald-400 mb-1 text-sm sm:text-base">Today's Schedule</h4>
                      <p className="text-xs sm:text-sm text-white/80">Optimized by AI for peak productivity</p>
                    </motion.div>
                  )}
                </button>

                {/* Hotspot 3: Analytics */}
                <button
                  onMouseEnter={() => setActiveHotspot(2)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  className="absolute top-[30%] right-[10%] w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 hover:bg-orange-500/40 border-2 border-orange-400 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                  {activeHotspot === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full right-0 mt-2 bg-gray-900/95 border border-orange-500/30 rounded-lg p-4 w-48 sm:w-64 shadow-2xl z-10"
                    >
                      <h4 className="font-semibold text-orange-400 mb-1 text-sm sm:text-base">AI Insights</h4>
                      <p className="text-xs sm:text-sm text-white/80">Real-time productivity analytics</p>
                    </motion.div>
                  )}
                </button>
              </div>
            </div>

            {/* Feature Callouts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="absolute -left-4 sm:-left-8 top-[20%] bg-gray-900/90 border border-cyan-500/30 rounded-lg p-3 sm:p-4 shadow-2xl backdrop-blur-md max-w-[160px] sm:max-w-[200px] hidden md:block"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs sm:text-sm text-white/80">Energy-Aware</span>
              </div>
              <p className="text-xs text-white/60">Tasks auto-schedule to your peak hours</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="absolute -right-4 sm:-right-8 top-[60%] bg-gray-900/90 border border-indigo-500/30 rounded-lg p-3 sm:p-4 shadow-2xl backdrop-blur-md max-w-[160px] sm:max-w-[200px] hidden md:block"
            >
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-indigo-400 font-medium">Voice Calls</span>
              </div>
              <p className="text-xs text-white/60">Talk to Nexus AI to manage your schedule</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* The Problem */}
      <ScrollSection id="problem" animation={cardCascade}>
      <section ref={statsRef} className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">The Problem with &ldquo;Productivity&rdquo;</h2>
              <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto font-light">
                Generic to-do apps ignore your biology. SyncScript works with it.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12">
              <div className="text-center bg-white/[0.03] border border-white/10 rounded-xl py-4 px-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-1">
                  {statsInView && <CountUp end={90} duration={2} />}s
                </div>
                <p className="text-xs sm:text-sm text-white/60">Setup Time</p>
              </div>
              <div className="text-center bg-white/[0.03] border border-white/10 rounded-xl py-4 px-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
                  {statsInView && <CountUp end={14} duration={2} />}
                </div>
                <p className="text-xs sm:text-sm text-white/60">Days Free Trial</p>
              </div>
              <div className="text-center bg-white/[0.03] border border-white/10 rounded-xl py-4 px-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {statsInView && <CountUp end={24} duration={2} />}/7
                </div>
                <p className="text-xs sm:text-sm text-white/60">AI Scheduling</p>
              </div>
              <div className="text-center bg-white/[0.03] border border-white/10 rounded-xl py-4 px-3">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                  {statsInView && <CountUp end={0} duration={2} />}
                </div>
                <p className="text-xs sm:text-sm text-white/60">Credit Card Required</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Panel 1: The Problem */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="bg-red-900/10 border border-red-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">The Old Way</h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>Burnout from forcing work when drained</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>Tasks scattered across 5 different apps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>No idea when you're actually productive</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Panel 2: The Solution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-cyan-900/10 border-2 border-cyan-500/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden transform md:scale-105 shadow-2xl shadow-cyan-500/20"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">The SyncScript Way</h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/70">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>AI schedules tasks during your peak energy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>All tools unified in one intelligent dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>Learn your patterns and optimize automatically</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Panel 3: The Result */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-emerald-900/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">The Goal</h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">More deep work</strong> during peak hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">Hours reclaimed</strong> from smart scheduling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">Less burnout</strong> from energy-aware pacing</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Call Nexus */}
      <ScrollSection id="nexus" animation={splitScreen}>
      <section id="voice-calling" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              {/* Left - Copy */}
              <div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
                    <Headphones className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-400 font-medium text-xs sm:text-sm">Voice-First AI</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 tracking-[-0.02em]">
                    Call Nexus.
                    <br />
                    <span className="text-indigo-300">
                      Manage Your Day by Voice.
                    </span>
                  </h2>
                  <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed font-light">
                    Nexus is your AI scheduling assistant you can actually talk to. Get morning briefings, 
                    reschedule tasks, and plan your week — all through a natural voice conversation, 
                    no screen required.
                  </p>
                  <div className="space-y-4 mb-8">
                    {[
                      { icon: <Zap className="w-5 h-5" />, title: 'Morning Briefings', desc: 'Nexus calls you with a personalized rundown of your day, energy forecast, and top priorities.' },
                      { icon: <Calendar className="w-5 h-5" />, title: 'Voice Scheduling', desc: 'Say "Move my 2pm meeting to Thursday" and it happens. Natural language, zero friction.' },
                      { icon: <Bot className="w-5 h-5" />, title: 'Contextual Intelligence', desc: 'Nexus remembers your patterns, preferences, and past conversations — every call gets smarter.' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                          <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {nexusVoice.isCallActive ? (
                    <MagneticButton
                      onClick={nexusVoice.endCall}
                      className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg shadow-red-500/20 inline-flex items-center gap-3"
                      strength={0.3}
                    >
                      <PhoneOff className="w-5 h-5" />
                      End Voice Chat
                    </MagneticButton>
                  ) : (
                    <MagneticButton
                      onClick={nexusVoice.startCall}
                      className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 inline-flex items-center gap-3"
                      strength={0.3}
                    >
                      <Headphones className="w-5 h-5" />
                      Try Voice Calling
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </MagneticButton>
                  )}
                </div>
              </div>

              {/* Right - Live Call Panel / Static Mockup */}
              <div className="relative">
                <div className={`rounded-2xl p-6 sm:p-8 relative overflow-hidden border transition-all duration-500 ${
                  nexusVoice.isCallActive
                    ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/30'
                }`}>
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
                    nexusVoice.isCallActive ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
                  }`} />
                  <div className="relative z-10">
                    {/* Call Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                          nexusVoice.isCallActive
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                        }`}>
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">Nexus AI</h4>
                          <div className="flex items-center gap-1.5">
                            {nexusVoice.isCallActive ? (
                              <>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-xs text-emerald-400">
                                  {nexusVoice.isVoiceLoading
                                    ? 'Preparing voice...'
                                    : nexusVoice.isSpeaking
                                      ? 'Speaking'
                                      : nexusVoice.isListening
                                        ? 'Listening'
                                        : 'Connected'}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-xs text-green-400">Connected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-white/40 font-mono tabular-nums">
                        {nexusVoice.isCallActive
                          ? `${Math.floor(nexusVoice.callDuration / 60)}:${(nexusVoice.callDuration % 60).toString().padStart(2, '0')}`
                          : '2:47'
                        }
                      </span>
                    </div>

                    {/* Conversation Transcript — strictly fixed height, never grows */}
                    <div
                      ref={chatScrollRef}
                      className="space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1"
                      style={{ height: '240px', minHeight: '240px', maxHeight: '240px', scrollBehavior: 'smooth' }}
                    >
                      {nexusVoice.isCallActive ? (
                        <>
                          {(() => {
                            const latestNexusId =
                              [...nexusVoice.messages]
                                .reverse()
                                .find((m) => m.role === 'nexus')?.id ?? null;

                            return nexusVoice.messages.map((msg) => {
                              const hideUntilVoiceStarts =
                                msg.role === 'nexus' &&
                                nexusVoice.isVoiceLoading &&
                                msg.id === latestNexusId;

                              if (hideUntilVoiceStarts) return null;

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-white/90'
                                      : 'bg-white/5 border border-white/10 text-white/80'
                                  }`}>
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                          {nexusVoice.interimText && (
                            <div className="flex justify-end">
                              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-emerald-500/10 border border-emerald-500/20 text-white/50 italic">
                                {nexusVoice.interimText}...
                              </div>
                            </div>
                          )}
                          {nexusVoice.isVoiceLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white/5 border border-emerald-500/25 rounded-2xl px-4 py-3 min-w-[190px]">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 bg-emerald-400/90 rounded-full animate-pulse" />
                                  <span className="text-xs text-emerald-300/90">Nexus is connecting voice...</span>
                                </div>
                                <div className="mt-2 h-1.5 rounded-full bg-emerald-500/10 overflow-hidden">
                                  <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500/40 to-teal-400/40 animate-[pulse_1s_ease-in-out_infinite]" />
                                </div>
                              </div>
                            </div>
                          )}
                          {nexusVoice.isProcessing && !nexusVoice.isVoiceLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // Static mockup when not in a call
                        [{
                          speaker: 'nexus',
                          text: "Good morning! I see you have 6 tasks today. Your peak focus window is 9-11am — I've moved your deep work there.",
                        }, {
                          speaker: 'user',
                          text: "Can you push my 2pm meeting to Thursday?",
                        }, {
                          speaker: 'nexus',
                          text: "Done. I've rescheduled your 2pm with the design team to Thursday at the same time. I also freed up a 45-minute focus block in its place.",
                        }].map((msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + i * 0.2 }}
                            className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                              msg.speaker === 'user'
                                ? 'bg-indigo-500/20 border border-indigo-500/30 text-white/90'
                                : 'bg-white/5 border border-white/10 text-white/80'
                            }`}>
                              {msg.text}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Suggestion chips — outside scroll container so they don't affect its height */}
                    {nexusVoice.isCallActive && nexusVoice.callStatus === 'active' && !nexusVoice.isProcessing && nexusVoice.messages.filter(m => m.role === 'user').length < 2 && (
                      <div className="flex flex-wrap gap-2 py-2">
                        {['How does AI scheduling work?', "What's the pricing?", 'How is this different from Notion?'].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => nexusVoice.sendTextMessage(chip)}
                            className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 rounded-full px-3 py-1.5 transition-all hover:scale-[1.03] active:scale-95"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Waveform Visualization */}
                    <div className="flex items-center gap-1 justify-center h-10">
                      {nexusVoice.isCallActive ? (
                        // Live waveform — responsive to speaking/listening state
                        <>
                          {nexusVoice.isListening && (
                            <div className="flex items-center gap-2 mr-3">
                              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Listening</span>
                            </div>
                          )}
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full transition-all ${
                                nexusVoice.isCallActive
                                  ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                                  : 'bg-gradient-to-t from-indigo-500 to-purple-400'
                              }`}
                              style={{
                                height: (nexusVoice.isSpeaking || nexusVoice.isListening)
                                  ? `${Math.random() * 28 + 6}px`
                                  : '4px',
                                animation: (nexusVoice.isSpeaking || nexusVoice.isListening)
                                  ? `nexusWave 0.8s ease-in-out ${i * 0.04}s infinite alternate`
                                  : 'none',
                                transition: 'height 0.3s ease',
                              }}
                            />
                          ))}
                        </>
                      ) : (
                        // Static animated waveform for mockup
                        Array.from({ length: 24 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full"
                            animate={{
                              height: [4, Math.random() * 28 + 6, 4],
                            }}
                            transition={{
                              duration: 0.8 + Math.random() * 0.6,
                              repeat: Infinity,
                              delay: i * 0.04,
                              ease: 'easeInOut',
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Built on Real Science */}
      <ScrollSection id="science" animation={blurToSharp}>
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">Built on Real Science</h2>
              <p className="text-lg sm:text-xl text-white/60 font-light max-w-3xl mx-auto">
                SyncScript is grounded in decades of peer-reviewed research on human performance and cognitive rhythms.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  title: 'Circadian Rhythm Science',
                  citation: 'Nobel Prize in Physiology, 2017',
                  desc: 'Jeffrey Hall, Michael Rosbash, and Michael Young won the Nobel Prize for discovering molecular mechanisms controlling circadian rhythm. SyncScript uses this research to align your tasks with your biological clock.',
                  gradient: 'from-cyan-500 to-teal-500',
                  borderColor: 'border-cyan-500/30',
                },
                {
                  title: 'Ultradian Cycles',
                  citation: 'Peretz Lavie, Technion Institute',
                  desc: 'Research shows the brain operates in 90-minute focus cycles (BRAC — Basic Rest-Activity Cycle). SyncScript structures your work blocks around these natural peaks and troughs.',
                  gradient: 'from-emerald-500 to-teal-500',
                  borderColor: 'border-emerald-500/30',
                },
                {
                  title: 'Decision Fatigue',
                  citation: 'Danziger et al., PNAS 2011',
                  desc: 'Studies show decision quality degrades predictably throughout the day. SyncScript front-loads high-stakes decisions to your sharpest hours and automates the rest.',
                  gradient: 'from-purple-500 to-indigo-500',
                  borderColor: 'border-purple-500/30',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`bg-white/[0.03] backdrop-blur-sm border ${item.borderColor} rounded-2xl p-6 sm:p-8 hover:bg-white/[0.06] transition-all`}
                >
                  <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent text-xs font-semibold uppercase tracking-wider mb-4`}>
                    <Sparkles className="w-3.5 h-3.5 text-current" style={{ opacity: 0.7 }} />
                    Research-Backed
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/40 mb-4 italic">{item.citation}</p>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Simple, Transparent Pricing */}
      <ScrollSection id="pricing" animation={cardElevate}>
      <section ref={pricingRef} id="pricing-anchor" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-semibold mb-3 tracking-[-0.02em]">Simple, Transparent Pricing</h2>
              <p className="text-sm sm:text-base text-white/60 font-light">Start free. Upgrade when you're ready. Cancel anytime.</p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
              {PRICING_PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`backdrop-blur-sm rounded-2xl p-4 sm:p-5 relative ${
                    plan.popular
                      ? 'bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-2 border-cyan-500 transform md:scale-[1.03] shadow-2xl shadow-cyan-500/20'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="text-2xl sm:text-3xl font-bold mb-0.5">
                    {plan.price === 0 ? '$0' : `$${plan.price}`}
                    <span className="text-sm text-white/50 font-normal">/{plan.price === 0 ? 'forever' : 'mo'}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mb-3">{plan.subtitle}</p>
                  <ul className="space-y-1.5 mb-4 text-xs">
                    {plan.features.filter(f => f.included).slice(0, 4).map((f) => (
                      <li key={f.text} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(plan.ctaAction === 'contact' ? '/contact' : '/signup')}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-xs ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Compact ROI Calculator */}
            <div className="bg-gradient-to-r from-teal-900/20 to-emerald-900/20 border border-teal-500/30 rounded-xl p-4 sm:p-5 max-w-5xl mx-auto mb-6">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <h3 className="text-sm font-semibold text-white/90 whitespace-nowrap shrink-0">Calculate Your Savings</h3>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-white/60 whitespace-nowrap">Tasks/day: <span className="text-teal-400 font-bold">{tasksPerDay}</span></span>
                  <input
                    type="range" min="5" max="50" value={tasksPerDay}
                    onChange={(e) => setTasksPerDay(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 min-w-[80px]"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-white/60 whitespace-nowrap">Hours/day: <span className="text-teal-400 font-bold">{hoursPerDay}</span></span>
                  <input
                    type="range" min="4" max="12" value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500 min-w-[80px]"
                  />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-bold text-teal-400">{timesSavedPerWeek}h</p>
                    <p className="text-[10px] text-white/50">saved/week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-400">${moneySavedPerMonth.toLocaleString()}</p>
                    <p className="text-[10px] text-white/50">value/month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>Email & Discord support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* How It Works */}
      <ScrollSection id="how-it-works" animation={timelineProgress}>
      <section id="features" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">How It Works</h2>
              <p className="text-lg sm:text-xl text-white/60 font-light">Get started in 3 simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              {/* Step 1 */}
              <div className="text-center relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-6 shadow-lg shadow-cyan-500/30">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Connect Your Calendar</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  Link Google Calendar, Outlook, or any calendar. Takes <strong>10 seconds</strong>.
                </p>
                <div className="absolute -right-4 top-8 hidden md:block">
                  <ArrowRight className="w-8 h-8 text-cyan-500/30" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-6 shadow-lg shadow-teal-500/30">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">AI Learns Your Patterns</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  Our AI observes when you're most focused. Full insights in <strong>2 days</strong>.
                </p>
                <div className="absolute -right-4 top-8 hidden md:block">
                  <ArrowRight className="w-8 h-8 text-teal-500/30" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Get Auto-Optimized Schedule</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  Tasks auto-schedule to your <strong>peak energy hours</strong>. Zero effort.
                </p>
              </div>
            </div>

        </div>
      </section>

      {/* Explore Features — mini-hero CTA between steps and marquee */}
      <section className="py-12 sm:py-16">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Ready to dive deeper?</p>
          <button
            onClick={() => navigateWithParticles('/features')}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/20 hover:border-cyan-400/50 hover:bg-white/10 text-white px-8 py-3.5 rounded-xl font-medium transition-all text-sm"
          >
            Explore All Features
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Integration Marquee — Infinite Scroll */}
      <section className="pt-2 sm:pt-4 pb-12 sm:pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-white/40 mb-8 tracking-wide uppercase font-medium">Calendar sync live — more integrations shipping regularly</p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <div
            className="flex gap-10 items-center whitespace-nowrap animate-marquee-infinite"
          >
            {[...Array(4)].map((_, setIndex) => (
              <div key={setIndex} className="flex gap-10 items-center shrink-0">
                {[
                  { name: 'Google Calendar', icon: <Calendar className="w-5 h-5" /> },
                  { name: 'Slack', icon: <MessageCircle className="w-5 h-5" /> },
                  { name: 'Notion', icon: <Target className="w-5 h-5" /> },
                  { name: 'Asana', icon: <Check className="w-5 h-5" /> },
                  { name: 'Trello', icon: <Target className="w-5 h-5" /> },
                  { name: 'Outlook', icon: <Calendar className="w-5 h-5" /> },
                  { name: 'Jira', icon: <Zap className="w-5 h-5" /> },
                  { name: 'Todoist', icon: <Check className="w-5 h-5" /> },
                  { name: 'Linear', icon: <TrendingUp className="w-5 h-5" /> },
                  { name: 'GitHub', icon: <Bot className="w-5 h-5" /> },
                  { name: 'Figma', icon: <Sparkles className="w-5 h-5" /> },
                  { name: 'ClickUp', icon: <Target className="w-5 h-5" /> },
                  { name: 'Monday.com', icon: <Calendar className="w-5 h-5" /> },
                  { name: 'Basecamp', icon: <Users className="w-5 h-5" /> },
                  { name: 'Zapier', icon: <Zap className="w-5 h-5" /> },
                  { name: 'Make', icon: <Sparkles className="w-5 h-5" /> },
                ].map((tool) => (
                  <div key={`${setIndex}-${tool.name}`} className="flex items-center gap-2.5 text-white/30 hover:text-white/60 transition-colors shrink-0">
                    {tool.icon}
                    <span className="text-sm font-medium">{tool.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      </ScrollSection>

      <div className="section-divider" />

      {/* A Day With SyncScript */}
      <ScrollSection id="day-timeline" animation={staggerAlternate}>
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">A Day With SyncScript</h2>
              <p className="text-lg sm:text-xl text-white/60 font-light">See how your day transforms when AI works with your energy</p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-teal-500/50 to-emerald-500/50 hidden sm:block" />

              <div className="space-y-8">
                {[
                  { time: '7:00 AM', title: 'Morning Brief', desc: 'AI scans your calendar, energy forecast, and priorities — delivers a tailored plan before coffee.', icon: <Zap className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', energy: 'Rising' },
                  { time: '9:00 AM', title: 'Peak Focus Block', desc: 'Deep work auto-scheduled during your cognitive peak. Notifications silenced. Distractions blocked.', icon: <Target className="w-5 h-5" />, gradient: 'from-cyan-500 to-teal-500', energy: 'Peak' },
                  { time: '12:00 PM', title: 'Smart Break', desc: 'AI detects your focus fading and suggests a break. Lighter tasks queue up for post-lunch.', icon: <Clock className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', energy: 'Dip' },
                  { time: '2:00 PM', title: 'Collaborative Window', desc: 'Meetings and team tasks scheduled when your social energy peaks. No more drained afternoons.', icon: <Users className="w-5 h-5" />, gradient: 'from-purple-500 to-indigo-500', energy: 'Moderate' },
                  { time: '4:30 PM', title: 'Wind-Down Wrap', desc: 'Quick wins and admin tasks. Tomorrow\'s plan is already drafted by AI. Leave on time, guilt-free.', icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-teal-500 to-cyan-500', energy: 'Winding Down' },
                ].map((item, i) => (
                  <motion.div
                    key={item.time}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex gap-4 sm:gap-6 items-start relative"
                  >
                    {/* Timeline dot */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 shadow-lg relative z-10`}>
                      {item.icon}
                    </div>

                    <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-white/10 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                        <h4 className="font-semibold text-base sm:text-lg">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40 font-mono">{item.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent font-medium border border-white/10`}>
                            {item.energy}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* See It In Action */}
      <ScrollSection id="demo" animation={waveGrid}>
      <section className="py-16 sm:py-24 lg:py-28">
        <InteractiveDemo />
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Everything You Need */}
      <ScrollSection id="bento" animation={convergenceZoom}>
      <section className="py-16 sm:py-24 lg:py-28">
        <BentoGrid />
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* See the Difference */}
      <ScrollSection id="comparison" animation={cardElevate}>
      <section className="py-16 sm:py-24 lg:py-28">
        <InteractiveComparison />
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Frequently Asked Questions */}
      <ScrollSection id="faq-section" animation={textSplitReveal}>
      <section id="faq" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">Frequently Asked Questions</h2>
              <p className="text-lg sm:text-xl text-white/60 font-light">Everything you need to know</p>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
                  >
                    <span className="font-semibold text-base sm:text-lg pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-400 transition-transform shrink-0 ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-white/70 text-sm sm:text-base leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => navigateWithParticles('/faq')}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                View all FAQs &rarr;
              </button>
            </div>
        </div>
      </section>
      </ScrollSection>

      <div className="section-divider" />

      {/* Ready to Stop the Burnout — closing scene */}
      <ScrollSection id="cta" animation={convergenceZoom}>
      <section className="py-24 sm:py-32 lg:py-40 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-teal-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 py-14 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-6 tracking-[-0.02em]">
              Ready to Stop the Burnout?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-10 sm:mb-12 font-light">
              Work with your energy, not against it. Start your free beta today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <MagneticButton
                onClick={() => setShowBetaModal(true)}
                className="group bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-500 hover:via-purple-500 hover:to-violet-500 text-white px-10 py-4 rounded-lg text-lg font-medium transition-all shadow-2xl shadow-indigo-500/30 inline-flex items-center justify-center gap-3 w-full sm:w-auto"
                strength={0.4}
              >
                <Sparkles className="w-5 h-5" />
                Join Beta Testing - FREE
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <MagneticButton
                onClick={() => window.location.href = '/login?guest=true'}
                className="group bg-white/5 border border-white/20 hover:border-cyan-400/50 hover:bg-white/10 text-white px-10 py-4 rounded-lg text-lg font-medium transition-all inline-flex items-center justify-center gap-3 w-full sm:w-auto"
                strength={0.4}
              >
                Try Live Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
            </div>
            <p className="mt-6 text-sm text-white/40">
              No credit card required • Setup in 90 seconds • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
            {/* Column 1: Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigateWithParticles('/features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => navigateWithParticles('/pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigateWithParticles('/faq')} className="hover:text-white transition-colors">FAQ</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="hover:text-white transition-colors">Demo</button></li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => navigate('/blog')} className="hover:text-white transition-colors">Blog</button></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/docs')} className="hover:text-white transition-colors">Documentation</button></li>
                <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Help Center</button></li>
                <li><button onClick={() => navigate('/api-reference')} className="hover:text-white transition-colors">API</button></li>
                <li><button onClick={() => navigate('/community')} className="hover:text-white transition-colors">Community</button></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms</button></li>
                <li><button onClick={() => navigate('/security')} className="hover:text-white transition-colors">Security</button></li>
                <li className="pt-2 border-t border-white/10 mt-3">
                  <a 
                    href="mailto:support@syncscript.app" 
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Headphones className="w-4 h-4" />
                    support@syncscript.app
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={imgImageSyncScriptLogo} alt="SyncScript" className="w-8 h-8" loading="lazy" />
              <img src={imgImageSyncScript} alt="SyncScript" className="h-6" loading="lazy" />
            </div>
            <p className="text-sm text-white/50 text-center sm:text-left">
              © 2026 SyncScript. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/SyncScriptApp" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Follow us on X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://discord.gg/2rq38UJrDJ" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors" aria-label="Join our Discord">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Spacer for floating CTA bar */}
        <div className="h-20 sm:h-24" />
      </footer>

      {/* Demo Modal - Interactive Product Walkthrough */}
      <AnimatePresence>
        {showDemoModal && (() => {
          const demoSlides = [
            {
              title: 'Track Your Energy',
              subtitle: 'Know exactly when you perform best',
              icon: <Zap className="w-8 h-8" />,
              color: 'from-cyan-500 to-teal-500',
              shadowColor: 'shadow-cyan-500/30',
              borderColor: 'border-cyan-500/40',
              features: ['Real-time energy level tracking', 'Circadian rhythm analysis', 'Peak performance windows detected'],
              mockup: (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/60">Today's Energy</span>
                    <span className="text-sm font-semibold text-cyan-400">82% Peak</span>
                  </div>
                  {['6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((time, i) => {
                    const heights = [30, 85, 70, 40, 55, 25];
                    const colors = ['bg-cyan-500/40', 'bg-cyan-400', 'bg-teal-400', 'bg-amber-400/60', 'bg-teal-400/70', 'bg-cyan-500/30'];
                    return (
                      <div key={time} className="flex items-end gap-2">
                        <span className="text-xs text-white/40 w-10 shrink-0">{time}</span>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${heights[i]}%` }}
                          transition={{ duration: 0.8, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
                          className={`h-6 rounded-md ${colors[i]}`}
                        />
                        {i === 1 && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-xs text-cyan-400 font-medium ml-1 whitespace-nowrap"
                          >
                            Peak Focus
                          </motion.span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ),
            },
            {
              title: 'AI-Powered Scheduling',
              subtitle: 'Tasks auto-schedule to your peak hours',
              icon: <Bot className="w-8 h-8" />,
              color: 'from-purple-500 to-indigo-500',
              shadowColor: 'shadow-purple-500/30',
              borderColor: 'border-purple-500/40',
              features: ['Smart task prioritization', 'Automatic calendar optimization', 'Conflict resolution AI'],
              mockup: (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">AI Suggestion</span>
                  </div>
                  {[
                    { task: 'Code Review — API Auth', time: '9:00 AM', energy: 'High', color: 'border-purple-500/50', badge: 'bg-purple-500/20 text-purple-300' },
                    { task: 'Design System Update', time: '10:30 AM', energy: 'High', color: 'border-indigo-500/50', badge: 'bg-indigo-500/20 text-indigo-300' },
                    { task: 'Team Standup', time: '2:00 PM', energy: 'Med', color: 'border-amber-500/50', badge: 'bg-amber-500/20 text-amber-300' },
                    { task: 'Reply to Emails', time: '4:00 PM', energy: 'Low', color: 'border-teal-500/50', badge: 'bg-teal-500/20 text-teal-300' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.task}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className={`flex items-center justify-between bg-white/5 border ${item.color} rounded-lg p-3`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-current shrink-0" style={{ color: item.color.includes('purple') ? '#a855f7' : item.color.includes('indigo') ? '#818cf8' : item.color.includes('amber') ? '#f59e0b' : '#14b8a6' }} />
                        <span className="text-sm text-white/90 truncate">{item.task}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.badge}`}>{item.energy}</span>
                        <span className="text-xs text-white/40">{item.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ),
            },
            {
              title: 'Real-Time Insights',
              subtitle: 'See your productivity trends unfold',
              icon: <TrendingUp className="w-8 h-8" />,
              color: 'from-emerald-500 to-teal-500',
              shadowColor: 'shadow-emerald-500/30',
              borderColor: 'border-emerald-500/40',
              features: ['Weekly productivity reports', 'Energy pattern recognition', 'Burnout early-warning system'],
              mockup: (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Tasks Done', value: '47', change: '+12%', color: 'text-emerald-400' },
                      { label: 'Focus Hours', value: '6.2h', change: '+18%', color: 'text-teal-400' },
                      { label: 'Energy Score', value: '82', change: '+9%', color: 'text-cyan-400' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="bg-white/5 rounded-lg p-3 text-center"
                      >
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-white/50">{stat.label}</p>
                        <p className="text-xs text-emerald-400">{stat.change}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-white/50">Weekly Trend</p>
                      <p className="text-xs text-emerald-400 font-medium">+23% vs last week</p>
                    </div>
                    <div className="flex items-end gap-2" style={{ height: 80 }}>
                      {[
                        { px: 22, label: '4.2h' },
                        { px: 28, label: '5.0h' },
                        { px: 25, label: '4.5h' },
                        { px: 38, label: '6.6h' },
                        { px: 33, label: '5.7h' },
                        { px: 44, label: '7.4h' },
                        { px: 52, label: '8.3h' },
                      ].map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end">
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.08 }}
                            className="text-[8px] text-white/40 leading-none mb-1"
                          >
                            {bar.label}
                          </motion.span>
                          <motion.div
                            initial={{ height: '0px' }}
                            animate={{ height: `${bar.px}px` }}
                            transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ minWidth: '100%' }}
                            className={`rounded-sm ${i === 6 ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gradient-to-t from-emerald-600 to-teal-500'}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <span key={i} className={`flex-1 text-[10px] text-center ${i === 6 ? 'text-emerald-400 font-medium' : 'text-white/30'}`}>{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Team Collaboration',
              subtitle: 'Stay in sync with your entire team',
              icon: <Users className="w-8 h-8" />,
              color: 'from-orange-500 to-pink-500',
              shadowColor: 'shadow-orange-500/30',
              borderColor: 'border-orange-500/40',
              features: ['Shared team dashboards', 'Role-based task assignment', 'Cross-team energy mapping'],
              mockup: (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">Team Overview</span>
                  </div>
                  {[
                    { name: 'Sarah M.', initials: 'SM', role: 'Designer', energy: 92, gradient: 'from-cyan-400 to-teal-400' },
                    { name: 'James C.', initials: 'JC', role: 'Engineer', energy: 74, gradient: 'from-emerald-400 to-teal-400' },
                    { name: 'Aisha P.', initials: 'AP', role: 'PM', energy: 65, gradient: 'from-purple-400 to-pink-400' },
                    { name: 'David K.', initials: 'DK', role: 'Data Lead', energy: 88, gradient: 'from-orange-400 to-pink-400' },
                  ].map((person, i) => (
                    <motion.div
                      key={person.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5"
                    >
                      <div className={`w-8 h-8 bg-gradient-to-br ${person.gradient} rounded-full flex items-center justify-center text-xs font-bold text-gray-900 shrink-0`}>
                        {person.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/90">{person.name}</span>
                          <span className="text-xs text-white/40">{person.role}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${person.energy}%` }}
                              transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                              className={`h-full bg-gradient-to-r ${person.gradient} rounded-full`}
                            />
                          </div>
                          <span className="text-xs text-white/50">{person.energy}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ),
            },
          ];

          const slide = demoSlides[demoStep];

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => { setShowDemoModal(false); setDemoStep(0); }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="max-w-5xl w-full relative max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ambient glow — outside the scroll container so it's never clipped */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0 hidden sm:block transition-all duration-700"
                  style={{ background: `radial-gradient(circle, ${
                    [
                      'rgba(6,182,212,0.22)',
                      'rgba(168,85,247,0.22)',
                      'rgba(16,185,129,0.22)',
                      'rgba(249,115,22,0.22)',
                    ][demoStep] || 'rgba(6,182,212,0.22)'
                  } 0%, transparent 70%)` }}
                />

                {/* Card with scroll */}
                <div className="bg-gradient-to-b from-gray-900 to-[#0a0e1a] border border-white/10 rounded-2xl w-full relative overflow-y-auto max-h-[90vh]">

                {/* Close button */}
                <button
                  onClick={() => { setShowDemoModal(false); setDemoStep(0); }}
                  className="absolute top-4 right-4 z-20 text-white/40 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Progress bar */}
                <div className="relative z-10 flex gap-1.5 px-4 sm:px-6 pt-4 sm:pt-5">
                  {demoSlides.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDemoStep(i)}
                      className="flex-1 h-1.5 rounded-full transition-all duration-500 overflow-hidden bg-white/10"
                    >
                      <motion.div
                        initial={false}
                        animate={{ width: i <= demoStep ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                        style={{ boxShadow: i <= demoStep ? '0 0 8px rgba(255,255,255,0.15)' : 'none' }}
                      />
                    </button>
                  ))}
                </div>

                {/* Step indicator */}
                <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-3 sm:pt-4 pb-1 sm:pb-2" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  <span className="text-[10px] sm:text-xs text-white/40 font-medium tracking-wide uppercase">Step {demoStep + 1} of {demoSlides.length}</span>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
                    Interactive Demo
                  </div>
                </div>

                {/* Main content area */}
                <div className="relative z-10 grid md:grid-cols-2 gap-0 md:gap-6 p-4 sm:p-6 pt-2">
                  {/* Left: Info */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`info-${demoStep}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col justify-center mb-6 md:mb-0"
                    >
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${slide.color} ${slide.shadowColor} shadow-lg mb-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]`}>
                        {slide.icon}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>{slide.title}</h3>
                      <p className="text-white/60 mb-6 font-light" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{slide.subtitle}</p>
                      <ul className="space-y-3">
                        {slide.features.map((feature, i) => (
                          <motion.li
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.1 }}
                            className="flex items-center gap-3 text-sm text-white/70"
                            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
                          >
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center shrink-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]`}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            {feature}
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>

                  {/* Right: Animated mockup */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`mockup-${demoStep}`}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.97 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className={`bg-gray-900/80 border ${slide.borderColor} rounded-xl p-5 relative overflow-hidden`}
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${slide.color} opacity-5 rounded-full blur-2xl pointer-events-none`} />
                      <div className="relative z-10">
                        {slide.mockup}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="relative z-10 px-4 sm:px-6 pb-5 sm:pb-6 pt-2">
                  {demoStep < demoSlides.length - 1 ? (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
                        disabled={demoStep === 0}
                        className="text-xs sm:text-sm text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
                        Back
                      </button>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => { window.location.href = '/login?guest=true'; setShowDemoModal(false); setDemoStep(0); }}
                          className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium hidden sm:block"
                        >
                          Try Live Dashboard
                        </button>
                        <button
                          onClick={() => setDemoStep(demoStep + 1)}
                          className={`bg-gradient-to-r ${slide.color} text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all hover:scale-105 active:scale-95 shadow-lg ${slide.shadowColor} inline-flex items-center gap-1.5 sm:gap-2`}
                        >
                          Next
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => { setShowBetaModal(true); setShowDemoModal(false); setDemoStep(0); }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 sm:px-10 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        Join Beta - It&apos;s Free
                      </button>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setDemoStep(demoStep - 1)}
                          className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                          Back
                        </button>
                        <button
                          onClick={() => { window.location.href = '/login?guest=true'; setShowDemoModal(false); setDemoStep(0); }}
                          className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                        >
                          Try Live Dashboard →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Beta Signup Modal */}
      <BetaSignupModal 
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />

      {/* Admin Login Modal - Hidden feature */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setShowAdminLogin(false);
        }}
      />

      {/* Admin Dashboard - Full screen overlay */}
      {isAdminAuthenticated && (
        <div className="fixed inset-0 z-[100] bg-gray-900">
          <AdminEmailDashboard
            onLogout={() => {
              sessionStorage.removeItem('admin_authenticated');
              sessionStorage.removeItem('admin_session_start');
              setIsAdminAuthenticated(false);
            }}
          />
        </div>
      )}
    </div>
    </SmoothScrollProvider>
  );
}
