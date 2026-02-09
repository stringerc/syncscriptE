/**
 * useTeamScripts Hook (Phase 6B)
 * 
 * React hook for managing team scripts and marketplace operations.
 * Handles script creation, usage tracking, and marketplace interactions.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner@2.0.3';
import { Event } from '../utils/event-task-types';
import { Team } from '../types/team';
import {
  TeamScript,
  ScriptMarketplaceFilters,
  ScriptVisibility,
  ScriptPricing,
  convertEventToScript,
  applyScriptToTeam,
  searchMarketplaceScripts,
  getTeamScripts,
  getUserScripts,
  getUserCollaboratedScripts,
  canUserEditScript,
  canUserDeleteScript,
  addScriptCollaborator,
} from '../utils/team-script-integration';

interface UseTeamScriptsReturn {
  // State
  scripts: TeamScript[];
  
  // Script creation
  createScriptFromEvent: (
    event: Event,
    team: Team,
    options: {
      name: string;
      description: string;
      category: string;
      visibility: ScriptVisibility;
      pricing: ScriptPricing;
      price?: number;
    }
  ) => TeamScript | null;
  
  // Script usage
  applyScript: (
    script: TeamScript,
    team: Team,
    customizations?: {
      startDate?: Date;
      assignedMembers?: string[];
      customValues?: Record<string, any>;
    }
  ) => Event[] | null;
  
  // Script management
  updateScript: (scriptId: string, updates: Partial<TeamScript>) => void;
  deleteScript: (scriptId: string) => void;
  favoriteScript: (scriptId: string) => void;
  unfavoriteScript: (scriptId: string) => void;
  
  // Marketplace
  searchScripts: (filters: ScriptMarketplaceFilters) => TeamScript[];
  getTeamScripts: (teamId: string) => TeamScript[];
  getMyScripts: () => TeamScript[];
  getCollaboratedScripts: () => TeamScript[];
  getFavoriteScripts: () => TeamScript[];
  
  // Collaboration
  addCollaborator: (
    scriptId: string,
    userId: string,
    userName: string,
    contributionPercentage: number
  ) => void;
  
  // Permissions
  canEdit: (scriptId: string) => boolean;
  canDelete: (scriptId: string) => boolean;
}

const STORAGE_KEY = 'syncscript_team_scripts_v1';
const FAVORITES_KEY = 'syncscript_favorite_scripts_v1';
const CURRENT_USER_ID = 'user-1'; // Mock current user

export function useTeamScripts(): UseTeamScriptsReturn {
  // Load scripts from localStorage
  const [scripts, setScripts] = useState<TeamScript[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          collaborators: s.collaborators.map((c: any) => ({
            ...c,
            addedAt: new Date(c.addedAt),
          })),
        }));
      }
    } catch (e) {
      console.error('Failed to load team scripts:', e);
    }
    return [];
  });

  // Load favorites
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
    return new Set();
  });

  // Persist scripts to localStorage
  const persistScripts = useCallback((updatedScripts: TeamScript[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedScripts));
      setScripts(updatedScripts);
    } catch (e) {
      console.error('Failed to save team scripts:', e);
      toast.error('Failed to save script');
    }
  }, []);

  // Persist favorites
  const persistFavorites = useCallback((updatedFavorites: Set<string>) => {
    try {
      localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(Array.from(updatedFavorites))
      );
      setFavoriteIds(updatedFavorites);
    } catch (e) {
      console.error('Failed to save favorites:', e);
    }
  }, []);

  // Create script from event
  const createScriptFromEvent = useCallback(
    (
      event: Event,
      team: Team,
      options: {
        name: string;
        description: string;
        category: string;
        visibility: ScriptVisibility;
        pricing: ScriptPricing;
        price?: number;
      }
    ): TeamScript | null => {
      try {
        const script = convertEventToScript(
          event,
          team,
          CURRENT_USER_ID,
          options
        );

        const updated = [...scripts, script];
        persistScripts(updated);

        toast.success('Script created successfully!', {
          description: `"${script.name}" is now available in your team scripts.`,
        });

        return script;
      } catch (error) {
        console.error('Failed to create script:', error);
        toast.error('Failed to create script');
        return null;
      }
    },
    [scripts, persistScripts]
  );

  // Apply script to team
  const applyScript = useCallback(
    (
      script: TeamScript,
      team: Team,
      customizations?: {
        startDate?: Date;
        assignedMembers?: string[];
        customValues?: Record<string, any>;
      }
    ): Event[] | null => {
      try {
        const events = applyScriptToTeam(
          script,
          team,
          CURRENT_USER_ID,
          customizations
        );

        // Update usage count
        const updated = scripts.map(s =>
          s.id === script.id
            ? {
                ...s,
                usageCount: s.usageCount + 1,
                uniqueUsers: s.uniqueUsers + 1, // Simplified
              }
            : s
        );
        persistScripts(updated);

        toast.success('Script applied!', {
          description: `Created ${events.length} event(s) from "${script.name}"`,
        });

        return events;
      } catch (error) {
        console.error('Failed to apply script:', error);
        toast.error('Failed to apply script');
        return null;
      }
    },
    [scripts, persistScripts]
  );

  // Update script
  const updateScript = useCallback(
    (scriptId: string, updates: Partial<TeamScript>) => {
      const updated = scripts.map(s =>
        s.id === scriptId
          ? { ...s, ...updates, updatedAt: new Date() }
          : s
      );
      persistScripts(updated);
      toast.success('Script updated');
    },
    [scripts, persistScripts]
  );

  // Delete script
  const deleteScript = useCallback(
    (scriptId: string) => {
      const script = scripts.find(s => s.id === scriptId);
      if (!script) return;

      if (!canUserDeleteScript(script, CURRENT_USER_ID)) {
        toast.error('You do not have permission to delete this script');
        return;
      }

      const updated = scripts.filter(s => s.id !== scriptId);
      persistScripts(updated);
      toast.success('Script deleted');
    },
    [scripts, persistScripts]
  );

  // Favorite script
  const favoriteScript = useCallback(
    (scriptId: string) => {
      const updated = new Set(favoriteIds);
      updated.add(scriptId);
      persistFavorites(updated);

      // Update favorite count
      const updatedScripts = scripts.map(s =>
        s.id === scriptId ? { ...s, favorites: s.favorites + 1 } : s
      );
      persistScripts(updatedScripts);

      toast.success('Added to favorites');
    },
    [favoriteIds, scripts, persistFavorites, persistScripts]
  );

  // Unfavorite script
  const unfavoriteScript = useCallback(
    (scriptId: string) => {
      const updated = new Set(favoriteIds);
      updated.delete(scriptId);
      persistFavorites(updated);

      // Update favorite count
      const updatedScripts = scripts.map(s =>
        s.id === scriptId ? { ...s, favorites: Math.max(0, s.favorites - 1) } : s
      );
      persistScripts(updatedScripts);

      toast.success('Removed from favorites');
    },
    [favoriteIds, scripts, persistFavorites, persistScripts]
  );

  // Search scripts
  const searchScripts = useCallback(
    (filters: ScriptMarketplaceFilters): TeamScript[] => {
      return searchMarketplaceScripts(scripts, filters, CURRENT_USER_ID);
    },
    [scripts]
  );

  // Get team scripts
  const getTeamScriptsForTeam = useCallback(
    (teamId: string): TeamScript[] => {
      return getTeamScripts(scripts, teamId);
    },
    [scripts]
  );

  // Get user's created scripts
  const getMyScripts = useCallback((): TeamScript[] => {
    return getUserScripts(scripts, CURRENT_USER_ID);
  }, [scripts]);

  // Get collaborated scripts
  const getCollaboratedScripts = useCallback((): TeamScript[] => {
    return getUserCollaboratedScripts(scripts, CURRENT_USER_ID);
  }, [scripts]);

  // Get favorite scripts
  const getFavoriteScripts = useCallback((): TeamScript[] => {
    return scripts.filter(s => favoriteIds.has(s.id));
  }, [scripts, favoriteIds]);

  // Add collaborator
  const addCollaborator = useCallback(
    (
      scriptId: string,
      userId: string,
      userName: string,
      contributionPercentage: number
    ) => {
      const script = scripts.find(s => s.id === scriptId);
      if (!script) return;

      if (!canUserEditScript(script, CURRENT_USER_ID)) {
        toast.error('You do not have permission to add collaborators');
        return;
      }

      const updatedScript = addScriptCollaborator(
        script,
        userId,
        userName,
        'collaborator',
        contributionPercentage
      );

      const updated = scripts.map(s => (s.id === scriptId ? updatedScript : s));
      persistScripts(updated);

      toast.success(`Added ${userName} as collaborator`);
    },
    [scripts, persistScripts]
  );

  // Check edit permission
  const canEdit = useCallback(
    (scriptId: string): boolean => {
      const script = scripts.find(s => s.id === scriptId);
      return script ? canUserEditScript(script, CURRENT_USER_ID) : false;
    },
    [scripts]
  );

  // Check delete permission
  const canDelete = useCallback(
    (scriptId: string): boolean => {
      const script = scripts.find(s => s.id === scriptId);
      return script ? canUserDeleteScript(script, CURRENT_USER_ID) : false;
    },
    [scripts]
  );

  return {
    scripts,
    createScriptFromEvent,
    applyScript,
    updateScript,
    deleteScript,
    favoriteScript,
    unfavoriteScript,
    searchScripts,
    getTeamScripts: getTeamScriptsForTeam,
    getMyScripts,
    getCollaboratedScripts,
    getFavoriteScripts,
    addCollaborator,
    canEdit,
    canDelete,
  };
}
