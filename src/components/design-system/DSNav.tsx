// Design System Navigation Component
import { ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

interface DSNavProps {
  items: Array<{
    label: string;
    icon?: ReactNode;
    active?: boolean;
    onClick?: () => void;
  }>;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline';
}

export function DSNav({ items, orientation = 'horizontal', variant = 'default' }: DSNavProps) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <nav
      className="ds-nav"
      style={{
        // Auto Layout: Fill container
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: isHorizontal ? designTokens.space[8] : designTokens.space[4],
        width: '100%',
        padding: isHorizontal ? designTokens.space[8] : designTokens.space[12],
        alignItems: isHorizontal ? 'center' : 'stretch',
      }}
    >
      {items.map((item, index) => {
        const isActive = item.active || false;

        // Variant-specific styles
        const getItemStyles = () => {
          const baseStyles = {
            display: 'flex',
            alignItems: 'center',
            gap: designTokens.space[8],
            padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            fontFamily: designTokens.typography.fontFamily.sans,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          };

          switch (variant) {
            case 'pills':
              return {
                ...baseStyles,
                borderRadius: designTokens.radius[8],
                background: isActive ? designTokens.color.primary[100] : 'transparent',
                color: isActive ? designTokens.color.primary[700] : designTokens.color.text.secondary,
              };
            case 'underline':
              return {
                ...baseStyles,
                borderRadius: 0,
                borderBottom: `2px solid ${isActive ? designTokens.color.primary[600] : 'transparent'}`,
                background: 'transparent',
                color: isActive ? designTokens.color.text.primary : designTokens.color.text.secondary,
              };
            default:
              return {
                ...baseStyles,
                borderRadius: designTokens.radius[4],
                background: isActive ? designTokens.color.neutral[100] : 'transparent',
                color: isActive ? designTokens.color.text.primary : designTokens.color.text.secondary,
              };
          }
        };

        return (
          <button
            key={index}
            onClick={item.onClick}
            className="ds-nav-item"
            style={getItemStyles()}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = variant === 'underline' 
                  ? 'transparent' 
                  : designTokens.color.neutral[50];
                e.currentTarget.style.color = designTokens.color.text.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = designTokens.color.text.secondary;
              }
            }}
          >
            {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
