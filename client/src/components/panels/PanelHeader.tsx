import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Panel Header Component
 * 
 * Header section for panels with consistent spacing and typography.
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
