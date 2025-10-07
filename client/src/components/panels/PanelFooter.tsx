import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Panel Footer Component
 * 
 * Footer section for panels with consistent spacing and border.
 */
export const PanelFooter: React.FC<PanelFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between pt-4 mt-4 border-t border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
