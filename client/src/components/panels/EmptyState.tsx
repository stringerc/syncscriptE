import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons/IconLibrary';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Icons;
  className?: string;
}

/**
 * Empty State Component
 * 
 * Displays when a panel has no content with optional action.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'Inbox',
  className
}) => {
  const IconComponent = Icons[icon] || Icons.Inbox;
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <div className="mb-4 p-3 rounded-full bg-muted/50">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
