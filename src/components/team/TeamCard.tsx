import { Users, Zap, Crown, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { Team } from '../../types/team';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TeamCardProps {
  team: Team;
  currentUserId: string;
  onClick: () => void;
}

/**
 * TeamCard Component
 * 
 * Displays a team summary card with:
 * - Team name and color
 * - Member count
 * - Energy stats
 * - User's role badge
 * - Quick stats
 */
export function TeamCard({ team, currentUserId, onClick }: TeamCardProps) {
  const currentMember = team.members.find(m => m.userId === currentUserId);
  const isOwner = currentMember?.role === 'owner';
  const isAdmin = currentMember?.role === 'admin';

  const roleIcon = isOwner ? Crown : isAdmin ? Shield : Users;
  const roleColor = isOwner ? 'text-amber-400' : isAdmin ? 'text-purple-400' : 'text-gray-400';
  const roleBadgeColor = isOwner 
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
    : isAdmin
    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    : 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  const RoleIcon = roleIcon;

  return (
    <div
      onClick={onClick}
      className="bg-[#1e2128] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Team Color Indicator */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${team.color}20`, borderColor: `${team.color}40`, borderWidth: 1 }}
          >
            <Users 
              className="w-5 h-5" 
              style={{ color: team.color }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                {team.name}
              </h3>
            </div>
            {team.description && (
              <p className="text-xs text-gray-500 truncate">{team.description}</p>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-gray-400">Members</span>
          </div>
          <div className="text-sm font-semibold text-white">{team.memberCount}</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-gray-400">Energy</span>
          </div>
          <div className="text-sm font-semibold text-white">
            {team.energyStats.totalEnergyEarned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={roleBadgeColor}>
          <RoleIcon className={`w-3 h-3 ${roleColor} mr-1`} />
          {currentMember?.role || 'Member'}
        </Badge>

        {currentMember && currentMember.stats.energyContributed > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3" />
            <span>+{currentMember.stats.energyContributed}</span>
          </div>
        )}
      </div>
    </div>
  );
}
