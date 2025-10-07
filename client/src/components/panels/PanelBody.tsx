import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Panel Body Component
 * 
 * Main content area for panels with consistent spacing.
 */
export const PanelBody: React.FC<PanelBodyProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'space-y-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
