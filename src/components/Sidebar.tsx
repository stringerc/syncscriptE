import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Target, Calendar, Bot, Zap, Waves, Users, TrendingUp, Gamepad2, Building2, FileText, Menu, Settings } from 'lucide-react';
import logoImage from 'figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png';
import { navigationLinks } from '../utils/navigation';
import { useCalendarNavigation } from '../contexts/CalendarNavigationContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerJumpToToday } = useCalendarNavigation();

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
    { icon: Building2, label: 'Enterprise', id: 'Enterprise', path: navigationLinks.sidebar.enterprise },
    { icon: Menu, label: 'All Features Menu', id: 'AllFeatures', path: navigationLinks.sidebar.allFeatures },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    // RESEARCH: iOS Tab Bar Pattern + Google Calendar
    // If clicking Calendar tab (even when already on it), trigger "Jump to Today"
    if (item.id === 'Calendar') {
      const isAlreadyOnCalendar = location.pathname === item.path;
      
      if (isAlreadyOnCalendar) {
        // Already on calendar → just jump to today (don't navigate)
        console.log('📅 Already on Calendar page - triggering jumpToToday');
        triggerJumpToToday();
      } else {
        // Not on calendar → navigate (CalendarEventsPage will auto-jump to today on mount)
        console.log('📅 Navigating to Calendar page');
        navigate(item.path);
      }
    } else {
      // All other tabs → normal navigation
      navigate(item.path);
    }
  };

  return (
    <div className="hidden md:flex md:w-14 lg:w-[100px] bg-[#1e2128] border-r border-gray-800 flex-col items-center py-5 backdrop-blur-sm">
      {/* Logo */}
      <div 
        className="mb-5 transition-transform hover:scale-110 cursor-pointer flex-shrink-0"
        onClick={() => navigate('/')}
        data-nav="logo"
        title="SyncScript - Go to Landing Page"
      >
        <img src={logoImage} alt="SyncScript Logo" className="md:w-9 md:h-9 lg:w-12 lg:h-12 object-contain" />
      </div>

      {/* Navigation Container - Only scrollable if needed */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
        {/* Navigation Items */}
        <nav className="flex flex-col items-center space-y-3 md:space-y-2 lg:space-y-3 px-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <div 
                key={item.id}
                onClick={() => handleNavClick(item)}
                data-nav={`sidebar-${item.id.toLowerCase()}`}
                className={`flex flex-col items-center gap-1 cursor-pointer group transition-all relative ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={item.label.replace('\n', ' ')} // Tooltip for tablet icon-only mode
              >
                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-teal-600 shadow-lg shadow-teal-600/50 scale-110' 
                    : 'bg-gray-700/50 group-hover:bg-gray-600 group-hover:scale-110'
                }`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className={`text-center leading-tight transition-colors hidden lg:block ${
                  item.multiline ? 'text-xs' : 'text-xs'
                }`} style={{ whiteSpace: 'pre-line' }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Settings at bottom */}
      <div 
        onClick={() => navigate(navigationLinks.sidebar.settings)}
        data-nav="sidebar-settings"
        className={`flex flex-col items-center gap-1 cursor-pointer group transition-all mt-6 flex-shrink-0 ${
          location.pathname === navigationLinks.sidebar.settings ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
        title="Settings"
      >
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
          location.pathname === navigationLinks.sidebar.settings
            ? 'bg-teal-600 shadow-lg shadow-teal-600/50 scale-110'
            : 'bg-gray-700/50 group-hover:bg-gray-600 group-hover:scale-110'
        }`}>
          <Settings className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
        </div>
        <span className="transition-colors text-xs hidden lg:block">Settings</span>
      </div>
    </div>
  );
}