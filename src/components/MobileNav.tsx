import { useNavigate, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Target, Calendar, Bot, Zap, Waves, Users, 
  TrendingUp, Gamepad2, Link2, Building2, FileText, Menu, Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from 'figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png';
import { navigationLinks } from '../utils/navigation';
import { useAI } from '../contexts/AIContext';

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasUnreadAIMessage, clearUnreadAIMessage } = useAI();
  
  // Clear unread dot when user navigates to AI page
  useEffect(() => {
    if (location.pathname.startsWith('/ai') && hasUnreadAIMessage) {
      clearUnreadAIMessage();
    }
  }, [location.pathname, hasUnreadAIMessage, clearUnreadAIMessage]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'Dashboard', path: navigationLinks.sidebar.dashboard },
    { icon: Target, label: 'Tasks', id: 'Tasks', path: navigationLinks.sidebar.tasks },
    { icon: Calendar, label: 'Calendar', id: 'Calendar', path: navigationLinks.sidebar.calendar },
    { icon: Bot, label: 'AI', id: 'AI', path: navigationLinks.sidebar.ai },
    { icon: Zap, label: 'Energy', id: 'Energy', path: navigationLinks.sidebar.energy },
    { icon: Waves, label: 'Resonance Engine', id: 'Resonance', path: navigationLinks.sidebar.resonance },
    { icon: Users, label: 'Team', id: 'Team', path: navigationLinks.sidebar.team },
    { icon: Gamepad2, label: 'Gaming', id: 'Gaming', path: navigationLinks.sidebar.gaming },
    { icon: FileText, label: 'Scripts & Templates', id: 'Scripts', path: navigationLinks.sidebar.scripts },
    { icon: TrendingUp, label: 'Analytics', id: 'Analytics', path: navigationLinks.sidebar.analytics },
    // Integrations removed from sidebar - accessible via Settings only
    { icon: Building2, label: 'Enterprise', id: 'Enterprise', path: navigationLinks.sidebar.enterprise },
    { icon: Menu, label: 'All Features', id: 'AllFeatures', path: navigationLinks.sidebar.allFeatures },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    navigate(item.path);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar - Visible on <768px */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e2128]/95 backdrop-blur-md border-t border-gray-800 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 gap-0.5 px-1 py-1.5">
          {/* Dashboard */}
          <button
            onClick={() => navigate(navigationLinks.sidebar.dashboard)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
              location.pathname === navigationLinks.sidebar.dashboard
                ? 'text-teal-400 bg-teal-600/20'
                : 'text-gray-400 active:bg-gray-700/30'
            }`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          {/* Tasks */}
          <button
            onClick={() => navigate(navigationLinks.sidebar.tasks)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
              location.pathname === navigationLinks.sidebar.tasks
                ? 'text-teal-400 bg-teal-600/20'
                : 'text-gray-400 active:bg-gray-700/30'
            }`}
          >
            <Target className="w-6 h-6" />
            <span className="text-[10px] font-medium">Tasks</span>
          </button>

          {/* Calendar */}
          <button
            onClick={() => navigate(navigationLinks.sidebar.calendar)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
              location.pathname === navigationLinks.sidebar.calendar
                ? 'text-teal-400 bg-teal-600/20'
                : 'text-gray-400 active:bg-gray-700/30'
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">Calendar</span>
          </button>

          {/* AI */}
          <button
            onClick={() => navigate(navigationLinks.sidebar.ai)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
              location.pathname === navigationLinks.sidebar.ai
                ? 'text-teal-400 bg-teal-600/20'
                : 'text-gray-400 active:bg-gray-700/30'
            }`}
          >
            <Bot className="w-6 h-6" />
            <span className="text-[10px] font-medium">AI</span>
            {hasUnreadAIMessage && !location.pathname.startsWith('/ai') && (
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Menu Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-lg transition-all min-h-[60px] ${
              isDrawerOpen
                ? 'text-teal-400 bg-teal-600/20'
                : 'text-gray-400 active:bg-gray-700/30'
            }`}
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer - Full Menu */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-black backdrop-blur-sm z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#1e2128] border-r border-gray-800 z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <img src={logoImage} alt="SyncScript" className="w-10 h-10" />
                  <span className="font-semibold text-white">SyncScript</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}

                {/* Settings */}
                <button
                  onClick={() => {
                    navigate(navigationLinks.sidebar.settings);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    location.pathname === navigationLinks.sidebar.settings
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Settings</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}