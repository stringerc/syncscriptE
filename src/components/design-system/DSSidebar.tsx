// Design System Sidebar Component
import { ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

interface DSSidebarProps {
  header?: ReactNode;
  navigation?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
}

export function DSSidebar({ header, navigation, footer, collapsed = false }: DSSidebarProps) {
  const width = collapsed ? '64px' : `${designTokens.constraints.sidebar.min}px`;

  return (
    <aside
      className="ds-sidebar"
      style={{
        // Auto Layout: Column with Fill vertical
        display: 'flex',
        flexDirection: 'column',
        gap: designTokens.space[16],
        
        // Constraints: Left + Top/Bottom with fixed min/max width
        width,
        minWidth: width,
        maxWidth: collapsed ? '64px' : `${designTokens.constraints.sidebar.max}px`,
        height: '100vh',
        
        // Spacing
        padding: designTokens.space[16],
        
        // Visual
        background: designTokens.color.surface,
        borderRight: `1px solid ${designTokens.color.border}`,
        
        // Behavior
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Header - Hug contents */}
      {header && (
        <div
          className="ds-sidebar-header"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designTokens.space[12],
            padding: designTokens.space[8],
            minHeight: 'fit-content',
          }}
        >
          {header}
        </div>
      )}

      {/* Sidebar Navigation - Fill container */}
      {navigation && (
        <div
          className="ds-sidebar-nav"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designTokens.space[8],
            flex: 1,
            overflow: 'auto',
          }}
        >
          {navigation}
        </div>
      )}

      {/* Sidebar Footer - Hug contents */}
      {footer && (
        <div
          className="ds-sidebar-footer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designTokens.space[8],
            padding: designTokens.space[8],
            borderTop: `1px solid ${designTokens.color.border}`,
            minHeight: 'fit-content',
          }}
        >
          {footer}
        </div>
      )}
    </aside>
  );
}
