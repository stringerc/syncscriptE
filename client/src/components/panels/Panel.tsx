import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: 'comfortable' | 'compact';
  tone?: 'default' | 'warning' | 'info';
  loading?: boolean;
  empty?: boolean;
  children: React.ReactNode;
}

/**
 * Panel Component
 * 
 * Base panel with gradient border and glass morphism effects.
 * Supports different densities and tones for various use cases.
 */
export const Panel: React.FC<PanelProps> = ({
  density = 'comfortable',
  tone = 'default',
  loading = false,
  empty = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        // Base panel styles
        'relative rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm',
        'shadow-sm transition-all duration-200',
        
        // Density variants
        density === 'comfortable' && 'p-6',
        density === 'compact' && 'p-4',
        
        // Tone variants
        tone === 'default' && 'border-border/50',
        tone === 'warning' && 'border-warning/50 bg-warning/5',
        tone === 'info' && 'border-info/50 bg-info/5',
        
        // Loading state
        loading && 'animate-pulse opacity-75',
        
        // Empty state
        empty && 'border-dashed border-muted-foreground/30',
        
        className
      )}
      {...props}
    >
      {/* Gradient border effect */}
      <div className={cn(
        'absolute inset-0 rounded-xl pointer-events-none',
        'bg-gradient-to-r from-brand-primary/20 via-transparent to-brand-accent/20',
        'opacity-0 transition-opacity duration-200',
        'group-hover:opacity-100'
      )} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
