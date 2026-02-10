import { useNavigate } from 'react-router';
import { Check, X, ChevronDown, Shield, Zap, MessageCircle, Play, ArrowRight, Clock, Lock, Headphones, TrendingUp, Users, Target, Calendar, Bot, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { AnimatedSection, StaggerContainer, StaggerItem, CountUp } from '../AnimatedSection';
import { MagneticButton } from '../MagneticButton';
import { BentoGrid } from '../BentoGrid';
import { InteractiveDemo } from '../InteractiveDemo';
import { InteractiveComparison } from '../InteractiveComparison';
import { BetaSignupModal } from '../BetaSignupModal';
import { AdminLoginModal } from '../admin/AdminLoginModal';
import { AdminEmailDashboard } from '../admin/AdminEmailDashboardV2';
import { getBetaCount } from '../../utils/betaApi';
import imgDashboardPreview from "figma:asset/10a3b698cc11b04c569092c39ce52acabd7f851f.png";
import imgImageSyncScript from "figma:asset/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png";
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";
import imgCircuitBrain from "figma:asset/9f574c53e1c264d4351db616e8a79c11f6fef154.png";

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
  const [email, setEmail] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [betaSignups, setBetaSignups] = useState(127); // Default count
  
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
  
  // Try Demo state
  
  // ROI Calculator state
  const [tasksPerDay, setTasksPerDay] = useState(20);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  
  // Parallax scroll hooks
  const { scrollY } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  const heroInView = useInView(heroRef, { once: false, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.3 });
  
  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
      answer: "Absolutely. We use bank-level encryption (AES-256), are SOC 2 Type II certified, and never sell your data. Your productivity insights stay private."
    },
    {
      question: "What integrations do you support?",
      answer: "SyncScript integrates with Google Calendar, Outlook, Slack, Notion, Asana, Trello, and 50+ other tools. New integrations added monthly."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, cancel with one click. No questions asked, no hidden fees. You'll keep access until the end of your billing period."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white overflow-x-hidden">
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
                onClick={() => navigate('/login?guest=true')}
                className="hidden sm:inline-block text-white/80 hover:text-white transition-colors font-medium"
              >
                Try as Guest →
              </button>
              <span className="text-white/60 text-xs hidden lg:inline">
                {betaSignups} testers joined
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
                onClick={() => scrollToSection('features')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('customers')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Customers
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-white/80 hover:text-white transition-colors"
              >
                FAQ
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/login')}
                className="hidden sm:inline-block text-white/80 hover:text-white transition-colors text-sm"
              >
                Sign In
              </button>
              <MagneticButton
                onClick={() => navigate('/signup')}
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
                      scrollToSection('features');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('pricing');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('customers');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    Customers
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('faq');
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left text-white/80 hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-lg"
                  >
                    FAQ
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/login');
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-white font-medium text-sm sm:text-base">
                Ready to 3x your productivity?
              </p>
              <MagneticButton
                onClick={() => navigate('/signup')}
                className="bg-white text-cyan-600 hover:bg-cyan-50 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:scale-105 shadow-lg text-sm sm:text-base whitespace-nowrap"
                strength={0.2}
              >
                Start Free →
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section - Redesigned with Video and Trust Signals */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 relative">
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
          <div className="text-center max-w-5xl mx-auto mb-12 sm:mb-16">
            {/* Trust Badge Above Headline */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-medium text-xs sm:text-sm">Used by 10,547+ productive professionals</span>
            </motion.div>

            {/* Hero Headline - Benefit-Focused */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 sm:mb-6 tracking-tight px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
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
              className="text-lg sm:text-xl md:text-2xl text-white/80 leading-relaxed mb-8 sm:mb-10 max-w-3xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Finish <span className="text-cyan-400 font-semibold">40% more tasks</span> by matching work to your natural rhythms. Not your willpower.
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
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
              
              <button
                onClick={() => navigate('/login?guest=true')}
                className="text-white/60 hover:text-white transition-colors text-sm sm:text-base font-medium group inline-flex items-center gap-2"
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
                loading="eager"
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

            {/* Real-time Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="absolute -left-4 sm:-left-8 top-[20%] bg-gray-900/90 border border-cyan-500/30 rounded-lg p-3 sm:p-4 shadow-2xl backdrop-blur-md max-w-[160px] sm:max-w-[200px] hidden md:block"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-white/80">Live Activity</span>
              </div>
              <p className="text-xs text-white/60">Sarah just completed her 50th task 🎉</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="absolute -right-4 sm:-right-8 top-[60%] bg-gray-900/90 border border-teal-500/30 rounded-lg p-3 sm:p-4 shadow-2xl backdrop-blur-md max-w-[160px] sm:max-w-[200px] hidden md:block"
            >
              <p className="text-xs text-white/60 mb-1">Acme Corp just upgraded to Team plan</p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-teal-400" />
                <span className="text-xs text-teal-400">+12 seats</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section with Scroll Animation */}
      <section ref={statsRef} className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <StaggerContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {statsInView && <CountUp end={10547} duration={2} />}+
                  </div>
                  <p className="text-sm sm:text-base text-white/60">Active Users</p>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {statsInView && <CountUp end={98.4} decimals={1} duration={2} />}%
                  </div>
                  <p className="text-sm sm:text-base text-white/60">Uptime (2024)</p>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    &lt;{statsInView && <CountUp end={2} duration={2} />}h
                  </div>
                  <p className="text-sm sm:text-base text-white/60">Support Response</p>
                </motion.div>
              </StaggerItem>

              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={statsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center"
                >
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    {statsInView && <CountUp end={40} duration={2} />}%
                  </div>
                  <p className="text-sm sm:text-base text-white/60">More Tasks Done</p>
                </motion.div>
              </StaggerItem>
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Three-Panel Value Prop - NEW! */}
      <section className="py-16 sm:py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">The Problem with "Productivity"</h2>
              <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
                Generic to-do apps ignore your biology. SyncScript works with it.
              </p>
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
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Your Results</h3>
                  <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">40% more tasks</strong> completed weekly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">8+ hours saved</strong> per week</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✨</span>
                      <span><strong className="text-white">Zero burnout</strong> from smart pacing</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Social Proof - Testimonials (MOVED UP!) */}
      <section id="customers" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by Productive Humans</h2>
              <p className="text-lg sm:text-xl text-white/70">See what happens when you stop fighting your energy</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {/* Testimonial 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic text-sm sm:text-base leading-relaxed">
                  "After 2 weeks with SyncScript, I'm finishing <strong>40% more tasks</strong> without feeling drained. The AI actually knows when I'm at my best."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full flex items-center justify-center font-bold text-gray-900">
                    SM
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Mitchell</h4>
                    <p className="text-sm text-white/50">Product Designer @ Stripe</p>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic text-sm sm:text-base leading-relaxed">
                  "Our team's productivity jumped <strong>60% in the first month</strong>. The energy tracking is a game-changer for remote work."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center font-bold text-gray-900">
                    JC
                  </div>
                  <div>
                    <h4 className="font-semibold">James Chen</h4>
                    <p className="text-sm text-white/50">Engineering Lead @ Notion</p>
                  </div>
                </div>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic text-sm sm:text-base leading-relaxed">
                  "I used to crash every afternoon. Now SyncScript schedules my hard tasks for mornings. <strong>Zero burnout</strong> in 3 months."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center font-bold text-gray-900">
                    AP
                  </div>
                  <div>
                    <h4 className="font-semibold">Aisha Patel</h4>
                    <p className="text-sm text-white/50">Founder @ StartupLab</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section - MOVED UP & Enhanced with ROI Calculator */}
      <section ref={pricingRef} id="pricing" className="py-16 sm:py-24 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg sm:text-xl text-white/70">Start free. Upgrade when you're ready. Cancel anytime.</p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8"
              >
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-6">
                  $0<span className="text-lg text-white/50 font-normal">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Up to 10 tasks per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Basic energy tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>1 calendar integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Mobile app access</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Start Free
                </button>
              </motion.div>

              {/* Pro Plan - FEATURED */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 backdrop-blur-sm border-2 border-cyan-500 rounded-2xl p-6 sm:p-8 relative transform md:scale-105 shadow-2xl shadow-cyan-500/20"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                  ⭐ MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-2">
                  $12<span className="text-lg text-white/50 font-normal">/month</span>
                </div>
                <p className="text-sm text-cyan-400 mb-6">$8/month billed annually (save 33%)</p>
                <ul className="space-y-3 mb-8 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span><strong>Unlimited</strong> tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Advanced AI scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Circadian rhythm optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>All integrations (50+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Custom scripts & templates</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/30"
                >
                  Try Free for 14 Days
                </button>
              </motion.div>

              {/* Team Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8"
              >
                <h3 className="text-2xl font-bold mb-2">Team</h3>
                <div className="text-4xl font-bold mb-6">
                  $8<span className="text-lg text-white/50 font-normal">/user/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Team collaboration tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Shared dashboards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Analytics & insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Admin controls</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <span>Dedicated success manager</span>
                  </li>
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-all"
                >
                  Start Team Trial
                </button>
              </motion.div>
            </div>

            {/* ROI Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-teal-900/20 to-emerald-900/20 border border-teal-500/30 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Calculate Your Time Savings</h3>
                <p className="text-white/70">See how much SyncScript is worth to you</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Controls */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 text-white/80">
                      Tasks per day: <span className="text-teal-400 font-bold">{tasksPerDay}</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={tasksPerDay}
                      onChange={(e) => setTasksPerDay(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-white/80">
                      Work hours per day: <span className="text-teal-400 font-bold">{hoursPerDay}</span>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="12"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="flex flex-col justify-center">
                  <div className="bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <div>
                      <p className="text-sm text-white/60 mb-1">Time saved per week:</p>
                      <p className="text-3xl font-bold text-teal-400">{timesSavedPerWeek} hours</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 mb-1">Value per month (@ $50/hr):</p>
                      <p className="text-3xl font-bold text-emerald-400">${moneySavedPerMonth.toLocaleString()}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-xs text-white/50">
                        Based on 20% efficiency gain from AI scheduling
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>SOC 2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works - 3 Simple Steps */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg sm:text-xl text-white/70">Get started in 3 simple steps</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="text-center relative"
              >
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
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center relative"
              >
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
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Get Auto-Optimized Schedule</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  Tasks auto-schedule to your <strong>peak energy hours</strong>. Zero effort.
                </p>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Interactive Product Demo */}
      <section className="py-16 sm:py-24 bg-black/20 backdrop-blur-sm">
        <InteractiveDemo />
      </section>

      {/* Bento Grid - Feature Deep Dive */}
      <section className="py-16 sm:py-24">
        <BentoGrid />
      </section>

      {/* Interactive Comparison Tool */}
      <section className="py-16 sm:py-24 bg-black/20 backdrop-blur-sm">
        <InteractiveComparison />
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg sm:text-xl text-white/70">Everything you need to know</p>
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
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-y border-cyan-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Ready to Stop the Burnout?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 sm:mb-12">
              Join <span className="text-cyan-400 font-semibold">10,547+</span> professionals who work with their energy, not against it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <MagneticButton
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-10 py-4 rounded-lg text-lg font-medium transition-all shadow-2xl shadow-cyan-500/30 inline-flex items-center justify-center gap-3 w-full sm:w-auto"
                strength={0.4}
              >
                Try Free for 14 Days
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
            </div>
            <p className="mt-6 text-sm text-white/50">
              No credit card required • Setup in 90 seconds • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
            {/* Column 1: Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection('dashboard-preview')} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => setShowDemoModal(true)} className="hover:text-white transition-colors">Demo</button></li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a 
                    href="mailto:support@syncscript.app" 
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Headphones className="w-4 h-4" />
                    support@syncscript.app
                  </a>
                </li>
                <li className="text-xs text-white/40 mt-3 leading-relaxed">
                  ⚡ AI-powered support<br />
                  ⏱️ Response in 2-4 hours<br />
                  🤖 90% auto-resolved
                </li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={imgImageSyncScriptLogo} alt="SyncScript" className="w-8 h-8" />
              <img src={imgImageSyncScript} alt="SyncScript" className="h-6" />
            </div>
            <p className="text-sm text-white/50 text-center sm:text-left">
              © 2024 SyncScript. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Spacer for floating CTA bar */}
        <div className="h-20 sm:h-24" />
      </footer>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 max-w-4xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDemoModal(false)}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">Experience SyncScript</h3>
              <p className="text-white/70 mb-6">Choose how you'd like to explore our platform</p>
              
              {/* Option 1: Video Tutorial (Placeholder) */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center border border-white/10 mb-6 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 opacity-5 animate-pulse" />
                
                {/* Content */}
                <div className="relative text-center text-white/70 p-8">
                  <div className="mb-4 inline-block p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                    <Play className="w-12 h-12 text-cyan-400" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2 text-white">Demo Video Coming Soon</h4>
                  <p className="text-white/60 mb-4">We're creating a professional walkthrough of SyncScript's features</p>
                  <div className="inline-flex items-center gap-2 text-sm text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <span>In the meantime, try our live interactive demo below!</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Live Demo with Guest Mode */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl p-6 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Try the Live Dashboard</h4>
                    <p className="text-white/70 text-sm">Experience SyncScript's full features without signing up</p>
                  </div>
                </div>
                
                <ul className="space-y-2 mb-4 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    No registration required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Full access to all features
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Save your progress anytime
                  </li>
                </ul>

                <MagneticButton
                  onClick={() => navigate('/login')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white px-8 py-3 rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/30 inline-flex items-center justify-center gap-2"
                  strength={0.3}
                >
                  <Sparkles className="w-5 h-5" />
                  Try Live Demo
                  <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </div>

              {/* Alternative: Sign up */}
              <div className="text-center text-sm text-white/50">
                Already convinced? <button onClick={() => navigate('/signup')} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Create free account</button>
              </div>
            </motion.div>
          </motion.div>
        )}
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
  );
}
