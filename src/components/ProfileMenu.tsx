import { useState } from 'react';
import { User, Settings, Bell, LogOut, CreditCard, HelpCircle, Zap, TrendingUp, Award, Gamepad2 } from 'lucide-react';
import { AnimatedAvatar } from './AnimatedAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { useGamification } from '../utils/gamification-preferences';
import { motion } from 'motion/react';
import { CURRENT_USER } from '../utils/user-constants';

interface ProfileMenuProps {
  userName?: string;
  userEmail?: string;
  avatarSrc?: string;
  energyLevel?: number;
  dailyStreak?: number;
  onNavigate?: (route: string) => void;
  userLevel?: number; // Gamification level
}

export function ProfileMenu({
  userName = CURRENT_USER.name,
  userEmail = CURRENT_USER.email,
  avatarSrc = CURRENT_USER.avatar,
  energyLevel = CURRENT_USER.energyLevel,
  dailyStreak = CURRENT_USER.dailyStreak,
  onNavigate,
  userLevel = CURRENT_USER.level,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const { enabled: gamificationEnabled, setEnabled: setGamificationEnabled } = useGamification();

  const handleNavigation = (route: string) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="hover:opacity-90 transition-opacity focus:outline-none relative"
          data-nav="user-profile"
          aria-label="User profile menu"
        >
          <AnimatedAvatar
            name={userName}
            image={avatarSrc}
            fallback={userName.split(' ').map(n => n[0]).join('')}
            progress={energyLevel}
            animationType="glow"
            size={40}
            className="w-10 h-10"
          />
          {/* Level Badge - Pulsing, positioned at bottom-right corner */}
          {gamificationEnabled && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-[#1e2128] shadow-lg"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 4px 6px -1px rgba(234, 179, 8, 0.1), 0 2px 4px -1px rgba(234, 179, 8, 0.06)',
                  '0 4px 12px rgba(234, 179, 8, 0.4), 0 2px 8px rgba(234, 179, 8, 0.3)',
                  '0 4px 6px -1px rgba(234, 179, 8, 0.1), 0 2px 4px -1px rgba(234, 179, 8, 0.06)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <span className="text-[10px] font-bold text-gray-900">{userLevel}</span>
            </motion.div>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 bg-[#1e2128] border-gray-700 text-white p-2" 
        align="end"
        sideOffset={8}
      >
        {/* User Info Header */}
        <div className="px-2 py-3 mb-2">
          <div className="flex items-center gap-3 mb-3">
            <AnimatedAvatar
              name={userName}
              image={avatarSrc}
              fallback={userName.split(' ').map(n => n[0]).join('')}
              progress={energyLevel}
              animationType="glow"
              size={48}
              className="w-12 h-12"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
          </div>
          
          {/* Energy Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-gray-400">Energy Level</span>
              </div>
              <span className="text-teal-400 font-medium">{energyLevel}%</span>
            </div>
            {/* Research: Cyan-teal for energy/vitality (matches context) */}
            <Progress value={energyLevel} className="h-1.5" indicatorClassName="bg-gradient-to-r from-teal-500 to-cyan-400" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-xs text-gray-400">Daily Streak</p>
                <p className="text-sm font-medium">{dailyStreak} days</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">This Week</p>
                <p className="text-sm font-medium">+24%</p>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Quick Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="focus:bg-gray-700 focus:text-white cursor-pointer"
            onClick={() => handleNavigation('/profile')}
            data-nav="profile-menu-profile"
          >
            <User className="mr-2 h-4 w-4 text-gray-400" />
            <span>My Profile</span>
            <Badge variant="outline" className="ml-auto border-teal-600 text-teal-400 text-xs">
              View
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="focus:bg-gray-700 focus:text-white cursor-pointer"
            onClick={() => handleNavigation('/settings')}
            data-nav="profile-menu-settings"
          >
            <Settings className="mr-2 h-4 w-4 text-gray-400" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="focus:bg-gray-700 focus:text-white cursor-pointer"
            onClick={() => handleNavigation('/notifications')}
            data-nav="profile-menu-notifications"
          >
            <Bell className="mr-2 h-4 w-4 text-gray-400" />
            <span>Notifications</span>
            <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0">
              3
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Account Management */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="focus:bg-gray-700 focus:text-white cursor-pointer"
            onClick={() => handleNavigation('/billing')}
            data-nav="profile-menu-billing"
          >
            <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
            <span>Billing & Plans</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="focus:bg-gray-700 focus:text-white cursor-pointer"
            onClick={() => handleNavigation('/help')}
            data-nav="profile-menu-help"
          >
            <HelpCircle className="mr-2 h-4 w-4 text-gray-400" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Gamification Toggle */}
        <div className="px-2 py-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#252830] border border-gray-700">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <div>
                <p className="text-sm font-medium">Gamification</p>
                <p className="text-xs text-gray-400">Points, badges, & rewards</p>
              </div>
            </div>
            <Switch
              checked={gamificationEnabled}
              onCheckedChange={setGamificationEnabled}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        {/* Sign Out */}
        <DropdownMenuItem 
          className="focus:bg-red-900/50 focus:text-red-400 cursor-pointer text-red-400"
          onClick={() => handleNavigation('/')}
          data-nav="profile-menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}