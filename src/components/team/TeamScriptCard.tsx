/**
 * TeamScriptCard Component (Phase 6B)
 * 
 * Display card for team scripts in marketplace and script library.
 * Shows hierarchy info, member contributions, usage stats, and energy requirements.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Users,
  Star,
  Download,
  Play,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  Zap,
  TrendingUp,
  Crown,
  Shield,
  Lock,
  Globe,
  Heart,
  Share2,
  GitBranch,
  Calendar,
  Target,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { TeamScript, ScriptPricing } from '../../utils/team-script-integration';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../ui/utils';

interface TeamScriptCardProps {
  script: TeamScript;
  onApply?: (script: TeamScript) => void;
  onEdit?: (script: TeamScript) => void;
  onDelete?: (script: TeamScript) => void;
  onFavorite?: (script: TeamScript) => void;
  onShare?: (script: TeamScript) => void;
  onViewDetails?: (script: TeamScript) => void;
  isFavorite?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  variant?: 'marketplace' | 'library' | 'compact';
  className?: string;
}

export function TeamScriptCard({
  script,
  onApply,
  onEdit,
  onDelete,
  onFavorite,
  onShare,
  onViewDetails,
  isFavorite = false,
  canEdit = false,
  canDelete = false,
  variant = 'marketplace',
  className,
}: TeamScriptCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isCompact = variant === 'compact';

  // Visibility icon
  const VisibilityIcon =
    script.visibility === 'public'
      ? Globe
      : script.visibility === 'private'
      ? Lock
      : Users;

  // Pricing display
  const pricingDisplay =
    script.pricing === 'free'
      ? 'Free'
      : script.pricing === 'paid'
      ? `$${script.price || 0}`
      : 'Premium';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <Card
        className={cn(
          'bg-[#1e2128] border-gray-800 hover:border-gray-700 transition-all cursor-pointer',
          isCompact ? 'p-3' : 'p-4'
        )}
        onClick={() => onViewDetails?.(script)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={cn(
                'rounded-lg flex items-center justify-center flex-shrink-0',
                isCompact ? 'w-10 h-10' : 'w-12 h-12',
                'bg-gradient-to-br from-blue-500 to-purple-500'
              )}
            >
              <FileText className={cn('text-white', isCompact ? 'w-5 h-5' : 'w-6 h-6')} />
            </div>

            {/* Title and meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    'font-semibold text-white truncate',
                    isCompact ? 'text-sm' : 'text-base'
                  )}
                >
                  {script.name}
                </h3>
                {!isCompact && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {script.isFeatured && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                              <Sparkles className="w-3 h-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Featured Script</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {script.isVerified && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                              <Shield className="w-3 h-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Verified by Platform</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>

              <p
                className={cn(
                  'text-gray-400 mt-1 line-clamp-2',
                  isCompact ? 'text-xs' : 'text-sm'
                )}
              >
                {script.description}
              </p>

              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-gray-300 text-xs"
                >
                  {script.category}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs border-0',
                    script.complexity === 'beginner'
                      ? 'bg-green-500/20 text-green-400'
                      : script.complexity === 'intermediate'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {script.complexity}
                </Badge>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className="bg-gray-800 border-gray-700 text-gray-300 text-xs flex items-center gap-1"
                      >
                        <VisibilityIcon className="w-3 h-3" />
                        {script.visibility}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {script.visibility === 'public'
                        ? 'Anyone can see and use this script'
                        : script.visibility === 'private'
                        ? 'Only you can see this script'
                        : 'Only team members can see this script'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {script.pricing !== 'free' && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-0 text-xs flex items-center gap-1"
                  >
                    <DollarSign className="w-3 h-3" />
                    {pricingDisplay}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions menu */}
          {!isCompact && (canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1e2128] border-gray-800">
                {canEdit && onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(script);
                    }}
                    className="text-gray-300 focus:text-white focus:bg-gray-800"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Script
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(script);
                    }}
                    className="text-gray-300 focus:text-white focus:bg-gray-800"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {canDelete && onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(script);
                      }}
                      className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats */}
        {!isCompact && (
          <div className="grid grid-cols-4 gap-3 mb-3 p-3 bg-gray-900/50 rounded-lg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {script.eventHierarchy.totalEvents}
                    </div>
                    <div className="text-xs text-gray-400">Events</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Total events in hierarchy (primary + milestones + steps)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
                      {script.usageCount}
                    </div>
                    <div className="text-xs text-gray-400">Uses</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Times this script has been applied</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {script.rating.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-400">Rating</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{script.reviewCount} reviews</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4" />
                      {script.energyRequirement || 0}
                    </div>
                    <div className="text-xs text-gray-400">Energy</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Estimated energy requirement</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Team and creator info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                {script.creatorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <div className="text-gray-400">by</div>
              <div className="text-white font-medium">{script.creatorName}</div>
            </div>
          </div>

          {script.collaborators.length > 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    +{script.collaborators.length - 1}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {script.collaborators.length} total contributors
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onApply && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onApply(script);
              }}
              size="sm"
              className="flex-1 gap-2"
            >
              <Play className="w-3 h-3" />
              Apply Script
            </Button>
          )}

          {onFavorite && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(script);
              }}
              variant={isFavorite ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'gap-2',
                isFavorite
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                  : ''
              )}
            >
              <Heart className={cn('w-3 h-3', isFavorite && 'fill-current')} />
              {script.favorites}
            </Button>
          )}

          {onViewDetails && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(script);
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Eye className="w-3 h-3" />
              Details
            </Button>
          )}
        </div>

        {/* Hover state: show additional info */}
        {isHovered && !isCompact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400 space-y-1"
          >
            {script.estimatedDuration && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>~{script.estimatedDuration} minutes total duration</span>
              </div>
            )}
            {script.recommendedTeamSize && (
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>
                  Recommended: {script.recommendedTeamSize.min}-
                  {script.recommendedTeamSize.max} team members
                </span>
              </div>
            )}
            {script.eventHierarchy.milestones.length > 0 && (
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3" />
                <span>{script.eventHierarchy.milestones.length} milestones</span>
              </div>
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
