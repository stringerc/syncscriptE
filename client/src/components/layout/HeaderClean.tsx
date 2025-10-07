import React, { useState, useCallback } from 'react';
import { Search, User, LogOut, Bell, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { SyncScriptLogo } from '@/components/ui/SyncScriptLogo';

export function HeaderClean() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Check if we're on dashboard
  const isDashboard = location.pathname === '/zero-api' || 
                     location.pathname === '/dashboard' || 
                     location.pathname === '/dashboard-new' || 
                     location.pathname === '/dashboard-ultra';

  // Search handlers
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      console.log(`Search for: ${query.trim()}`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [searchQuery, handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.length >= 2);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowDropdown(true);
    }
  }, [searchQuery]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow clicking on results
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  // Button handlers
  const handleBriefClick = () => {
    console.log('Morning brief clicked');
  };

  const handleEndDayClick = () => {
    console.log('End day clicked');
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked - would navigate to /profile');
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    console.log('Logout clicked');
    logout();
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Wordmark */}
        <div className="flex items-center space-x-3">
          <SyncScriptLogo size="md" showText={true} />
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search tasks, events, or ask AI..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          
          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Search functionality ready!</p>
                <p className="text-xs mt-1">Type and press Enter to search</p>
              </div>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dashboard Layout: Brief → End Day → Notifications → Name/Energy → Profile → Logout */}
          {isDashboard ? (
            <>
              {/* Brief Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 px-3"
                title="Morning Brief"
                onClick={handleBriefClick}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Brief</span>
              </Button>

              {/* End Day Button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 px-3"
                title="Evening Reflection"
                onClick={handleEndDayClick}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm font-medium">End Day</span>
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                title="Notifications"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
              </Button>
              
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || 'Test User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'test@example.com'}
                </p>
              </div>

              {/* Profile Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={handleProfileClick}
                title="Go to Profile"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost"
                size="icon" 
                onClick={handleLogoutClick}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            /* Non-Dashboard Layout: Notifications → Profile → Logout */
            <>
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                title="Notifications"
                onClick={handleNotificationsClick}
              >
                <Bell className="w-5 h-5" />
              </Button>
              
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || 'Test User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'test@example.com'}
                </p>
              </div>

              {/* Profile Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={handleProfileClick}
                title="Go to Profile"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost"
                size="icon" 
                onClick={handleLogoutClick}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
