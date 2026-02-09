import { useUserProfile, getStatusLabel } from '../../utils/user-profile';
import { UserAvatar } from './UserAvatar';
import { ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { navigationLinks } from '../../utils/navigation';

/**
 * CURRENT USER CARD COMPONENT
 * 
 * RESEARCH-BACKED DESIGN:
 * - Slack's User Menu: Consistent identity display with status indicator
 * - Linear's User Dropdown: Clean profile access from any page
 * - Notion's User Settings: Single source for profile management
 * 
 * This component displays the CURRENT logged-in user.
 * Always pulls from UserProfileContext to ensure consistency.
 */

export interface CurrentUserCardProps {
  variant?: 'sidebar' | 'header' | 'compact';
  showDropdown?: boolean;
  className?: string;
}

export function CurrentUserCard({
  variant = 'sidebar',
  showDropdown = true,
  className = '',
}: CurrentUserCardProps) {
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleProfileClick = () => {
    navigate(navigationLinks.settings.profile);
    setIsOpen(false);
  };
  
  const handleSettingsClick = () => {
    navigate(navigationLinks.sidebar.settings);
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    // In production, call auth logout
    console.log('Logout clicked');
    setIsOpen(false);
  };
  
  if (variant === 'compact') {
    // Just avatar (for mobile or minimal UI)
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => showDropdown && setIsOpen(!isOpen)}
          className="focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full"
        >
          <UserAvatar
            name={profile.name}
            avatar={profile.avatar}
            showStatus
            status={profile.status}
            size="md"
            animationType="glow"
          />
        </button>
        {showDropdown && isOpen && (
          <DropdownMenu 
            onProfileClick={handleProfileClick}
            onSettingsClick={handleSettingsClick}
            onLogout={handleLogout}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }
  
  if (variant === 'header') {
    // Horizontal layout for header/navbar
    const buttonClasses = [
      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
      'hover:bg-gray-800/50',
      'focus:outline-none focus:ring-2 focus:ring-teal-500',
      showDropdown ? 'cursor-pointer' : ''
    ].join(' ');
    
    const chevronClasses = [
      'w-4 h-4 text-gray-400 transition-transform',
      isOpen ? 'rotate-180' : ''
    ].join(' ');
    
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => showDropdown && setIsOpen(!isOpen)}
          className={buttonClasses}
        >
          <UserAvatar
            name={profile.name}
            avatar={profile.avatar}
            showStatus
            status={profile.status}
            size="md"
            animationType="glow"
          />
          <div className="text-left">
            <p className="text-sm font-medium text-white">{profile.name}</p>
            <p className="text-xs text-gray-400">
              {getStatusLabel(profile.status, profile.customStatus)}
            </p>
          </div>
          {showDropdown && (
            <ChevronDown className={chevronClasses} />
          )}
        </button>
        {showDropdown && isOpen && (
          <DropdownMenu 
            onProfileClick={handleProfileClick}
            onSettingsClick={handleSettingsClick}
            onLogout={handleLogout}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }
  
  // Sidebar variant (default) - vertical layout
  const buttonClasses = [
    'w-full flex flex-col items-center gap-2 px-2 py-3 rounded-lg transition-all',
    'hover:bg-gray-800/50',
    'focus:outline-none focus:ring-2 focus:ring-teal-500',
    showDropdown ? 'cursor-pointer' : ''
  ].join(' ');
  
  const chevronClasses = [
    'w-3 h-3 text-gray-400 transition-transform',
    isOpen ? 'rotate-180' : ''
  ].join(' ');
  
  return (
    <div className={`relative w-full ${className}`}>
      <button
        onClick={() => showDropdown && setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <UserAvatar
          name={profile.name}
          avatar={profile.avatar}
          showStatus
          status={profile.status}
          size="lg"
          animationType="glow"
        />
        <div className="text-center w-full">
          <p className="text-xs font-medium text-white truncate px-1">{profile.name.split(' ')[0]}</p>
          <p className="text-[10px] text-gray-400 truncate px-1">
            {profile.status === 'custom' && profile.customStatus?.emoji 
              ? profile.customStatus.emoji 
              : 'Lvl ' + profile.level}
          </p>
        </div>
        {showDropdown && (
          <ChevronDown className={chevronClasses} />
        )}
      </button>
      {showDropdown && isOpen && (
        <DropdownMenu 
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Shared dropdown menu component
function DropdownMenu({
  onProfileClick,
  onSettingsClick,
  onLogout,
  onClose,
}: {
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
        >
          <User className="w-4 h-4" />
          View Profile
        </button>
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <div className="my-1 border-t border-gray-700" />
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </>
  );
}

/**
 * USAGE EXAMPLES:
 * 
 * // In Sidebar (bottom)
 * <CurrentUserCard variant="sidebar" />
 * 
 * // In Header/Navbar
 * <CurrentUserCard variant="header" />
 * 
 * // Mobile (compact)
 * <CurrentUserCard variant="compact" />
 * 
 * // Without dropdown (just display)
 * <CurrentUserCard showDropdown={false} />
 */
