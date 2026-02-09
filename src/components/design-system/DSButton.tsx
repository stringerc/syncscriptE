// Design System Button Component with Variants
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { designTokens } from '../../utils/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonState = 'default' | 'hover' | 'disabled';

interface DSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const DSButton = forwardRef<HTMLButtonElement, DSButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, children, disabled, ...props }, ref) => {
    // Size variants - Hug contents by default, Fill if fullWidth
    const sizeStyles = {
      sm: {
        padding: `${designTokens.space[8]} ${designTokens.space[12]}`,
        fontSize: designTokens.typography.fontSize.sm,
        gap: designTokens.space[8],
        height: '32px',
      },
      md: {
        padding: `${designTokens.space[12]} ${designTokens.space[16]}`,
        fontSize: designTokens.typography.fontSize.base,
        gap: designTokens.space[8],
        height: '40px',
      },
      lg: {
        padding: `${designTokens.space[16]} ${designTokens.space[24]}`,
        fontSize: designTokens.typography.fontSize.lg,
        gap: designTokens.space[12],
        height: '48px',
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        default: {
          background: designTokens.color.primary[600],
          color: designTokens.color.text.inverse,
          border: 'none',
          boxShadow: designTokens.shadow.sm,
        },
        hover: {
          background: designTokens.color.primary[700],
          boxShadow: designTokens.shadow.md,
          transform: 'translateY(-1px)',
        },
        disabled: {
          background: designTokens.color.neutral[200],
          color: designTokens.color.neutral[400],
          cursor: 'not-allowed',
          boxShadow: 'none',
        },
      },
      secondary: {
        default: {
          background: designTokens.color.neutral[100],
          color: designTokens.color.text.primary,
          border: 'none',
          boxShadow: designTokens.shadow.sm,
        },
        hover: {
          background: designTokens.color.neutral[200],
          boxShadow: designTokens.shadow.md,
        },
        disabled: {
          background: designTokens.color.neutral[50],
          color: designTokens.color.neutral[300],
          cursor: 'not-allowed',
        },
      },
      outline: {
        default: {
          background: 'transparent',
          color: designTokens.color.text.primary,
          border: `1px solid ${designTokens.color.border}`,
          boxShadow: 'none',
        },
        hover: {
          background: designTokens.color.neutral[50],
          borderColor: designTokens.color.neutral[300],
        },
        disabled: {
          background: 'transparent',
          color: designTokens.color.neutral[300],
          borderColor: designTokens.color.neutral[200],
          cursor: 'not-allowed',
        },
      },
      ghost: {
        default: {
          background: 'transparent',
          color: designTokens.color.text.secondary,
          border: 'none',
          boxShadow: 'none',
        },
        hover: {
          background: designTokens.color.neutral[100],
          color: designTokens.color.text.primary,
        },
        disabled: {
          background: 'transparent',
          color: designTokens.color.neutral[300],
          cursor: 'not-allowed',
        },
      },
    };

    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];
    const currentState = disabled ? 'disabled' : 'default';

    return (
      <button
        ref={ref}
        disabled={disabled}
        className="ds-button"
        style={{
          // Auto Layout: Hug contents or Fill container
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: fullWidth ? '100%' : 'auto',
          minWidth: 'fit-content',
          
          // Size from variant
          padding: currentSize.padding,
          fontSize: currentSize.fontSize,
          gap: currentSize.gap,
          height: currentSize.height,
          
          // Visual styles
          ...currentVariant[currentState],
          borderRadius: designTokens.radius[8],
          fontWeight: designTokens.typography.fontWeight.medium,
          fontFamily: designTokens.typography.fontFamily.sans,
          
          // Behavior
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, currentVariant.hover);
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, currentVariant.default);
          }
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DSButton.displayName = 'DSButton';
