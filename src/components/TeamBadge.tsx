/**
 * TeamBadge Component
 * 
 * Displays a team badge on task/goal cards to indicate team affiliation
 * Used in Tasks tab to show which tasks belong to teams
 * Can be clicked to navigate to the team's page
 */

import React from 'react';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router';
import { Users } from 'lucide-react';

interface TeamBadgeProps {
  team: {
    id?: string;
    name: string;
    color?: string;
  };
  className?: string;
  clickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function TeamBadge({ team, className = '', clickable = true, onClick }: TeamBadgeProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick events
    
    if (onClick) {
      onClick(e);
    } else if (clickable && team.id) {
      // Navigate to team page with team context
      navigate(`/team?teamId=${team.id}`);
    }
  };

  return (
    <Badge 
      className={`text-xs font-medium px-2 py-0.5 inline-flex items-center gap-1 ${
        clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } ${className}`}
      style={{ 
        backgroundColor: team.color || '#0ea5e9',
        color: 'white',
        border: 'none'
      }}
      onClick={clickable ? handleClick : undefined}
    >
      <Users className="w-3 h-3" />
      {team.name}
    </Badge>
  );
}
