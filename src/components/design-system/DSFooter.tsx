// Design System Footer Component
import { ReactNode } from 'react';
import { designTokens } from '../../utils/design-tokens';

interface DSFooterProps {
  sections?: Array<{
    title: string;
    links: Array<{ label: string; href?: string; onClick?: () => void }>;
  }>;
  copyright?: ReactNode;
  social?: ReactNode;
}

export function DSFooter({ sections = [], copyright, social }: DSFooterProps) {
  return (
    <footer
      className="ds-footer"
      style={{
        // Auto Layout: Column
        display: 'flex',
        flexDirection: 'column',
        gap: designTokens.space[32],
        
        // Constraints: Bottom + Left/Right Fill
        width: '100%',
        
        // Spacing
        padding: `${designTokens.space[48]} ${designTokens.space[24]}`,
        
        // Visual
        background: designTokens.color.neutral[50],
        borderTop: `1px solid ${designTokens.color.border}`,
      }}
    >
      {/* Footer Content Grid */}
      <div
        className="ds-footer-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: designTokens.space[32],
          width: '100%',
        }}
      >
        {sections.map((section, index) => (
          <div
            key={index}
            className="ds-footer-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designTokens.space[16],
            }}
          >
            {/* Section Title */}
            <h3
              style={{
                fontSize: designTokens.typography.fontSize.sm,
                fontWeight: designTokens.typography.fontWeight.semibold,
                color: designTokens.color.text.primary,
                fontFamily: designTokens.typography.fontFamily.sans,
                margin: 0,
              }}
            >
              {section.title}
            </h3>

            {/* Section Links */}
            <ul
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: designTokens.space[8],
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <button
                    onClick={link.onClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: designTokens.typography.fontSize.sm,
                      color: designTokens.color.text.secondary,
                      fontFamily: designTokens.typography.fontFamily.sans,
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = designTokens.color.text.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = designTokens.color.text.secondary;
                    }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer Bottom */}
      <div
        className="ds-footer-bottom"
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: designTokens.space[24],
          paddingTop: designTokens.space[24],
          borderTop: `1px solid ${designTokens.color.border}`,
          flexWrap: 'wrap',
        }}
      >
        {/* Copyright */}
        {copyright && (
          <div
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              color: designTokens.color.text.tertiary,
              fontFamily: designTokens.typography.fontFamily.sans,
            }}
          >
            {copyright}
          </div>
        )}

        {/* Social Links */}
        {social && (
          <div
            style={{
              display: 'flex',
              gap: designTokens.space[16],
              alignItems: 'center',
            }}
          >
            {social}
          </div>
        )}
      </div>
    </footer>
  );
}
