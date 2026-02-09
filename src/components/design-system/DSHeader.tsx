// Design System Header Component
import { ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

interface DSHeaderProps {
  logo?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
}

export function DSHeader({ logo, navigation, actions, sticky = false }: DSHeaderProps) {
  return (
    <header
      className="ds-header"
      style={{
        // Auto Layout: Horizontal with space-between
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: designTokens.space[24],
        
        // Constraints: Top + Left/Right Fill
        width: '100%',
        height: '64px',
        
        // Spacing
        padding: `${designTokens.space[12]} ${designTokens.space[24]}`,
        
        // Visual
        background: designTokens.color.background,
        borderBottom: `1px solid ${designTokens.color.border}`,
        boxShadow: designTokens.shadow.sm,
        
        // Sticky positioning
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo Section - Hug contents */}
      {logo && (
        <div
          className="ds-header-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: designTokens.space[12],
            minWidth: 'fit-content',
          }}
        >
          {logo}
        </div>
      )}

      {/* Navigation Section - Fill available space */}
      {navigation && (
        <div
          className="ds-header-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0, // Allow shrinking
          }}
        >
          {navigation}
        </div>
      )}

      {/* Actions Section - Hug contents */}
      {actions && (
        <div
          className="ds-header-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: designTokens.space[12],
            minWidth: 'fit-content',
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
