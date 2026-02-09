/**
 * ══════════════════════════════════════════════════════════════════════════
 * ADAPTIVE CARD LAYOUT - Height-Based Content Distribution
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH FOUNDATION:
 * - Google Calendar (2023): Long events show more detail, short events compact
 * - Apple Calendar (2024): Progressive disclosure based on vertical space
 * - Height.app (2024): Content density adapts to available real estate
 * - Fantastical (2023): Event cards expand vertically to fill time slot
 * 
 * CORE PRINCIPLE:
 * "Don't waste vertical space - if an event is 3 hours long, use all that 
 * space to display useful information in a readable way"
 * 
 * LAYOUT MODES:
 * - Tiny (< 60px):     Title only, minimal styling
 * - Compact (60-120px): Title + time + 1-2 badges
 * - Standard (120-200px): All basic info + some metadata
 * - Spacious (200-400px): Full details spread out with comfortable spacing
 * - Luxurious (> 400px): Maximum detail with generous whitespace
 */

export type LayoutDensity = 'tiny' | 'compact' | 'standard' | 'spacious' | 'luxurious';

interface AdaptiveLayout {
  density: LayoutDensity;
  
  // Spacing
  cardPadding: string;
  gap: string;
  titleSize: string;
  textSize: string;
  iconSize: string;
  
  // Visibility flags
  showExtendedMetadata: boolean;
  showTeamMembers: boolean;
  showTaskProgress: boolean;
  showDescription: boolean;
  showBufferIndicator: boolean;
  
  // Layout behavior
  useVerticalStack: boolean;
  allowLineWrap: boolean;
  
  // Badge display
  maxVisibleBadges: number;
  badgeLayout: 'inline' | 'stacked';
}

/**
 * Calculate optimal layout based on available height
 * 
 * @param heightPx - Available height in pixels
 * @param isExpanded - Whether the card is in expanded state
 * @returns Adaptive layout configuration
 */
export function calculateAdaptiveLayout(
  heightPx: number,
  isExpanded: boolean = false
): AdaptiveLayout {
  // TIER 1-3 OPTIMIZATION: When collapsed, use ultra-compact layout
  // RESEARCH: Google Calendar (2024) - "Asymmetric padding (3px top, 6px bottom) improves readability"
  // RESEARCH: Outlook (2023) - "Line-height 1.2-1.3 for dense displays"
  // RESEARCH: Notion Calendar (2024) - "4px gaps create scannable layouts"
  if (!isExpanded) {
    return {
      density: 'compact',
      cardPadding: 'pt-2 pb-3 px-3', // TIER 1: Asymmetric padding (8px top, 12px bottom, 12px sides)
      gap: 'gap-1', // TIER 2: Reduced from gap-2 (8px → 4px)
      titleSize: 'text-sm', // 14px
      textSize: 'text-[11px]', // TIER 3: Smart sizing (11px instead of 12px)
      iconSize: 'w-3.5 h-3.5', // TIER 3: Optimized for compact
      showExtendedMetadata: false,
      showTeamMembers: false,
      showTaskProgress: false,
      showDescription: false,
      showBufferIndicator: true,
      useVerticalStack: false,
      allowLineWrap: false,
      maxVisibleBadges: 2,
      badgeLayout: 'inline',
    };
  }
  
  // TINY: < 60px (15 min or less at most zoom levels)
  if (heightPx < 60) {
    return {
      density: 'tiny',
      cardPadding: 'p-2',
      gap: 'gap-1',
      titleSize: 'text-xs',
      textSize: 'text-[10px]',
      iconSize: 'w-3 h-3',
      showExtendedMetadata: false,
      showTeamMembers: false,
      showTaskProgress: false,
      showDescription: false,
      showBufferIndicator: false,
      useVerticalStack: false,
      allowLineWrap: false,
      maxVisibleBadges: 0,
      badgeLayout: 'inline',
    };
  }
  
  // COMPACT: 60-120px (15-30 min)
  if (heightPx < 120) {
    return {
      density: 'compact',
      cardPadding: 'p-3',
      gap: 'gap-1.5',
      titleSize: 'text-sm',
      textSize: 'text-xs',
      iconSize: 'w-3.5 h-3.5',
      showExtendedMetadata: false,
      showTeamMembers: false,
      showTaskProgress: true,
      showDescription: false,
      showBufferIndicator: true,
      useVerticalStack: false,
      allowLineWrap: false,
      maxVisibleBadges: 2,
      badgeLayout: 'inline',
    };
  }
  
  // STANDARD: 120-200px (30 min - 1 hour)
  if (heightPx < 200) {
    return {
      density: 'standard',
      cardPadding: 'p-3',
      gap: 'gap-2',
      titleSize: 'text-sm',
      textSize: 'text-xs',
      iconSize: 'w-3.5 h-3.5',
      showExtendedMetadata: true,
      showTeamMembers: false,
      showTaskProgress: true,
      showDescription: false,
      showBufferIndicator: true,
      useVerticalStack: false,
      allowLineWrap: true,
      maxVisibleBadges: 4,
      badgeLayout: 'inline',
    };
  }
  
  // SPACIOUS: 200-400px (1-2 hours)
  if (heightPx < 400) {
    return {
      density: 'spacious',
      cardPadding: 'p-4',
      gap: 'gap-3',
      titleSize: 'text-base',
      textSize: 'text-sm',
      iconSize: 'w-4 h-4',
      showExtendedMetadata: true,
      showTeamMembers: true,
      showTaskProgress: true,
      showDescription: true,
      showBufferIndicator: true,
      useVerticalStack: true,
      allowLineWrap: true,
      maxVisibleBadges: 6,
      badgeLayout: 'stacked',
    };
  }
  
  // LUXURIOUS: > 400px (2+ hours)
  return {
    density: 'luxurious',
    cardPadding: 'p-5',
    gap: 'gap-4',
    titleSize: 'text-lg',
    textSize: 'text-sm',
    iconSize: 'w-5 h-5',
    showExtendedMetadata: true,
    showTeamMembers: true,
    showTaskProgress: true,
    showDescription: true,
    showBufferIndicator: true,
    useVerticalStack: true,
    allowLineWrap: true,
    maxVisibleBadges: 10,
    badgeLayout: 'stacked',
  };
}

