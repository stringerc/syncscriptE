/**
 * PHASE 2.2: Team Event Assignment Component
 * 
 * UI for assigning teams to Primary Events
 * Supports:
 * - Team selection dropdown
 * - Team info preview
 * - Team member display
 * - Integration with event creation/editing flows
 */

import React from 'react';
import { useTeam } from '../../contexts/TeamContext';
import { Event } from '../../utils/event-task-types';
import { Users, Check } from 'lucide-react';

interface TeamEventAssignmentProps {
  event: Event | null;
  onTeamSelect: (teamId: string | null) => void;
  selectedTeamId?: string | null;
  className?: string;
}

export function TeamEventAssignment({
  event,
  onTeamSelect,
  selectedTeamId,
  className = '',
}: TeamEventAssignmentProps) {
  const { teams } = useTeam();

  // Find selected team
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-neutral-300">
        Assign Team (Optional)
      </label>
      
      <div className="space-y-2">
        {/* Team Selection Dropdown */}
        <select
          value={selectedTeamId || ''}
          onChange={(e) => onTeamSelect(e.target.value || null)}
          className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        >
          <option value="">No team (Personal event)</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>
              {team.icon} {team.name} ({team.memberCount} members)
            </option>
          ))}
        </select>

        {/* Selected Team Preview */}
        {selectedTeam && (
          <div className="p-3 bg-neutral-800/30 border border-neutral-700/50 rounded-lg">
            <div className="flex items-start gap-3">
              {/* Team Icon */}
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: selectedTeam.color + '20', color: selectedTeam.color }}
              >
                {selectedTeam.icon || <Users className="w-5 h-5" />}
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-neutral-100">
                    {selectedTeam.name}
                  </h4>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-700/50 text-neutral-400">
                    {selectedTeam.memberCount} members
                  </span>
                </div>
                
                {selectedTeam.description && (
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2">
                    {selectedTeam.description}
                  </p>
                )}

                {/* Team Members Preview */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {selectedTeam.members.slice(0, 5).map((member, index) => (
                      <div
                        key={member.userId}
                        className="w-6 h-6 rounded-full bg-neutral-700 border-2 border-neutral-800 flex items-center justify-center text-[10px] font-medium text-neutral-300"
                        title={member.name}
                        style={{ zIndex: 10 - index }}
                      >
                        {member.fallback}
                      </div>
                    ))}
                  </div>
                  {selectedTeam.memberCount > 5 && (
                    <span className="text-xs text-neutral-500">
                      +{selectedTeam.memberCount - 5} more
                    </span>
                  )}
                </div>

                {/* Team Stats */}
                <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                  <span>{selectedTeam.stats.activeEvents} active events</span>
                  <span>•</span>
                  <span>{selectedTeam.stats.completedEvents} completed</span>
                </div>
              </div>

              {/* Selected Checkmark */}
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Helper Text */}
        <p className="text-xs text-neutral-500">
          {selectedTeam 
            ? 'All team members will be added to this event and can collaborate.'
            : 'Assign a team to enable collaboration and shared energy tracking.'}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact version for inline use (e.g., in event cards)
 */
export function TeamEventBadge({ event, onClick }: { event: Event; onClick?: () => void }) {
  const { teams } = useTeam();
  const team = teams.find(t => t.id === event.teamId);

  if (!team) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-neutral-700/50"
      style={{ backgroundColor: team.color + '15', color: team.color }}
    >
      {team.icon && <span>{team.icon}</span>}
      <Users className="w-3 h-3" />
      <span>{team.name}</span>
      <span className="text-neutral-400">({team.memberCount})</span>
    </button>
  );
}
