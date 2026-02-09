/**
 * Team Script Integration Utilities (Phase 6B)
 * 
 * Converts team event hierarchies into reusable script templates.
 * Enables marketplace sharing, permissions, versioning, and analytics.
 * 
 * Features:
 * - Convert team events to scripts with full hierarchy
 * - Team-based permissions (view/edit/use/fork)
 * - Marketplace integration (public/private/team-only)
 * - Usage tracking and analytics per team member
 * - Revenue sharing for paid scripts
 * - Script versioning and updates
 * - Collaborative script editing
 */

import { Event, EventHierarchyType } from './event-task-types';
import { Team, TeamMember } from '../types/team';

// ============================================================================
// TYPES
// ============================================================================

export type ScriptVisibility = 'public' | 'private' | 'team-only' | 'unlisted';
export type ScriptPricing = 'free' | 'paid' | 'premium';
export type ScriptRole = 'creator' | 'collaborator' | 'viewer' | 'user';

export interface TeamScript {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Team information
  teamId: string;
  teamName: string;
  creatorId: string;
  creatorName: string;
  collaborators: ScriptCollaborator[];
  
  // Script content (serialized event hierarchy)
  eventHierarchy: SerializedEventHierarchy;
  
  // Metadata
  version: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  thumbnail?: string;
  
  // Permissions
  visibility: ScriptVisibility;
  permissions: ScriptPermissions;
  
  // Marketplace
  pricing: ScriptPricing;
  price?: number; // in credits/currency
  revenueShare: RevenueShare[];
  
  // Analytics
  usageCount: number;
  uniqueUsers: number;
  rating: number;
  reviewCount: number;
  favorites: number;
  
  // Energy requirements (from Phase 6C)
  energyRequirement?: number;
  recommendedTeamSize?: { min: number; max: number };
  estimatedDuration?: number; // minutes
  
  // Additional metadata
  isVerified?: boolean; // Verified by platform
  isFeatured?: boolean; // Featured in marketplace
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

export interface ScriptCollaborator {
  userId: string;
  userName: string;
  role: ScriptRole;
  contributionPercentage: number; // For revenue sharing
  addedAt: Date;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canShare: boolean;
    canViewAnalytics: boolean;
  };
}

export interface ScriptPermissions {
  allowFork: boolean; // Can others create copies?
  allowCustomization: boolean; // Can users modify before applying?
  requireAttribution: boolean; // Must credit original authors?
  allowCommercialUse: boolean; // Can be used for commercial purposes?
  teamMembersOnly: boolean; // Only team members can use?
}

export interface RevenueShare {
  userId: string;
  userName: string;
  percentage: number; // 0-100
  reason: 'creator' | 'collaborator' | 'contributor';
}

export interface SerializedEventHierarchy {
  primaryEvent: SerializedEvent;
  milestones: SerializedMilestone[];
  totalEvents: number;
  totalTasks: number;
  complexity: number; // 0-100
}

export interface SerializedEvent {
  // Core properties (placeholders for customization)
  title: string;
  description: string;
  duration: number;
  color: string;
  category: string;
  
  // Hierarchy information
  hierarchyType: EventHierarchyType;
  depth: number;
  
  // Resources and notes (template format)
  hasResources: boolean;
  hasNotes: boolean;
  hasLinks: boolean;
  
  // Metadata
  tags: string[];
  requiredRoles?: string[]; // Team roles needed
}

export interface SerializedMilestone extends SerializedEvent {
  steps: SerializedEvent[];
  milestoneIndex: number;
}

export interface ScriptUsageRecord {
  id: string;
  scriptId: string;
  userId: string;
  userName: string;
  teamId: string;
  usedAt: Date;
  success: boolean;
  feedback?: string;
  customizations?: Record<string, any>;
}

export interface ScriptReview {
  id: string;
  scriptId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  helpful: number; // Helpful votes
  verified: boolean; // Verified purchase/usage
}

