import React from 'react';
import { Button } from '@/components/ui/button';
import { SyncScriptLogo } from '@/components/ui/SyncScriptLogo';
import { Sun, Moon, MessageSquare, User, LogOut } from 'lucide-react';

export function HeaderZeroAPI() {
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
  };

  const handleLogoutClick = () => {
    console.log('Logout clicked - would log out user');
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

        {/* Right side - Dashboard Layout: Brief → End Day → Notifications → Profile → Logout */}
        <div className="flex items-center space-x-4">
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
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* User Info */}
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              Test User
            </p>
            <p className="text-xs text-muted-foreground">
              test@example.com
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
        </div>
      </div>
    </header>
  );
}
