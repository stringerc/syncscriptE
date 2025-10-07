import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelSubtitleProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

/**
 * Panel Subtitle Component
 * 
 * Subtitle text for panel headers with muted styling.
 */
export const PanelSubtitle: React.FC<PanelSubtitleProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-sm text-muted-foreground mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};
