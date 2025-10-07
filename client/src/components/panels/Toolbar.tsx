import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/IconLibrary';

export interface ToolbarAction {
  icon: keyof typeof Icons;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}

export interface ToolbarProps {
  actions: ToolbarAction[];
  className?: string;
}

/**
 * Toolbar Component
 * 
 * Horizontal toolbar with icon buttons for panel actions.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  actions,
  className
}) => {
  return (
    <div className={cn(
      'flex items-center gap-2',
      className
    )}>
      {actions.map((action, index) => {
        const IconComponent = Icons[action.icon] || Icons.Settings;
        
        return (
          <Button
            key={index}
            variant={action.primary ? 'default' : 'ghost'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="h-8 w-8 p-0"
            aria-label={action.label}
          >
            <IconComponent className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
};