export interface ScriptMarketplaceFilters {
  category?: string;
  pricing?: ScriptPricing;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  minRating?: number;
  teamSize?: { min: number; max: number };
  energyRequirement?: { min: number; max: number };
  tags?: string[];
  searchQuery?: string;
}

// ============================================================================
// CONVERSION: EVENT HIERARCHY → SCRIPT
// ============================================================================

/**
 * Convert a team event hierarchy to a reusable script template
 */
export function convertEventToScript(
  event: Event,
  team: Team,
  creatorId: string,
  options: {
    name: string;
    description: string;
    category: string;
    visibility: ScriptVisibility;
    pricing: ScriptPricing;
    price?: number;
  }
): TeamScript {
  // Serialize the event hierarchy
  const hierarchy = serializeEventHierarchy(event);
  
  // Calculate energy requirement (if available)
  const energyRequirement = calculateScriptEnergyRequirement(hierarchy);
  
  // Determine recommended team size
  const recommendedTeamSize = calculateRecommendedTeamSize(hierarchy);
  
  // Estimate duration
  const estimatedDuration = calculateScriptDuration(hierarchy);
  
  // Find creator info
  const creator = team.members.find(m => m.userId === creatorId);
  
  return {
    id: generateScriptId(),
    name: options.name,
    description: options.description,
    category: options.category,
    
    teamId: team.id,
    teamName: team.name,
    creatorId,
    creatorName: creator?.name || 'Unknown',
    collaborators: [
      {
        userId: creatorId,
        userName: creator?.name || 'Unknown',
        role: 'creator',
        contributionPercentage: 100,
        addedAt: new Date(),
        permissions: {
          canEdit: true,
          canDelete: true,
          canShare: true,
          canViewAnalytics: true,
        },
      },
    ],
    
    eventHierarchy: hierarchy,
    
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: extractTags(event),
    
    visibility: options.visibility,
    permissions: {
      allowFork: true,
      allowCustomization: true,
      requireAttribution: true,
      allowCommercialUse: options.pricing !== 'free',
      teamMembersOnly: options.visibility === 'team-only',
    },
    
    pricing: options.pricing,
    price: options.price,
    revenueShare: [
      {
        userId: creatorId,
        userName: creator?.name || 'Unknown',
        percentage: 100,
        reason: 'creator',
      },
    ],
    
    usageCount: 0,
    uniqueUsers: 0,
    rating: 0,
    reviewCount: 0,
    favorites: 0,
    
    energyRequirement,
    recommendedTeamSize,
    estimatedDuration,
    
    complexity: determineComplexity(hierarchy),
  };
}

/**
 * Serialize event hierarchy into template format
 */
function serializeEventHierarchy(event: Event): SerializedEventHierarchy {
  const primaryEvent = serializeEvent(event, 0);
  const milestones = (event.milestones || []).map((milestone, idx) => 
    serializeMilestone(milestone, idx)
  );
  
  const totalEvents = 1 + milestones.length + 
    milestones.reduce((sum, m) => sum + m.steps.length, 0);
  
  const totalTasks = event.associatedTasks?.length || 0;
  
  const complexity = calculateHierarchyComplexity(event);
  
  return {
    primaryEvent,
    milestones,
    totalEvents,
    totalTasks,
    complexity,
  };
}

function serializeEvent(event: Event, depth: number): SerializedEvent {
  return {
    title: event.title,
    description: event.description || '',
    duration: event.duration || 60,
    color: event.color,
    category: event.category || 'general',
    hierarchyType: event.hierarchyType || 'primary',
    depth,
    hasResources: (event.resources?.length || 0) > 0,
    hasNotes: (event.linksNotes?.filter(ln => ln.type === 'note').length || 0) > 0,
    hasLinks: (event.linksNotes?.filter(ln => ln.type === 'link').length || 0) > 0,
    tags: event.tags || [],
    requiredRoles: event.assignedTo || [],
  };
}

