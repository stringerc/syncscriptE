import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUserProfile, getStatusColor, getUserInitials } from '../utils/user-profile';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  src?: string;
  name?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const statusSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

export function UserAvatar({ 
  size = 'md', 
  showStatus = false, 
  src, 
  name,
  className = '' 
}: UserAvatarProps) {
  const { profile } = useUserProfile();
  
  const avatarSrc = src || profile.avatar;
  const displayName = name || profile.name;

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarSrc} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
          {getUserInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <div 
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full ${getStatusColor(profile.status)} border-2 border-[#1e2128]`}
          title={`Status: ${profile.status}`}
        />
      )}
    </div>
  );
}
