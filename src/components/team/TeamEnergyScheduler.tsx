/**
 * Team Energy Scheduler Component (Phase 6C)
 * 
 * AI-powered scheduling interface that:
 * - Visualizes team energy curves throughout the day
 * - Suggests optimal meeting/event times
 * - Shows energy impact predictions
 * - Detects schedule conflicts
 * - Provides energy recovery recommendations
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  Coffee,
  Moon,
  Sun,
} from 'lucide-react';
import { Team } from '../../types/team';
import { EnergyState } from '../../utils/energy-system';
import {
  suggestOptimalTeamEventTime,
  calculateEventEnergyRequirement,
  canTeamHandleEvent,
  calculateTeamEnergyStats,
  TeamEnergySchedulingSuggestion,
} from '../../utils/team-energy-integration';
import { Event } from '../../utils/event-task-types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../ui/utils';

interface TeamEnergySchedulerProps {
  team: Team;
  memberEnergyStates: Map<string, EnergyState>;
  event?: Event; // Optional: event to schedule
  onScheduleSelected?: (time: Date) => void;
  className?: string;
}

export function TeamEnergyScheduler({
  team,
  memberEnergyStates,
  event,
  onScheduleSelected,
  className,
}: TeamEnergySchedulerProps) {
  const [selectedDuration, setSelectedDuration] = useState(60); // minutes
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<TeamEnergySchedulingSuggestion | null>(null);

  // Get scheduling suggestions
  const suggestions = useMemo(
    () => suggestOptimalTeamEventTime(team, memberEnergyStates, selectedDuration),
    [team, memberEnergyStates, selectedDuration]
  );

  // Calculate energy requirement for current event/duration
  const energyRequirement = useMemo(() => {
    if (event) {
      return calculateEventEnergyRequirement(event);
    }
    // Estimate based on duration
    return selectedDuration * 2;
  }, [event, selectedDuration]);

  // Check if team can handle the event
  const teamCapability = useMemo(() => {
    if (!event) return null;
    return canTeamHandleEvent(team, memberEnergyStates, event);
  }, [team, memberEnergyStates, event]);

  const teamStats = useMemo(
    () => calculateTeamEnergyStats(team, memberEnergyStates),
    [team, memberEnergyStates]
  );

  const handleSchedule = () => {
    if (selectedSuggestion && onScheduleSelected) {
      onScheduleSelected(selectedSuggestion.suggestedTime);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Energy-Based Scheduling
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Find the perfect time when your team has peak energy
          </p>
        </div>
        {selectedSuggestion && onScheduleSelected && (
          <Button onClick={handleSchedule} className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Schedule Event
          </Button>
        )}
      </div>

      {/* Duration Selector */}
      <Card className="bg-[#1e2128] border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-400">Event Duration</label>
          <div className="text-lg font-bold text-white">{selectedDuration} min</div>
        </div>
        <Slider
          value={[selectedDuration]}
          onValueChange={(value) => setSelectedDuration(value[0])}
          min={15}
          max={240}
          step={15}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>15 min</span>
          <span>4 hours</span>
        </div>
      </Card>

      {/* Energy Requirement vs Availability */}
      <Card className="bg-[#1e2128] border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Energy Analysis
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Required Energy</div>
            <div className="text-2xl font-bold text-white">
              {energyRequirement}
            </div>
            <div className="text-xs text-gray-500">For this event</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Available Energy</div>
            <div className="text-2xl font-bold text-white">
              {teamStats.totalEnergy}
            </div>
            <div className="text-xs text-gray-500">Team total</div>
          </div>
        </div>

        {teamCapability && (
          <div
            className={cn(
              'p-3 rounded-lg flex items-start gap-2',
              teamCapability.canHandle
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-amber-500/10 border border-amber-500/20'
            )}
          >
            {teamCapability.canHandle ? (
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-xs">
              <div
                className={cn(
                  'font-medium mb-1',
                  teamCapability.canHandle ? 'text-green-400' : 'text-amber-400'
                )}
              >
                {teamCapability.canHandle
                  ? 'Team has sufficient energy'
                  : 'Energy threshold warning'}
              </div>
              <div className="text-gray-400">{teamCapability.reason}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Team Energy Curve Visualization */}
      <Card className="bg-[#1e2128] border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Team Energy Throughout Day
        </h3>
        <TeamEnergyCurve teamStats={teamStats} />
      </Card>

      {/* Scheduling Suggestions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Recommended Times
        </h3>

        {suggestions.length === 0 ? (
          <Card className="bg-[#1e2128] border-gray-800 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              No optimal times found. Team energy may be too low.
            </p>
          </Card>
        ) : (
          suggestions.map((suggestion, idx) => (
            <SchedulingSuggestionCard
              key={idx}
              suggestion={suggestion}
              rank={idx + 1}
              isSelected={selectedSuggestion === suggestion}
              onSelect={() => setSelectedSuggestion(suggestion)}
            />
          ))
        )}
      </div>

      {/* Energy Recovery Tips */}
      {teamStats.burnoutRisk !== 'low' && (
        <Card className="bg-amber-500/5 border-amber-500/20 p-4">
          <div className="flex items-start gap-3">
            <Coffee className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Energy Recovery Recommended
              </h4>
              <p className="text-xs text-gray-400 mb-2">
                Team burnout risk is{' '}
                <span className="text-amber-400 font-medium">
                  {teamStats.burnoutRisk}
                </span>
                . Consider:
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Schedule breaks between meetings</li>
                <li>• Reduce meeting duration</li>
                <li>• Focus on async communication</li>
                <li>• Allow flexible work hours</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TeamEnergyCurve({ teamStats }: { teamStats: any }) {
  // Mock energy curve data - in production, use historical patterns
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const energyLevels = hours.map((hour) => {
    if (hour >= 9 && hour <= 11) return 0.9; // Morning peak
    if (hour >= 14 && hour <= 16) return 0.8; // Afternoon
    if (hour >= 12 && hour <= 13) return 0.5; // Lunch dip
    if (hour >= 17 || hour <= 7) return 0.2; // Off hours
    return 0.6; // Default
  });

  const currentHour = new Date().getHours();
  const maxEnergy = Math.max(...energyLevels);

  return (
    <div className="relative h-24">
      {/* Time of day indicators */}
      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <Moon className="w-3 h-3" />
          <span>Night</span>
        </div>
        <div className="flex items-center gap-1">
          <Sun className="w-3 h-3" />
          <span>Morning</span>
        </div>
        <div className="flex items-center gap-1">
          <Sun className="w-3 h-3" />
          <span>Afternoon</span>
        </div>
        <div className="flex items-center gap-1">
          <Moon className="w-3 h-3" />
          <span>Night</span>
        </div>
      </div>

      {/* Energy bars */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end gap-0.5">
        {energyLevels.map((level, hour) => (
          <TooltipProvider key={hour}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex-1 rounded-t transition-all cursor-pointer',
                    hour === currentHour
                      ? 'bg-blue-500'
                      : level > 0.7
                      ? 'bg-green-500/50'
                      : level > 0.4
                      ? 'bg-amber-500/50'
                      : 'bg-gray-700'
                  )}
                  style={{
                    height: `${(level / maxEnergy) * 100}%`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {hour}:00 - {Math.round(level * 100)}% energy
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

function SchedulingSuggestionCard({
  suggestion,
  rank,
  isSelected,
  onSelect,
}: {
  suggestion: TeamEnergySchedulingSuggestion;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const date = new Date(suggestion.suggestedTime);
  const isToday =
    date.toDateString() === new Date().toDateString();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card
        className={cn(
          'p-4 cursor-pointer transition-all border-2',
          isSelected
            ? 'bg-blue-500/10 border-blue-500'
            : 'bg-[#1e2128] border-gray-800 hover:border-gray-700'
        )}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                rank === 1
                  ? 'bg-amber-500 text-white'
                  : rank === 2
                  ? 'bg-gray-400 text-white'
                  : rank === 3
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              )}
            >
              {rank}
            </div>
            <div>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                {date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {isToday && (
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              suggestion.confidence > 80
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            )}
          >
            {suggestion.confidence}% match
          </Badge>
        </div>

        <p className="text-xs text-gray-400 mb-3">{suggestion.reason}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-white font-medium">
                {suggestion.expectedTeamEnergy}
              </span>
            </div>
            <Badge
              style={{ backgroundColor: suggestion.expectedColorLevel.color }}
              className="text-white border-0 text-xs"
            >
              {suggestion.expectedColorLevel.name}
            </Badge>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {suggestion.availableMembers.length} available
              </span>
            </div>
          </div>

          {isSelected && (
            <CheckCircle className="w-4 h-4 text-blue-400" />
          )}
        </div>

        {/* Energy Forecast */}
        {isSelected && suggestion.energyForecast && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-400 mb-2">Member Energy Forecast</div>
            <div className="flex gap-2">
              {suggestion.energyForecast.high.length > 0 && (
                <Badge className="bg-green-500/20 text-green-400 text-xs">
                  {suggestion.energyForecast.high.length} high
                </Badge>
              )}
              {suggestion.energyForecast.medium.length > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                  {suggestion.energyForecast.medium.length} medium
                </Badge>
              )}
              {suggestion.energyForecast.low.length > 0 && (
                <Badge className="bg-red-500/20 text-red-400 text-xs">
                  {suggestion.energyForecast.low.length} low
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
