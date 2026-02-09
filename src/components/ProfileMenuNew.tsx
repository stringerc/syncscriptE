import { useState } from 'react';
import { User, LogOut, CreditCard, HelpCircle, Zap, TrendingUp, Award, Circle } from 'lucide-react';
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
import { useGamification } from '../utils/gamification-preferences';
import { motion } from 'motion/react';
import { CURRENT_USER } from '../utils/user-constants';
import { useNavigate } from 'react-router';
import { BillingPlansModal } from './BillingPlansModal';
import { HelpSupportModal } from './HelpSupportModal';
import { UserStatus } from './UserStatus';
import { useUserProfile } from '../utils/user-profile';

interface ProfileMenuProps {
  energyLevel?: number;
  dailyStreak?: number;
  onNavigate?: (route: string) => void;
}

export function ProfileMenu({
  energyLevel = CURRENT_USER.energyLevel,
  dailyStreak = CURRENT_USER.dailyStreak,
  onNavigate,
}: ProfileMenuProps) {
  // Get current user from context - this is the SINGLE SOURCE OF TRUTH
  const { profile } = useUserProfile();
  
  const [open, setOpen] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { enabled: gamificationEnabled } = useGamification();
  const navigate = useNavigate();

  const handleNavigation = (route: string) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  };

  const handleSignOut = () => {
    setOpen(false);
    // Simulate sign out
    navigate('/');
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button 
            className="hover:opacity-90 transition-opacity focus:outline-none relative"
            data-nav="user-profile"
            aria-label="User profile menu"
          >
            <div className="relative">
              <AnimatedAvatar
                name={profile.name}
                image={profile.avatar}
                fallback={profile.name.split(' ').map(n => n[0]).join('')}
                progress={energyLevel}
                animationType="glow"
                size={40}
                className="w-10 h-10"
              />
              
              {/* Status Indicator + Level Badge */}
              <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5">
                {/* Status Dot */}
                <UserStatus status={profile.status} size="sm" showDot />
                
                {/* Level Badge - smaller, next to status */}
                {gamificationEnabled && (
                  <motion.div
                    className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-[#1e2128] shadow-lg"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <span className="text-[9px] font-bold text-gray-900">{profile.level}</span>
                  </motion.div>
                )}
              </div>
            </div>
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
              <div className="relative">
                <AnimatedAvatar
                  name={profile.name}
                  image={profile.avatar}
                  fallback={profile.name.split(' ').map(n => n[0]).join('')}
                  progress={energyLevel}
                  animationType="glow"
                  size={48}
                  className="w-12 h-12"
                />
                {/* Status on avatar */}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <UserStatus status={profile.status} size="md" showDot />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile.name}</p>
                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                {/* Status text */}
                <div className="mt-1">
                  <UserStatus status={profile.status} customStatus={profile.customStatus} showLabel />
                </div>
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
              {gamificationEnabled && (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-900">{profile.level}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Level</p>
                    <p className="text-sm font-medium">Level {profile.level}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Menu Items */}
          <DropdownMenuGroup>
            {/* My Profile - Routes to Team & Collaboration page with Individual tab */}
            <DropdownMenuItem 
              className="focus:bg-gray-700 focus:text-white cursor-pointer"
              onClick={() => handleNavigation('/team?view=individual')}
              data-nav="profile-menu-profile"
            >
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <span>My Profile</span>
            </DropdownMenuItem>
            
            {/* Billing & Plans - Opens modal */}
            <DropdownMenuItem 
              className="focus:bg-gray-700 focus:text-white cursor-pointer"
              onClick={() => {
                setOpen(false);
                setShowBillingModal(true);
              }}
              data-nav="profile-menu-billing"
            >
              <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
              <span>Billing & Plans</span>
            </DropdownMenuItem>
            
            {/* Help & Support - Opens modal */}
            <DropdownMenuItem 
              className="focus:bg-gray-700 focus:text-white cursor-pointer"
              onClick={() => {
                setOpen(false);
                setShowHelpModal(true);
              }}
              data-nav="profile-menu-help"
            >
              <HelpCircle className="mr-2 h-4 w-4 text-gray-400" />
              <span>Help & Support</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Sign Out */}
          <DropdownMenuItem 
            className="focus:bg-red-900/50 focus:text-red-400 cursor-pointer text-red-400"
            onClick={handleSignOut}
            data-nav="profile-menu-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Billing Modal */}
      <BillingPlansModal
        open={showBillingModal}
        onClose={() => setShowBillingModal(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
}