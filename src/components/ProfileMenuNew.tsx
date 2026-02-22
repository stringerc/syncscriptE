import { useState } from 'react';
import { User, LogOut, CreditCard, HelpCircle, Zap, Award, Sparkles, Lock, Check } from 'lucide-react';
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
import { motion, AnimatePresence } from 'motion/react';
import { CURRENT_USER } from '../utils/user-constants';
import { useNavigate } from 'react-router';
import { BillingPlansModal } from './BillingPlansModal';
import { HelpSupportModal } from './HelpSupportModal';
import { UserStatus } from './UserStatus';
import { useUserProfile } from '../utils/user-profile';
import {
  getUnlockedAnimations,
  getSelectedAnimation,
  setSelectedAnimation,
  getNextUnlock,
  getRarityColors,
  ANIMATION_UNLOCKS,
  type AvatarAnimationType,
} from '../utils/avatar-animations';

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
  const [showAnimPicker, setShowAnimPicker] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState<AvatarAnimationType>(getSelectedAnimation);
  const { enabled: gamificationEnabled } = useGamification();
  const navigate = useNavigate();

  const userLevel = profile.level ?? 1;
  const unlockedAnims = getUnlockedAnimations(userLevel);
  const nextUnlock = getNextUnlock(userLevel);

  const handleSelectAnimation = (type: AvatarAnimationType) => {
    setActiveAnimation(type);
    setSelectedAnimation(type);
  };

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
      <DropdownMenu open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setShowAnimPicker(false);
      }}>
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
                animationType={activeAnimation}
                size={40}
                className="w-10 h-10"
              />
              {/* Status Indicator */}
              <div className="absolute -bottom-1 -right-1">
                <UserStatus status={profile.status} size="sm" showDot />
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
                  animationType={activeAnimation}
                  size={48}
                  className="w-12 h-12"
                />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <UserStatus status={profile.status} size="md" showDot />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile.name}</p>
                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
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
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <div>
                    <p className="text-xs text-gray-400">Gamification</p>
                    <p className="text-sm font-medium text-teal-400">Active</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DropdownMenuSeparator className="bg-gray-700" />

          {/* Animation Picker Toggle */}
          {gamificationEnabled && (
            <>
              <div
                className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAnimPicker(prev => !prev);
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Avatar Animation</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-300">
                  {ANIMATION_UNLOCKS.find(a => a.type === activeAnimation)?.name ?? 'Glow'}
                </Badge>
              </div>

              <AnimatePresence>
                {showAnimPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-2 py-2 space-y-1.5 max-h-52 overflow-y-auto">
                      {ANIMATION_UNLOCKS.map((anim) => {
                        const unlocked = userLevel >= anim.unlockLevel;
                        const isActive = activeAnimation === anim.type;
                        const rarityStyle = getRarityColors(anim.rarity);

                        return (
                          <motion.div
                            key={anim.type}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                              isActive
                                ? 'bg-purple-500/15 border-purple-500/50'
                                : unlocked
                                ? 'bg-gray-800/50 border-gray-700 hover:border-gray-500'
                                : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (unlocked) handleSelectAnimation(anim.type);
                            }}
                            whileHover={unlocked ? { scale: 1.01 } : undefined}
                            whileTap={unlocked ? { scale: 0.98 } : undefined}
                          >
                            {/* Preview avatar */}
                            <AnimatedAvatar
                              name={profile.name}
                              image={profile.avatar}
                              fallback={profile.name.split(' ').map(n => n[0]).join('')}
                              progress={energyLevel}
                              animationType={unlocked ? anim.type : 'none'}
                              size={28}
                              className="w-7 h-7 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium truncate">{anim.name}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded ${rarityStyle.bg} ${rarityStyle.text}`}>
                                  {anim.rarity}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate">{anim.description}</p>
                            </div>
                            {!unlocked ? (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Lock className="w-3 h-3 text-gray-600" />
                                <span className="text-[10px] text-gray-600">Lv {anim.unlockLevel}</span>
                              </div>
                            ) : isActive ? (
                              <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            ) : null}
                          </motion.div>
                        );
                      })}

                      {/* Next unlock hint */}
                      {nextUnlock && (
                        <div className="text-center text-[10px] text-gray-500 pt-1">
                          Next unlock: <span className="text-purple-400">{nextUnlock.name}</span> at Level {nextUnlock.unlockLevel}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <DropdownMenuSeparator className="bg-gray-700" />
            </>
          )}

          {/* Menu Items */}
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="focus:bg-gray-700 focus:text-white cursor-pointer"
              onClick={() => handleNavigation('/team?view=individual')}
              data-nav="profile-menu-profile"
            >
              <User className="mr-2 h-4 w-4 text-gray-400" />
              <span>My Profile</span>
            </DropdownMenuItem>
            
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

      <BillingPlansModal
        open={showBillingModal}
        onClose={() => setShowBillingModal(false)}
      />

      <HelpSupportModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
}