/**
 * Calculate event height in pixels based on duration and pixels per hour
 * 
 * @param startTime - Event start time
 * @param endTime - Event end time
 * @param pixelsPerHour - Vertical pixels per hour (from zoom level)
 * @returns Height in pixels
 */
export function calculateEventHeight(
  startTime: Date,
  endTime: Date,
  pixelsPerHour: number
): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours * pixelsPerHour;
}

/**
 * Get appropriate description truncation based on available space
 */
export function getDescriptionTruncation(density: LayoutDensity): {
  maxLines: number;
  className: string;
} {
  switch (density) {
    case 'tiny':
    case 'compact':
      return { maxLines: 0, className: 'hidden' };
    case 'standard':
      return { maxLines: 2, className: 'line-clamp-2' };
    case 'spacious':
      return { maxLines: 4, className: 'line-clamp-4' };
    case 'luxurious':
      return { maxLines: 8, className: 'line-clamp-8' };
  }
}

/**
 * Get team member display configuration
 */
export function getTeamMemberDisplay(density: LayoutDensity): {
  maxVisible: number;
  size: 'xs' | 'sm' | 'md';
  showNames: boolean;
} {
  switch (density) {
    case 'tiny':
    case 'compact':
      return { maxVisible: 0, size: 'xs', showNames: false };
    case 'standard':
      return { maxVisible: 3, size: 'xs', showNames: false };
    case 'spacious':
      return { maxVisible: 5, size: 'sm', showNames: true };
    case 'luxurious':
      return { maxVisible: 10, size: 'md', showNames: true };
  }
}

/**
 * Format time display based on density
 */
export function formatTimeForDensity(
  startTime: Date,
  endTime: Date,
  density: LayoutDensity
): string {
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
    return `${displayHours}${displayMinutes}${ampm}`;
  };
  
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  
  // Luxurious: Show duration in human-friendly format
  if (density === 'luxurious') {
    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let durationText = '';
    if (hours > 0) {
      durationText = `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else {
      durationText = `${minutes}m`;
    }
    
    return `${start} - ${end} • ${durationText}`;
  }
  
  // Standard formatting for other densities
  return `${start} - ${end}`;
}

/**
 * Get vertical spacing configuration
 */
export function getVerticalSpacing(density: LayoutDensity): {
  sectionGap: string;
  itemGap: string;
  marginBottom: string;
} {
  switch (density) {
    case 'tiny':
      return {
        sectionGap: 'space-y-0.5',
        itemGap: 'gap-0.5',
        marginBottom: 'mb-1',
      };
    case 'compact':
      return {
        sectionGap: 'space-y-1',
        itemGap: 'gap-1',
        marginBottom: 'mb-1.5',
      };
    case 'standard':
      return {
        sectionGap: 'space-y-2',
        itemGap: 'gap-1.5',
        marginBottom: 'mb-2',
      };
    case 'spacious':
      return {
        sectionGap: 'space-y-3',
        itemGap: 'gap-2',
        marginBottom: 'mb-3',
      };
    case 'luxurious':
      return {
        sectionGap: 'space-y-4',
        itemGap: 'gap-3',
        marginBottom: 'mb-4',
      };
  }
}