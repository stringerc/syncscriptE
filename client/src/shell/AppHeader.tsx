import React, { useState } from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useAuthStore } from '@/stores/authStore';
import { Icons } from '@/components/icons/IconLibrary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncScriptLogo } from '@/components/ui/SyncScriptLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { telemetryService } from '@/services/telemetryService';

/**
 * AppHeader Component
 * 
 * Modern header built with design tokens featuring:
 * - Left: Logo + wordmark
 * - Center: Search button (behind cmd_palette flag)
 * - Right: Energy mini, notifications bell, avatar menu
 * 
 * Accessibility: <header>, skip-to-content link, proper aria-labels
 * Performance: No blocking fonts; defer heavy icons
 */
export const AppHeader: React.FC = () => {
  const { isFlagEnabled } = useFeatureFlags();
  const { user, logout } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isCmdPaletteEnabled = isFlagEnabled('cmd_palette');

  // Mock energy level (0-10 mapped from engine 0-100)
  const energyLevel = 7; // This would come from energy engine in real implementation
  const energyPercentage = (energyLevel / 10) * 100;

  // Mock notification count
  const notificationCount = 3;

  const handleSearchClick = () => {
    if (isCmdPaletteEnabled) {
      // Record search opened event
      telemetryService.recordSearchOpened();
      
      setIsSearchOpen(true);
      // TODO: Open command palette in future PR
      console.log('🔍 Command palette would open here');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

        {/* Center: Search Button */}
        <div className="flex-1 flex justify-center">
          {isCmdPaletteEnabled ? (
            <Button
              variant="outline"
              onClick={handleSearchClick}
              className="w-full max-w-md justify-start text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:outline-none"
              aria-label="Search or type slash to open command palette"
              data-search-button
            >
              <Icons.Search size="sm" className="mr-2" />
              <span className="text-sm">Search or type /</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          ) : (
            <div className="w-full max-w-md" />
          )}
        </div>

        {/* Right: Energy Mini + Notifications + Avatar */}
        <div className="flex items-center space-x-4">
          {/* Energy Mini (Read-only) */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Icons.Energy size="sm" className="text-brand-accent" />
              <div className="flex items-center space-x-1">
                <div className="h-2 w-16 rounded-full bg-muted">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-primary transition-all duration-300"
                    style={{ width: `${energyPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {energyLevel}/10
                </span>
              </div>
            </div>
          </div>

          {/* Notifications Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:outline-none"
            aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
          >
            <Icons.Notification size="sm" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Avatar Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:outline-none"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-brand-primary text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.name && (
                    <p className="font-medium">{user.name}</p>
                  )}
                  {user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="flex items-center">
                  <Icons.User size="sm" className="mr-2" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings" className="flex items-center">
                  <Icons.Settings size="sm" className="mr-2" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <Icons.Close size="sm" className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
