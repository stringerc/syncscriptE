/**
 * TeamEnergyDashboard Wrapper Component (Phase 6C)
 * 
 * Wrapper that handles fetching team member energy states
 * and passes them to the TeamEnergyDashboard component.
 * 
 * In production, this would fetch from a backend.
 * For MVP, we simulate with mock data.
 */

import { useMemo } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import { useEnergy } from '../../contexts/EnergyContext';
import { EnergyState, COLOR_LEVELS } from '../../utils/energy-system';
import { TeamEnergyDashboard as TeamEnergyDashboardCore } from './TeamEnergyDashboard';

interface TeamEnergyDashboardWrapperProps {
  teamId: string;
}

export function TeamEnergyDashboard({ teamId }: TeamEnergyDashboardWrapperProps) {
  const { teams } = useTeam();
  const { energy: currentUserEnergy } = useEnergy();

  const team = teams.find((t) => t.id === teamId);

  // Create a map of member energy states
  // In production, this would fetch from backend for each team member
  // For now, we'll mock it with variations of current user's energy
  const memberEnergyStates = useMemo(() => {
    if (!team) return new Map<string, EnergyState>();

    const states = new Map<string, EnergyState>();
    const CURRENT_USER_ID = 'user-1';

    team.members.forEach((member, idx) => {
      if (member.userId === CURRENT_USER_ID) {
        // Use actual current user energy
        states.set(member.userId, currentUserEnergy);
      } else {
        // Mock energy for other team members
        // Create realistic variations
        const variation = 0.5 + Math.random(); // 50-150% of current user
        const memberEnergy = Math.round(currentUserEnergy.totalEnergy * variation);
        
        // Find appropriate color level
        let colorIndex = 0;
        let currentColor = COLOR_LEVELS[0];
        for (let i = COLOR_LEVELS.length - 1; i >= 0; i--) {
          if (memberEnergy >= COLOR_LEVELS[i].energyRequired) {
            colorIndex = i;
            currentColor = COLOR_LEVELS[i];
            break;
          }
        }

        // Calculate progress to next color
        const nextColorThreshold =
          colorIndex < COLOR_LEVELS.length - 1
            ? COLOR_LEVELS[colorIndex + 1].energyRequired
            : 1000;
        const progressToNextColor =
          colorIndex < COLOR_LEVELS.length - 1
            ? ((memberEnergy - currentColor.energyRequired) /
                (nextColorThreshold - currentColor.energyRequired)) *
              100
            : 100;

        // Distribute energy by source (realistic proportions)
        const bySource = {
          tasks: Math.round(memberEnergy * 0.3),
          goals: Math.round(memberEnergy * 0.2),
          milestones: Math.round(memberEnergy * 0.15),
          achievements: Math.round(memberEnergy * 0.1),
          health: Math.round(memberEnergy * 0.1),
          events: Math.round(memberEnergy * 0.1),
          steps: Math.round(memberEnergy * 0.05),
        };

        // Create last activity with some variation (0-8 hours ago)
        const hoursAgo = Math.random() * 8;
        const lastActivity = new Date(
          Date.now() - hoursAgo * 60 * 60 * 1000
        );

        states.set(member.userId, {
          totalEnergy: memberEnergy,
          entries: [], // Mock - would have actual entries
          lastReset: new Date(),
          lastActivity,
          displayMode: 'points',
          bySource,
          currentColor,
          colorIndex,
          progressToNextColor,
          auraCount: Math.floor(memberEnergy / 700),
          currentAuraColor: COLOR_LEVELS[Math.floor(memberEnergy / 700) % 7],
          auraIndex: Math.floor(memberEnergy / 700) % 7,
          dailyHistory: [],
          completionLoops: 0,
          currentLoopProgress: 0,
        });
      }
    });

    return states;
  }, [team, currentUserEnergy]);

  if (!team) {
    return (
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-400">Team not found</p>
      </div>
    );
  }

  return (
    <TeamEnergyDashboardCore
      team={team}
      memberEnergyStates={memberEnergyStates}
      teamEvents={[]} // Would pass actual team events
    />
  );
}
