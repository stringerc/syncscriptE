import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  density?: 'comfortable' | 'compact';
  variant?: 'default' | 'elevated' | 'outlined';
}

interface PanelHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Panel Component
 * 
 * A reusable card-like container with consistent styling and spacing.
 * Supports different densities and variants for various use cases.
 */
export const Panel: React.FC<PanelProps> = ({ 
  children, 
  className = '', 
  density = 'comfortable',
  variant = 'default'
}) => {
  const densityClasses = {
    comfortable: 'p-6',
    compact: 'p-4'
  };

  const variantClasses = {
    default: 'bg-background border border-border',
    elevated: 'bg-background border border-border shadow-sm',
    outlined: 'bg-background border-2 border-border'
  };

  return (
    <div 
      className={cn(
        'rounded-xl transition-all duration-200',
        densityClasses[density],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Panel Header
 * Contains the title, subtitle, and any header actions
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
};

/**
 * Panel Title
 * Main heading for the panel
 */
export const PanelTitle: React.FC<PanelTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h3>
  );
};

/**
 * Panel Subtitle
 * Secondary text below the title
 */
export const PanelSubtitle: React.FC<PanelSubtitleProps> = ({ children, className = '' }) => {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  );
};

/**
 * Panel Body
 * Main content area of the panel
 */
export const PanelBody: React.FC<PanelBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
};

/**
 * Panel Footer
 * Actions and additional content at the bottom
 */
export const PanelFooter: React.FC<PanelFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('flex items-center justify-between mt-4 pt-4 border-t border-border', className)}>
      {children}
    </div>
  );
};

/**
 * Empty State Component
 * Displays when there's no content to show
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h4 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
};

/**
 * Toolbar Component
 * Horizontal container for actions and controls
 */
export const Toolbar: React.FC<ToolbarProps> = ({ children, className = '' }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
};

// Components are already exported individually above
