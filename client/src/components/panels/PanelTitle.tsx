import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Panel Title Component
 * 
 * Consistent title styling for panel headers.
 */
export const PanelTitle: React.FC<PanelTitleProps> = ({
  level = 2,
  className,
  children,
  ...props
}) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Component
      className={cn(
        'text-lg font-semibold text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
