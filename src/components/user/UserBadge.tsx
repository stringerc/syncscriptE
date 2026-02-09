import { UserAvatar, type UserAvatarProps } from './UserAvatar';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import { Crown, Shield, Users, Eye } from 'lucide-react';

/**
 * USER BADGE COMPONENT
 * 
 * RESEARCH-BACKED DESIGN:
 * - Linear's User Pills: Compact representation with role indicators
 * - Notion's Person Property: Clean name + avatar layout
 * - Slack's User Mentions: Consistent formatting across all surfaces
 * 
 * Use this for inline user representations (task lists, mentions, etc.)
 */

export type UserRole = 'creator' | 'admin' | 'editor' | 'collaborator' | 'viewer';

export interface UserBadgeProps extends Pick<UserAvatarProps, 'name' | 'avatar' | 'fallback' | 'animationType' | 'showStatus' | 'status'> {
  // Display options
  variant?: 'default' | 'compact' | 'detailed';
  
  // Role indicator
  role?: UserRole;
  showRole?: boolean;
  
  // Additional info
  subtitle?: string; // e.g., "Online", "2 hours ago", etc.
  
  // Interactivity
  onClick?: () => void;
  
  // Styling
  className?: string;
}

export function UserBadge({
  name,
  avatar,
  fallback,
  animationType = 'none',
  showStatus = false,
  status = 'available',
  variant = 'default',
  role,
  showRole = false,
  subtitle,
  onClick,
  className,
}: UserBadgeProps) {
  
  const isInteractive = !!onClick;
  
  // Role styling (research: color psychology for hierarchy)
  const roleConfig = {
    creator: { 
      icon: Crown, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/10',
      label: 'Creator'
    },
    admin: { 
      icon: Shield, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      label: 'Admin'
    },
    editor: { 
      icon: Users, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      label: 'Editor'
    },
    collaborator: { 
      icon: Users, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10',
      label: 'Collaborator'
    },
    viewer: { 
      icon: Eye, 
      color: 'text-gray-400', 
      bg: 'bg-gray-500/10',
      label: 'Viewer'
    },
  };
  
  const RoleIcon = role ? roleConfig[role].icon : null;
  
  if (variant === 'compact') {
    // Just avatar + name (for tight spaces)
    return (
      <div 
        className={cn(
          'inline-flex items-center gap-2',
          isInteractive && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
      >
        <UserAvatar
          name={name}
          avatar={avatar}
          fallback={fallback}
          animationType={animationType}
          showStatus={showStatus}
          status={status}
          size="xs"
        />
        <span className="text-sm text-white truncate">{name}</span>
      </div>
    );
  }
  
  if (variant === 'detailed') {
    // Avatar + name + subtitle + role (for user lists, team members)
    return (
      <div 
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg transition-all',
          isInteractive && 'cursor-pointer hover:bg-gray-800/50',
          className
        )}
        onClick={onClick}
      >
        <UserAvatar
          name={name}
          avatar={avatar}
          fallback={fallback}
          animationType={animationType}
          showStatus={showStatus}
          status={status}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            {showRole && role && RoleIcon && (
              <Badge 
                variant="outline" 
                className={cn('text-xs px-1.5 py-0', roleConfig[role].bg, roleConfig[role].color)}
              >
                <RoleIcon className="w-3 h-3 mr-1" />
                {roleConfig[role].label}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }
  
  // Default variant - avatar + name (most common)
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2.5 py-1 px-2 rounded-lg transition-all',
        isInteractive && 'cursor-pointer hover:bg-gray-800/30',
        className
      )}
      onClick={onClick}
    >
      <UserAvatar
        name={name}
        avatar={avatar}
        fallback={fallback}
        animationType={animationType}
        showStatus={showStatus}
        status={status}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 truncate">{subtitle}</p>
        )}
      </div>
      {showRole && role && RoleIcon && (
        <RoleIcon className={cn('w-4 h-4 flex-shrink-0', roleConfig[role].color)} />
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLES:
 * 
 * // Current user badge
 * const { profile } = useUserProfile();
 * <UserBadge 
 *   name={profile.name}
 *   avatar={profile.avatar}
 *   showStatus
 *   status={profile.status}
 *   variant="detailed"
 *   subtitle="Online"
 * />
 * 
 * // Collaborator in task
 * <UserBadge 
 *   name="Sarah Chen"
 *   avatar="https://..."
 *   role="admin"
 *   showRole
 *   animationType="pulse"
 *   onClick={() => console.log('View profile')}
 * />
 * 
 * // Compact mention
 * <UserBadge 
 *   name="Marcus Johnson"
 *   avatar="https://..."
 *   variant="compact"
 * />
 */