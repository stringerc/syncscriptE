/**
 * useTeamResonance Hook (Phase 6D)
 * 
 * React hook for managing team resonance state and calculations.
 * Integrates with existing resonance system and team context.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Team } from '../types/team';
import {
  TeamResonanceScore,
  EventResonance,
  TeamResonanceInsight,
  ResonanceWave,
  calculateTeamResonance,
  calculateEventResonance,
  generateTeamResonanceInsights,
  generateResonanceWaves,
  getResonanceRecommendations,
} from '../utils/team-resonance-integration';
import { Event } from '../utils/event-task-types';

interface UseTeamResonanceReturn {
  // Team resonance state
  teamResonance: TeamResonanceScore | null;
  isLoading: boolean;
  
  // Calculate functions
  calculateResonance: (team: Team) => void;
  getEventResonance: (event: Event, team: Team) => EventResonance | null;
  
  // Insights
  insights: TeamResonanceInsight[];
  recommendations: string[];
  
  // Waves (time-series data)
  resonanceWaves: ResonanceWave[];
  
  // Refresh
  refresh: () => void;
}

export function useTeamResonance(teamId?: string): UseTeamResonanceReturn {
  const [teamResonance, setTeamResonance] = useState<TeamResonanceScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<TeamResonanceInsight[]>([]);
  const [resonanceWaves, setResonanceWaves] = useState<ResonanceWave[]>([]);

  // Mock member resonance scores (would come from actual resonance system)
  const getMemberResonanceScores = useCallback((): Map<string, number> => {
    const scores = new Map<string, number>();
    
    // Mock data - would fetch from actual resonance system
    scores.set('user-1', 85);
    scores.set('user-2', 72);
    scores.set('user-3', 68);
    scores.set('user-4', 91);
    scores.set('user-5', 78);
    scores.set('user-6', 45); // Low resonance member
    scores.set('user-7', 88);
    scores.set('user-8', 76);
    
    return scores;
  }, []);

  /**
   * Calculate team resonance for a given team
   */
  const calculateResonance = useCallback((team: Team) => {
    setIsLoading(true);
    
    try {
      const memberScores = getMemberResonanceScores();
      const resonance = calculateTeamResonance(team, memberScores);
      
      setTeamResonance(resonance);
      
      // Generate insights
      const generatedInsights = generateTeamResonanceInsights(resonance);
      setInsights(generatedInsights);
      
      // Generate waves
      const waves = generateResonanceWaves(team, memberScores, 7);
      setResonanceWaves(waves);
      
    } catch (error) {
      console.error('Failed to calculate team resonance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getMemberResonanceScores]);

  /**
   * Get resonance for a specific event
   */
  const getEventResonance = useCallback(
    (event: Event, team: Team): EventResonance | null => {
      try {
        const memberScores = getMemberResonanceScores();
        return calculateEventResonance(event, team, memberScores);
      } catch (error) {
        console.error('Failed to calculate event resonance:', error);
        return null;
      }
    },
    [getMemberResonanceScores]
  );

  /**
   * Refresh team resonance data
   */
  const refresh = useCallback(() => {
    if (teamResonance) {
      // Re-fetch would happen here
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [teamResonance]);

  // Calculate recommendations from team resonance
  const recommendations = useMemo(() => {
    if (!teamResonance) return [];
    return getResonanceRecommendations(teamResonance);
  }, [teamResonance]);

  return {
    teamResonance,
    isLoading,
    calculateResonance,
    getEventResonance,
    insights,
    recommendations,
    resonanceWaves,
    refresh,
  };
}
