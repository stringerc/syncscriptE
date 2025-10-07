import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  Trophy, 
  HelpCircle, 
  CreditCard, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleProfileClick = () => {
    console.log('📋 Profile clicked');
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    console.log('⚙️ Settings clicked');
    navigate('/settings');
  };

  const handleAchievementsClick = () => {
    console.log('🏆 Achievements clicked');
    navigate('/gamification');
  };

  const handlePricingClick = () => {
    console.log('💎 Pricing clicked');
    navigate('/pricing');
  };

  const handleHelpClick = () => {
    console.log('❓ Help clicked');
    // TODO: Open help modal or navigate to help page
  };

  const handleLogoutClick = () => {
    console.log('👋 Logout clicked');
    logout();
    navigate('/auth');
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user?.name || 'Test User';
  const userEmail = user?.email || 'test@example.com';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} alt={userName} />
            <AvatarFallback 
              className="text-white font-semibold"
              style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))' }}
            >
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2 p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatarUrl} alt={userName} />
                <AvatarFallback 
                  className="text-white font-semibold text-lg"
                  style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))' }}
                >
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="flex-1 text-center p-2 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50">
                <div className="text-lg font-bold text-yellow-600">850</div>
                <div className="text-xs text-gray-600">Points</div>
              </div>
              <div className="flex-1 text-center p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-lg font-bold text-purple-600">14</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
              <div className="flex-1 text-center p-2 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                <div className="text-lg font-bold text-blue-600">6</div>
                <div className="text-xs text-gray-600">Emblems</div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Menu Items */}
        <DropdownMenuItem 
          onClick={handleProfileClick}
          className="cursor-pointer py-2.5 px-3 focus:bg-gray-100"
        >
          <User className="mr-3 h-4 w-4 text-gray-600" />
          <span className="font-medium">Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleSettingsClick}
          className="cursor-pointer py-2.5 px-3 focus:bg-gray-100"
        >
          <Settings className="mr-3 h-4 w-4 text-gray-600" />
          <span className="font-medium">Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleAchievementsClick}
          className="cursor-pointer py-2.5 px-3 focus:bg-gradient-to-r focus:from-purple-50 focus:to-pink-50"
        >
          <Trophy className="mr-3 h-4 w-4 text-purple-600" />
          <span className="font-medium text-purple-600">Achievements & Emblems</span>
          <Sparkles className="ml-auto h-4 w-4 text-yellow-500" />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handlePricingClick}
          className="cursor-pointer py-2.5 px-3 focus:bg-gradient-to-r focus:from-amber-50 focus:to-yellow-50"
        >
          <CreditCard className="mr-3 h-4 w-4 text-amber-600" />
          <span className="font-medium">Upgrade to Premium</span>
          <span className="ml-auto text-xs font-bold text-amber-600">$9.99</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleHelpClick}
          className="cursor-pointer py-2.5 px-3 focus:bg-gray-100"
        >
          <HelpCircle className="mr-3 h-4 w-4 text-gray-600" />
          <span className="font-medium">Help & Docs</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogoutClick}
          className="cursor-pointer py-2.5 px-3 text-red-600 focus:bg-red-50 focus:text-red-700"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

