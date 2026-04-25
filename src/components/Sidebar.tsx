import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Target, Calendar, Bot, Zap, Waves, Users, TrendingUp, Gamepad2, Building2, FileText, Menu, Settings, Mail, DollarSign, FolderOpen } from 'lucide-react';
import logoImage from 'figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png';
import { navigationLinks } from '../utils/navigation';
import { navigateWithHardFallback } from '../utils/navigateWithHardFallback';
import { useCalendarNavigation } from '../contexts/CalendarNavigationContext';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerJumpToToday } = useCalendarNavigation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'Dashboard', path: navigationLinks.sidebar.dashboard },
    { icon: Target, label: 'Tasks', id: 'Tasks', path: navigationLinks.sidebar.tasks },
    { icon: Calendar, label: 'Calendar', id: 'Calendar', path: navigationLinks.sidebar.calendar },
    { icon: DollarSign, label: 'Financials', id: 'Financials', path: navigationLinks.sidebar.financials },
    { icon: Mail, label: 'Email', id: 'Email', path: navigationLinks.sidebar.email },
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

  return (
    <div
      id="app-sidebar-rail"
      className="fixed inset-y-0 left-0 z-30 hidden md:flex md:w-14 lg:w-[100px] flex-col bg-gradient-to-b from-[#1f232d] via-[#1b2029] to-[#181c25] border-r border-gray-700/70 shadow-[inset_-1px_0_0_rgba(45,212,191,0.08),0_0_40px_rgba(45,212,191,0.08)] py-5 backdrop-blur-sm pointer-events-auto"
    >
      {/* Logo — w-full + justify-center so the mark stays centered in the rail */}
      <div
        className="mb-5 flex w-full justify-center transition-transform hover:scale-110 cursor-pointer flex-shrink-0"
        onClick={() => navigateWithHardFallback(navigate, '/')}
        data-nav="logo"
        title="SyncScript - Go to Landing Page"
      >
        <img src={logoImage} alt="SyncScript Logo" className="md:w-9 md:h-9 lg:w-12 lg:h-12 object-contain" />
      </div>

      {/* Navigation Container - Only scrollable if needed */}
      <div className="ambient-scrollbar flex-1 w-full overflow-y-auto overflow-x-hidden">
        {/* Navigation Items */}
        <nav className="flex flex-col items-center space-y-3 md:space-y-2 lg:space-y-3 px-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const pathOnly = item.path.split('?')[0];
            const isActive = location.pathname === pathOnly;

            return (
              <button
                key={item.id}
                type="button"
                data-nav={`sidebar-${item.id.toLowerCase()}`}
                onClick={() => {
                  if (item.id === 'Calendar' && location.pathname === pathOnly) {
                    triggerJumpToToday();
                    return;
                  }
                  navigateWithHardFallback(navigate, item.path);
                }}
                className={`inline-flex w-max max-w-full mx-auto flex-col items-center gap-1 cursor-pointer group transition-all relative border-0 bg-transparent p-0 text-inherit ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={item.label.replace('\n', ' ')}
                aria-label={item.label.replace('\n', ' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-teal-600 shadow-lg shadow-teal-600/50 scale-110'
                      : 'bg-gray-700/50 group-hover:bg-gray-600 group-hover:scale-110'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                </div>
                <span
                  className={`text-center leading-tight transition-colors hidden lg:block ${
                    item.multiline ? 'text-xs' : 'text-xs'
                  }`}
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings at bottom */}
      <button
        type="button"
        data-nav="sidebar-settings"
        onClick={() => navigateWithHardFallback(navigate, navigationLinks.sidebar.settings)}
        className={`inline-flex w-max max-w-full mx-auto flex-col items-center gap-1 cursor-pointer group transition-all mt-6 flex-shrink-0 border-0 bg-transparent p-0 text-inherit ${
          location.pathname === navigationLinks.sidebar.settings ? 'text-white' : 'text-gray-400 hover:text-white'
        }`}
        title="Settings"
        aria-label="Settings"
        aria-current={location.pathname === navigationLinks.sidebar.settings ? 'page' : undefined}
      >
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
          location.pathname === navigationLinks.sidebar.settings
            ? 'bg-teal-600 shadow-lg shadow-teal-600/50 scale-110'
            : 'bg-gray-700/50 group-hover:bg-gray-600 group-hover:scale-110'
        }`}>
          <Settings className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
        </div>
        <span className="transition-colors text-xs hidden lg:block">Settings</span>
      </button>
    </div>
  );
}