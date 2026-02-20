import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AIFocusSection } from '../AIFocusSection';
import { TodaySection } from '../TodaySection';
import { ResourceHubSection } from '../ResourceHubSection';
import { DashboardLayout } from '../layout/DashboardLayout';
import { WelcomeModal } from '../WelcomeModal';
import { InteractiveHotspot, ONBOARDING_HOTSPOTS } from '../InteractiveHotspot';
import { useAuth } from '../../contexts/AuthContext';
import { generateFirstTimeUserData, firstTimeUserState } from '../../utils/first-time-user-data';

/**
 * DASHBOARD PAGE - First-Time User Experience Integration
 * 
 * Research-backed onboarding flow:
 * 1. Welcome modal on first visit (shows value proposition)
 * 2. Sample data pre-populated (demonstrates features)
 * 3. Interactive hotspot guides to first action
 * 4. Progressive tooltips introduce features
 * 
 * Expected results:
 * - 80%+ complete first energy log
 * - < 30 seconds time-to-value
 * - 70%+ Day 1 retention
 */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const hasLoggedEnergyLocal = localStorage.getItem('syncscript_has_logged_energy') === 'true';
  const isFirstTime = user?.isFirstTime && !user?.hasLoggedEnergy && !hasLoggedEnergyLocal;
  
  // Sample data state (for first-time users)
  const [sampleData, setSampleData] = useState<any>(null);
  
  // Onboarding UI state
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHotspot, setShowHotspot] = useState(false);
  const [currentHotspot, setCurrentHotspot] = useState('ENERGY_METER');
  
  // Initialize sample data for first-time users
  useEffect(() => {
    if (isFirstTime && !firstTimeUserState.hasSeenSampleData()) {
      // Generate sample data
      const data = generateFirstTimeUserData();
      setSampleData(data);
      firstTimeUserState.markSampleDataSeen();
      
      // Show welcome modal after brief delay (let page render first)
      setTimeout(() => {
        if (!firstTimeUserState.hasSeenWelcome()) {
          setShowWelcome(true);
        }
      }, 800);
    }
  }, [isFirstTime]);
  
  // Handle welcome modal - Quick Start
  function handleWelcomeGetStarted() {
    setShowWelcome(false);
    firstTimeUserState.markWelcomeSeen();
    
    // Show hotspot on energy meter after modal closes
    setTimeout(() => {
      setShowHotspot(true);
      setCurrentHotspot('ENERGY_METER');
    }, 600);
  }
  
  // Handle welcome modal - Set Up Profile
  function handleCustomizeProfile() {
    setShowWelcome(false);
    firstTimeUserState.markWelcomeSeen();
    
    // Navigate to onboarding wizard
    navigate('/onboarding');
  }
  
  // Handle hotspot progression
  function handleHotspotDismiss() {
    setShowHotspot(false);
    
    // Progress to next hotspot after delay
    const hotspotSequence = ['ENERGY_METER', 'AI_SUGGESTIONS', 'SCRIPTS_TAB', 'ROYGBIV_RING'];
    const currentIndex = hotspotSequence.indexOf(currentHotspot);
    
    if (currentIndex < hotspotSequence.length - 1 && isFirstTime) {
      setTimeout(() => {
        setCurrentHotspot(hotspotSequence[currentIndex + 1]);
        setShowHotspot(true);
      }, 10000); // Show next hotspot after 10 seconds
    }
  }

  return (
    <DashboardLayout>
      {/* 🎉 WELCOME MODAL - First-time users only */}
      <WelcomeModal
        show={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          firstTimeUserState.markWelcomeSeen();
        }}
        onGetStarted={handleWelcomeGetStarted}
        onCustomizeProfile={handleCustomizeProfile}
        userName={user?.name}
      />
      
      {/* 💡 INTERACTIVE HOTSPOT - Guided onboarding */}
      {isFirstTime && (
        <InteractiveHotspot
          show={showHotspot}
          {...ONBOARDING_HOTSPOTS[currentHotspot as keyof typeof ONBOARDING_HOTSPOTS]}
          onDismiss={handleHotspotDismiss}
        />
      )}
      
      <motion.div 
        className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Sample Data Indicator for first-time users */}
        {isFirstTime && sampleData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1600px] mx-auto mb-4"
          >
            <div className="bg-indigo-500/10 border border-indigo-400/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-2xl"
                >
                  ✨
                </motion.div>
                <div>
                  <div className="text-sm font-semibold text-indigo-300">
                    You're viewing sample data
                  </div>
                  <div className="text-xs text-indigo-400/70">
                    Your real journey starts when you log your first energy level
                  </div>
                </div>
              </div>
              <div className="text-xs text-indigo-400/50 font-mono">
                {sampleData.stats.totalLogs} sample logs • {sampleData.stats.streak} day streak
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="flex gap-6 max-w-[1600px] mx-auto h-full">
          {/* Left Column - AI & FOCUS */}
          <div id="ai-suggestions" className="flex-1 h-full overflow-y-auto hide-scrollbar">
            <AIFocusSection />
          </div>

          {/* Middle Column - TODAY'S ORCHESTRATION */}
          <div id="energy-meter" className="flex-1 h-full overflow-y-auto hide-scrollbar">
            <TodaySection />
          </div>

          {/* Right Column - RESOURCE HUB */}
          <div id="roygbiv-ring" className="flex-1 h-full overflow-y-auto hide-scrollbar">
            <ResourceHubSection />
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}