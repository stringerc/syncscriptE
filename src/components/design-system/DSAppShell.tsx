// Design System App Shell - Main Layout Container
import { ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

interface DSAppShellProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  breakpoint?: 'mobile' | 'tablet' | 'desktop';
}

export function DSAppShell({ header, sidebar, children, footer, breakpoint = 'desktop' }: DSAppShellProps) {
  // Responsive grid configuration based on breakpoint
  const gridConfig = {
    desktop: {
      columns: designTokens.grid.desktop.columns,
      margin: designTokens.grid.desktop.margin,
      gutter: designTokens.grid.desktop.gutter,
    },
    tablet: {
      columns: designTokens.grid.tablet.columns,
      margin: designTokens.grid.tablet.margin,
      gutter: designTokens.grid.tablet.gutter,
    },
    mobile: {
      columns: designTokens.grid.mobile.columns,
      margin: designTokens.grid.mobile.margin,
      gutter: designTokens.grid.mobile.gutter,
    },
  };

  const currentGrid = gridConfig[breakpoint];
  const showSidebar = breakpoint !== 'mobile';

  return (
    <div
      className="ds-app-shell"
      style={{
        // Root container - Fill viewport
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: designTokens.color.background,
        fontFamily: designTokens.typography.fontFamily.sans,
      }}
    >
      {/* Header - Constraints: Top + Left/Right */}
      {header}

      {/* Main Content Area - Fill remaining space */}
      <div
        className="ds-app-content-wrapper"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Sidebar - Constraints: Left + Top/Bottom */}
        {sidebar && showSidebar && sidebar}

        {/* Main Content - Constraints: Left/Right + Top, Fill horizontal */}
        <main
          className="ds-main-content"
          style={{
            // Auto Layout: Fill container
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            
            // Constraints
            minWidth: `${designTokens.constraints.mainContent.min}px`,
            
            // Spacing - respects grid margins
            padding: `${designTokens.space[24]} ${currentGrid.margin}px`,
            
            // Scrolling
            overflow: 'auto',
            
            // Grid overlay visualization (optional)
            backgroundImage: `
              repeating-linear-gradient(
                to right,
                transparent,
                transparent calc((100% - ${currentGrid.margin * 2}px - ${currentGrid.gutter * (currentGrid.columns - 1)}px) / ${currentGrid.columns}),
                ${designTokens.color.primary[100]}22 calc((100% - ${currentGrid.margin * 2}px - ${currentGrid.gutter * (currentGrid.columns - 1)}px) / ${currentGrid.columns}),
                ${designTokens.color.primary[100]}22 calc((100% - ${currentGrid.margin * 2}px - ${currentGrid.gutter * (currentGrid.columns - 1)}px) / ${currentGrid.columns} + ${currentGrid.gutter}px)
              )
            `,
            backgroundPositionX: `${currentGrid.margin}px`,
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer - Constraints: Bottom + Left/Right */}
      {footer}
    </div>
  );
}
