import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, Calendar, DollarSign, Bot, Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncScriptLogo } from '@/components/ui/SyncScriptLogo';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { cn } from '@/lib/utils';

interface NavMode {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  gradientStyle: React.CSSProperties;
  hotkey: string;
}

const modes: NavMode[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    route: '/home',
    gradientStyle: { backgroundImage: 'linear-gradient(to right, rgb(99 102 241), rgb(168 85 247), rgb(236 72 153))' },
    hotkey: '1'
  },
  {
    id: 'do',
    label: 'Do',
    icon: <Zap className="w-5 h-5" />,
    route: '/do',
    gradientStyle: { backgroundImage: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129), rgb(20 184 166))' },
    hotkey: '2'
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: <Calendar className="w-5 h-5" />,
    route: '/plan',
    gradientStyle: { backgroundImage: 'linear-gradient(to right, rgb(59 130 246), rgb(6 182 212), rgb(14 165 233))' },
    hotkey: '3'
  },
  {
    id: 'manage',
    label: 'Manage',
    icon: <DollarSign className="w-5 h-5" />,
    route: '/manage',
    gradientStyle: { backgroundImage: 'linear-gradient(to right, rgb(245 158 11), rgb(249 115 22), rgb(239 68 68))' },
    hotkey: '4'
  }
];

interface TopNavProps {
  onSearchClick?: () => void;
}

export function TopNav({ onSearchClick }: TopNavProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Determine active mode from current path
  const getActiveMode = (): string => {
    const path = location.pathname;
    if (path.startsWith('/home') || path === '/' || path === '/zero-api' || path === '/dashboard') return 'home';
    if (path.startsWith('/do') || path === '/tasks') return 'do';
    if (path.startsWith('/plan') || path === '/calendar') return 'plan';
    if (path.startsWith('/manage') || path === '/financial' || path === '/profile' || path === '/settings' || path === '/friends' || path === '/projects') return 'manage';
    return '';
  };

  const activeMode = getActiveMode();

  // NOTE: Keyboard shortcuts are now handled globally by useKeyboardShortcuts hook
  // This local handler is kept for backward compatibility but can be removed
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1-4 for mode switching
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const modeIndex = parseInt(e.key) - 1;
        navigate(modes[modeIndex].route);
      }
      
      // Cmd/Ctrl + K for AI (we'll add this later)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        console.log('🤖 AI Assistant triggered (Cmd+K)');
        // TODO: Open AI modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleModeClick = useCallback((mode: NavMode) => {
    console.log(`🔄 Navigating to ${mode.label} (${mode.route})`);
    navigate(mode.route);
  }, [navigate]);

  const handleAIClick = useCallback(() => {
    console.log('🤖 AI Assistant clicked');
    // TODO: Open AI modal
  }, []);

  const handleNotificationsClick = useCallback(() => {
    console.log('🔔 Notifications clicked');
    setShowNotifications(true);
  }, []);

  // UserMenu dropdown now handles its own state

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            <SyncScriptLogo size="sm" showText={true} />
          </div>

          {/* Center: Mode Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {useMemo(() => modes.map((mode) => {
              const isActive = activeMode === mode.id;
              
              return (
                <Button
                  key={mode.id}
                  onClick={() => handleModeClick(mode)}
                  variant="ghost"
                  className={cn(
                    "relative px-6 py-2 text-base font-medium",
                    isActive && "text-white shadow-lg",
                    !isActive && "text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200",
                    mode.id === 'home' && "ring-2 ring-blue-200" // Add visual indicator for Home button
                  )}
                  style={isActive ? mode.gradientStyle : undefined}
                  title={`${mode.label} — Press Cmd+${mode.hotkey} or click`}
                >
                  <span className="flex items-center gap-2">
                    {mode.icon}
                    <span>{mode.label}</span>
                  </span>
                  
                  {/* Active indicator underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-white/50 rounded-t-full" />
                  )}
                </Button>
              );
            }), [activeMode, handleModeClick])}

            {/* AI Button (Special) */}
            <Button
              onClick={handleAIClick}
              variant="ghost"
              className="relative px-6 py-2 text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300"
              title="AI Assistant — Press Cmd+K or click"
            >
              <span className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span>AI</span>
              </span>
            </Button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                console.log('🔍 Search button clicked');
                onSearchClick?.();
              }}
              title="Search (Press /)"
              className="hidden sm:flex hover:bg-purple-50 hover:text-purple-600 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationsClick}
              title="Notifications"
              className="relative hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] text-white font-bold animate-pulse border-2 border-white dark:border-slate-900"
                  style={{ backgroundImage: 'linear-gradient(to right, rgb(239 68 68), rgb(249 115 22))' }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Menu Dropdown */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-around px-4 py-2">
            {modes.map((mode) => {
              const isActive = activeMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeClick(mode)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg",
                    isActive && "shadow-lg",
                    !isActive && "text-gray-600 transition-colors duration-200"
                  )}
                  style={isActive ? mode.gradientStyle : undefined}
                >
                  <span className={isActive ? "text-white" : ""}>{mode.icon}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-white" : "text-gray-600"
                  )}>
                    {mode.label}
                  </span>
                </button>
              );
            })}

            {/* AI Button (Mobile) */}
            <button
              onClick={handleAIClick}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-purple-600"
            >
              <Bot className="w-5 h-5" />
              <span className="text-xs font-medium">AI</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Notification Center Modal */}
      <NotificationCenter 
        open={showNotifications} 
        onClose={() => setShowNotifications(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </nav>
  );
}

