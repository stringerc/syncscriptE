// Design System Input Component with Variants
import { forwardRef, InputHTMLAttributes } from 'react';
import { designTokens } from '../../utils/design-tokens';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'focus' | 'error' | 'disabled';

interface DSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
  fullWidth?: boolean;
  label?: string;
  helperText?: string;
}

export const DSInput = forwardRef<HTMLInputElement, DSInputProps>(
  ({ size = 'md', error = false, fullWidth = true, label, helperText, disabled, ...props }, ref) => {
    // Size variants
    const sizeStyles = {
      sm: {
        padding: `${designTokens.space[8]} ${designTokens.space[12]}`,
        fontSize: designTokens.typography.fontSize.sm,
        height: '32px',
      },
      md: {
        padding: `${designTokens.space[12]} ${designTokens.space[16]}`,
        fontSize: designTokens.typography.fontSize.base,
        height: '40px',
      },
      lg: {
        padding: `${designTokens.space[16]} ${designTokens.space[16]}`,
        fontSize: designTokens.typography.fontSize.lg,
        height: '48px',
      },
    };

    // State styles
    const getStateStyles = () => {
      if (disabled) {
        return {
          background: designTokens.color.neutral[50],
          borderColor: designTokens.color.neutral[200],
          color: designTokens.color.neutral[400],
          cursor: 'not-allowed',
        };
      }
      if (error) {
        return {
          background: designTokens.color.background,
          borderColor: designTokens.color.error,
          color: designTokens.color.text.primary,
        };
      }
      return {
        background: designTokens.color.background,
        borderColor: designTokens.color.border,
        color: designTokens.color.text.primary,
      };
    };

    const currentSize = sizeStyles[size];
    const stateStyles = getStateStyles();

    return (
      <div
        className="ds-input-wrapper"
        style={{
          // Auto Layout: Fill container for input wrapper
          display: 'flex',
          flexDirection: 'column',
          gap: designTokens.space[8],
          width: fullWidth ? '100%' : 'auto',
        }}
      >
        {label && (
          <label
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              fontWeight: designTokens.typography.fontWeight.medium,
              color: error ? designTokens.color.error : designTokens.color.text.primary,
              fontFamily: designTokens.typography.fontFamily.sans,
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className="ds-input"
          style={{
            // Auto Layout: Fill container
            width: '100%',
            
            // Size from variant
            padding: currentSize.padding,
            fontSize: currentSize.fontSize,
            height: currentSize.height,
            
            // Visual styles
            ...stateStyles,
            border: `1px solid ${stateStyles.borderColor}`,
            borderRadius: designTokens.radius[8],
            fontFamily: designTokens.typography.fontFamily.sans,
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: 'none',
          }}
          onFocus={(e) => {
            if (!disabled && !error) {
              e.currentTarget.style.borderColor = designTokens.color.primary[500];
              e.currentTarget.style.boxShadow = `0 0 0 3px ${designTokens.color.primary[100]}`;
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = error ? designTokens.color.error : designTokens.color.border;
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          {...props}
        />
        {helperText && (
          <span
            style={{
              fontSize: designTokens.typography.fontSize.xs,
              color: error ? designTokens.color.error : designTokens.color.text.secondary,
              fontFamily: designTokens.typography.fontFamily.sans,
            }}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

DSInput.displayName = 'DSInput';
