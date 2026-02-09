// Design System Card Component with Variants
import { HTMLAttributes, ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

export type CardVariant = 'default' | 'outlined' | 'elevated';
export type CardSize = 'sm' | 'md' | 'lg';

interface DSCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  interactive?: boolean;
}

export function DSCard({
  variant = 'default',
  size = 'md',
  header,
  footer,
  children,
  interactive = false,
  ...props
}: DSCardProps) {
  // Size variants - padding and spacing
  const sizeStyles = {
    sm: {
      padding: designTokens.space[16],
      gap: designTokens.space[12],
    },
    md: {
      padding: designTokens.space[24],
      gap: designTokens.space[16],
    },
    lg: {
      padding: designTokens.space[32],
      gap: designTokens.space[24],
    },
  };

  // Variant styles
  const variantStyles = {
    default: {
      background: designTokens.color.surface,
      border: 'none',
      boxShadow: 'none',
    },
    outlined: {
      background: designTokens.color.background,
      border: `1px solid ${designTokens.color.border}`,
      boxShadow: 'none',
    },
    elevated: {
      background: designTokens.color.background,
      border: 'none',
      boxShadow: designTokens.shadow.lg,
    },
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  return (
    <div
      className="ds-card"
      style={{
        // Auto Layout: Column with Fill container
        display: 'flex',
        flexDirection: 'column',
        gap: currentSize.gap,
        
        // Constraints: min/max width
        minWidth: `${designTokens.constraints.card.min}px`,
        maxWidth: `${designTokens.constraints.card.max}px`,
        width: '100%',
        
        // Visual styles
        padding: currentSize.padding,
        ...currentVariant,
        borderRadius: designTokens.radius[12],
        
        // Interactive state
        cursor: interactive ? 'pointer' : 'default',
        transition: interactive ? 'all 0.2s ease' : 'none',
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = designTokens.shadow.xl;
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = currentVariant.boxShadow;
        }
      }}
      {...props}
    >
      {/* Card Header - Hug contents */}
      {header && (
        <div
          className="ds-card-header"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designTokens.space[8],
            width: '100%',
          }}
        >
          {header}
        </div>
      )}

      {/* Card Content - Fill container */}
      <div
        className="ds-card-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: designTokens.space[12],
          flex: 1,
          width: '100%',
        }}
      >
        {children}
      </div>

      {/* Card Footer - Hug contents */}
      {footer && (
        <div
          className="ds-card-footer"
          style={{
            display: 'flex',
            gap: designTokens.space[12],
            alignItems: 'center',
            paddingTop: designTokens.space[16],
            borderTop: `1px solid ${designTokens.color.border}`,
            width: '100%',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