function serializeMilestone(
  milestone: Event,
  milestoneIndex: number
): SerializedMilestone {
  const base = serializeEvent(milestone, 1);
  const steps = (milestone.children || []).map(step => serializeEvent(step, 2));
  
  return {
    ...base,
    steps,
    milestoneIndex,
  };
}

// ============================================================================
// SCRIPT APPLICATION: APPLY SCRIPT TO TEAM
// ============================================================================

/**
 * Apply a script template to create actual events for a team
 */
export function applyScriptToTeam(
  script: TeamScript,
  team: Team,
  userId: string,
  customizations?: {
    startDate?: Date;
    assignedMembers?: string[];
    customValues?: Record<string, any>;
  }
): Event[] {
  const events: Event[] = [];
  
  // Create primary event
  const primaryEvent = deserializeEvent(
    script.eventHierarchy.primaryEvent,
    team.id,
    customizations
  );
  
  // Create milestones
  if (script.eventHierarchy.milestones.length > 0) {
    primaryEvent.milestones = script.eventHierarchy.milestones.map(
      (milestone, idx) => {
        const milestoneEvent = deserializeEvent(
          milestone,
          team.id,
          customizations
        );
        
        // Create steps
        if (milestone.steps.length > 0) {
          milestoneEvent.children = milestone.steps.map(step =>
            deserializeEvent(step, team.id, customizations)
          );
        }
        
        return milestoneEvent;
      }
    );
  }
  
  events.push(primaryEvent);
  
  // Track usage
  trackScriptUsage(script.id, userId, team.id, true);
  
  return events;
}

