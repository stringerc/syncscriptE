// PHASE 3: Permission Tooltip Component
// Provides explanatory tooltips for permission-restricted actions
// Research-backed: Nielsen Norman Group (2024) - "Explain why features are disabled"

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, Lock, Crown, Shield } from 'lucide-react';

interface PermissionTooltipProps {
  children: React.ReactNode;
  requiredRole: 'creator' | 'admin' | 'collaborator';
  currentRole?: 'creator' | 'admin' | 'collaborator' | 'viewer';
  action: string;
  disabled?: boolean;
}

const ROLE_INFO = {
  creator: {
    icon: Crown,
    label: 'Creator',
    color: 'text-yellow-400'
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    color: 'text-blue-400'
  },
  collaborator: {
    icon: Shield,
    label: 'Collaborator',
    color: 'text-green-400'
  }
};

export function PermissionTooltip({
  children,
  requiredRole,
  currentRole,
  action,
  disabled = false
}: PermissionTooltipProps) {
  if (!disabled) {
    return <>{children}</>;
  }

  const roleInfo = ROLE_INFO[requiredRole];
  const RoleIcon = roleInfo.icon;

  const getTooltipMessage = () => {
    if (!currentRole) {
      return `${action} requires ${roleInfo.label} access`;
    }

    switch (requiredRole) {
      case 'creator':
        return `Only the Creator can ${action.toLowerCase()}`;
      case 'admin':
        return `${action} requires Admin or Creator access`;
      case 'collaborator':
        return `${action} requires Collaborator, Admin, or Creator access`;
      default:
        return `You don't have permission to ${action.toLowerCase()}`;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="bg-gray-900 border-gray-700 text-white max-w-[250px]"
        >
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium mb-1">Permission Required</p>
              <p className="text-xs text-gray-300">{getTooltipMessage()}</p>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <RoleIcon className={`w-3 h-3 ${roleInfo.color}`} />
                <span className={roleInfo.color}>
                  {roleInfo.label} access needed
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simplified version for inline use
export function SimplePermissionTooltip({
  children,
  message,
  disabled = false
}: {
  children: React.ReactNode;
  message: string;
  disabled?: boolean;
}) {
  if (!disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="bg-gray-900 border-gray-700 text-white max-w-[200px]"
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <p className="text-xs text-gray-300">{message}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