function deserializeEvent(
  serialized: SerializedEvent,
  teamId: string,
  customizations?: any
): Event {
  const now = new Date();
  const startDate = customizations?.startDate || now;
  
  return {
    id: generateEventId(),
    title: serialized.title,
    description: serialized.description,
    start: startDate,
    end: new Date(startDate.getTime() + serialized.duration * 60000),
    duration: serialized.duration,
    color: serialized.color,
    category: serialized.category,
    hierarchyType: serialized.hierarchyType,
    teamId,
    assignedTo: customizations?.assignedMembers || [],
    tags: serialized.tags,
    resources: [],
    linksNotes: [],
    associatedTasks: [],
    isScheduled: false, // User can schedule after creation
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// MARKETPLACE OPERATIONS
// ============================================================================

/**
 * Search scripts in marketplace with filters
 */
export function searchMarketplaceScripts(
  allScripts: TeamScript[],
  filters: ScriptMarketplaceFilters,
  currentUserId: string
): TeamScript[] {
  let filtered = allScripts;
  
  // Apply visibility filter (user can only see public, their team's, or their own)
  filtered = filtered.filter(script => {
    if (script.visibility === 'public') return true;
    if (script.visibility === 'unlisted') return false;
    if (script.creatorId === currentUserId) return true;
    // Check if user is in the team
    return script.visibility === 'team-only' && isUserInTeam(currentUserId, script.teamId);
  });
  
  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(s => s.category === filters.category);
  }
  
  // Pricing filter
  if (filters.pricing) {
    filtered = filtered.filter(s => s.pricing === filters.pricing);
  }
  
  // Complexity filter
  if (filters.complexity) {
    filtered = filtered.filter(s => s.complexity === filters.complexity);
  }
  
  // Rating filter
  if (filters.minRating) {
    filtered = filtered.filter(s => s.rating >= filters.minRating);
  }
  
  // Team size filter
  if (filters.teamSize) {
    filtered = filtered.filter(s => {
      if (!s.recommendedTeamSize) return true;
      return (
        s.recommendedTeamSize.min >= filters.teamSize!.min &&
        s.recommendedTeamSize.max <= filters.teamSize!.max
      );
    });
  }
  
  // Energy requirement filter
  if (filters.energyRequirement) {
    filtered = filtered.filter(s => {
      if (!s.energyRequirement) return true;
      return (
        s.energyRequirement >= filters.energyRequirement!.min &&
        s.energyRequirement <= filters.energyRequirement!.max
      );
    });
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(s =>
      filters.tags!.some(tag => s.tags.includes(tag))
    );
  }
  
  // Search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  // Sort by relevance (rating * usage)
  filtered.sort((a, b) => {
    const scoreA = a.rating * Math.log(a.usageCount + 1);
    const scoreB = b.rating * Math.log(b.usageCount + 1);
    return scoreB - scoreA;
  });
  
  return filtered;
}

/**
 * Get team scripts by team ID
 */
export function getTeamScripts(
  allScripts: TeamScript[],
  teamId: string
): TeamScript[] {
  return allScripts.filter(s => s.teamId === teamId);
}

/**
 * Get user's created scripts
 */
export function getUserScripts(
  allScripts: TeamScript[],
  userId: string
): TeamScript[] {
  return allScripts.filter(s => s.creatorId === userId);
}

/**
 * Get scripts user collaborated on
 */
export function getUserCollaboratedScripts(
  allScripts: TeamScript[],
  userId: string
): TeamScript[] {
  return allScripts.filter(s =>
    s.collaborators.some(c => c.userId === userId && c.role !== 'creator')
  );
}

// ============================================================================
// PERMISSIONS & COLLABORATION
// ============================================================================

/**
 * Check if user can edit script
 */
export function canUserEditScript(
  script: TeamScript,
  userId: string
): boolean {
  const collaborator = script.collaborators.find(c => c.userId === userId);
  return collaborator?.permissions.canEdit || false;
}

/**
 * Check if user can delete script
 */
export function canUserDeleteScript(
  script: TeamScript,
  userId: string
): boolean {
  const collaborator = script.collaborators.find(c => c.userId === userId);
  return collaborator?.permissions.canDelete || false;
}

/**
 * Check if user can view analytics
 */
export function canUserViewAnalytics(
  script: TeamScript,
  userId: string
): boolean {
  const collaborator = script.collaborators.find(c => c.userId === userId);
  return collaborator?.permissions.canViewAnalytics || false;
}

/**
 * Add collaborator to script
 */
export function addScriptCollaborator(
  script: TeamScript,
  userId: string,
  userName: string,
  role: ScriptRole,
  contributionPercentage: number
): TeamScript {
  const newCollaborator: ScriptCollaborator = {
    userId,
    userName,
    role,
    contributionPercentage,
    addedAt: new Date(),
    permissions: {
      canEdit: role === 'collaborator',
      canDelete: false,
      canShare: role === 'collaborator',
      canViewAnalytics: role === 'collaborator',
    },
  };
  
  // Adjust existing revenue shares
  const totalReduction = contributionPercentage;
  const existingTotal = script.revenueShare.reduce((sum, r) => sum + r.percentage, 0);
  
  script.revenueShare = script.revenueShare.map(r => ({
    ...r,
    percentage: (r.percentage / existingTotal) * (100 - totalReduction),
  }));
  
  // Add new revenue share
  script.revenueShare.push({
    userId,
    userName,
    percentage: contributionPercentage,
    reason: 'collaborator',
  });
  
  return {
    ...script,
    collaborators: [...script.collaborators, newCollaborator],
    updatedAt: new Date(),
  };
}

// ============================================================================
// ANALYTICS & TRACKING
// ============================================================================

/**
 * Track script usage
 */
export function trackScriptUsage(
  scriptId: string,
  userId: string,
  teamId: string,
  success: boolean
): void {
  const record: ScriptUsageRecord = {
    id: generateUsageId(),
    scriptId,
    userId,
    userName: 'User', // Would fetch from context
    teamId,
    usedAt: new Date(),
    success,
  };
  
  // In production, this would save to database
  console.log('Script usage tracked:', record);
}

/**
 * Get script analytics
 */
export function getScriptAnalytics(
  script: TeamScript,
  usageRecords: ScriptUsageRecord[]
): {
  totalUsage: number;
  uniqueUsers: number;
  successRate: number;
  usageByTeam: Record<string, number>;
  usageTrend: { date: string; count: number }[];
  popularTimes: { hour: number; count: number }[];
} {
  const scriptRecords = usageRecords.filter(r => r.scriptId === script.id);
  
  const totalUsage = scriptRecords.length;
  const uniqueUsers = new Set(scriptRecords.map(r => r.userId)).size;
  const successRate = scriptRecords.filter(r => r.success).length / totalUsage * 100 || 0;
  
  // Usage by team
  const usageByTeam: Record<string, number> = {};
  scriptRecords.forEach(r => {
    usageByTeam[r.teamId] = (usageByTeam[r.teamId] || 0) + 1;
  });
  
  // Usage trend (last 30 days)
  const usageTrend: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = scriptRecords.filter(r =>
      r.usedAt.toISOString().split('T')[0] === dateStr
    ).length;
    usageTrend.push({ date: dateStr, count });
  }
  
  // Popular times
  const popularTimes: { hour: number; count: number }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const count = scriptRecords.filter(r => r.usedAt.getHours() === hour).length;
    popularTimes.push({ hour, count });
  }
  
  return {
    totalUsage,
    uniqueUsers,
    successRate,
    usageByTeam,
    usageTrend,
    popularTimes,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateScriptEnergyRequirement(hierarchy: SerializedEventHierarchy): number {
  // Base energy on complexity and total events
  return hierarchy.complexity * 10 + hierarchy.totalEvents * 20;
}

function calculateRecommendedTeamSize(hierarchy: SerializedEventHierarchy): { min: number; max: number } {
  const eventCount = hierarchy.totalEvents;
  
  if (eventCount <= 3) return { min: 1, max: 3 };
  if (eventCount <= 10) return { min: 2, max: 5 };
  if (eventCount <= 20) return { min: 3, max: 8 };
  return { min: 5, max: 15 };
}

function calculateScriptDuration(hierarchy: SerializedEventHierarchy): number {
  // Estimate total duration
  const primaryDuration = hierarchy.primaryEvent.duration;
  const milestoneDurations = hierarchy.milestones.reduce(
    (sum, m) => sum + m.duration + m.steps.reduce((s, step) => s + step.duration, 0),
    0
  );
  return primaryDuration + milestoneDurations;
}

function determineComplexity(hierarchy: SerializedEventHierarchy): 'beginner' | 'intermediate' | 'advanced' {
  const complexity = hierarchy.complexity;
  
  if (complexity < 30) return 'beginner';
  if (complexity < 70) return 'intermediate';
  return 'advanced';
}

function calculateHierarchyComplexity(event: Event): number {
  let score = 10; // Base
  
  // Add for milestones
  score += (event.milestones?.length || 0) * 10;
  
  // Add for steps
  const stepCount = event.milestones?.reduce((sum, m) => 
    sum + (m.children?.length || 0), 0
  ) || 0;
  score += stepCount * 5;
  
  // Add for resources
  score += (event.resources?.length || 0) * 2;
  
  // Add for tasks
  score += (event.associatedTasks?.length || 0) * 3;
  
  return Math.min(100, score);
}

function extractTags(event: Event): string[] {
  const tags = new Set<string>();
  
  if (event.tags) {
    event.tags.forEach(tag => tags.add(tag));
  }
  
  if (event.category) {
    tags.add(event.category);
  }
  
  return Array.from(tags);
}

function isUserInTeam(userId: string, teamId: string): boolean {
  // In production, would check actual team membership
  return true; // Mock
}

function generateScriptId(): string {
  return `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateUsageId(): string {
  return `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
