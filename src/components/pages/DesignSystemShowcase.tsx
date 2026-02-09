// Design System Showcase - Three Breakpoints with Editable Layers
import { useState } from 'react';
import { Home, Settings, Users, Bell, Search, Menu, X, ChevronDown } from 'lucide-react';
import { DSButton } from '../design-system/DSButton';
import { DSInput } from '../design-system/DSInput';
import { DSCard } from '../design-system/DSCard';
import { DSNav } from '../design-system/DSNav';
import { DSHeader } from '../design-system/DSHeader';
import { DSFooter } from '../design-system/DSFooter';
import { DSSidebar } from '../design-system/DSSidebar';
import { DSAppShell } from '../design-system/DSAppShell';
import { designTokens } from '../../utils/design-tokens';

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export function DesignSystemShowcase() {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');
  const [activeView, setActiveView] = useState<'components' | 'layouts'>('layouts');

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: designTokens.color.neutral[100],
        overflow: 'auto',
        fontFamily: designTokens.typography.fontFamily.sans,
      }}
    >
      {/* Showcase Controls */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: designTokens.color.neutral[900],
          color: designTokens.color.text.inverse,
          padding: designTokens.space[16],
          borderBottom: `2px solid ${designTokens.color.primary[600]}`,
          display: 'flex',
          gap: designTokens.space[24],
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: designTokens.space[12], alignItems: 'center' }}>
          <span style={{ fontSize: designTokens.typography.fontSize.lg, fontWeight: designTokens.typography.fontWeight.bold }}>
            Design System Showcase
          </span>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: designTokens.space[8] }}>
          <button
            onClick={() => setActiveView('layouts')}
            style={{
              padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
              background: activeView === 'layouts' ? designTokens.color.primary[600] : 'transparent',
              color: designTokens.color.text.inverse,
              border: `1px solid ${designTokens.color.primary[600]}`,
              borderRadius: designTokens.radius[8],
              cursor: 'pointer',
              fontSize: designTokens.typography.fontSize.sm,
            }}
          >
            Layouts
          </button>
          <button
            onClick={() => setActiveView('components')}
            style={{
              padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
              background: activeView === 'components' ? designTokens.color.primary[600] : 'transparent',
              color: designTokens.color.text.inverse,
              border: `1px solid ${designTokens.color.primary[600]}`,
              borderRadius: designTokens.radius[8],
              cursor: 'pointer',
              fontSize: designTokens.typography.fontSize.sm,
            }}
          >
            Components
          </button>
        </div>

        {/* Breakpoint Toggle */}
        <div style={{ display: 'flex', gap: designTokens.space[8] }}>
          <button
            onClick={() => setActiveBreakpoint('desktop')}
            style={{
              padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
              background: activeBreakpoint === 'desktop' ? designTokens.color.primary[600] : 'transparent',
              color: designTokens.color.text.inverse,
              border: `1px solid ${designTokens.color.primary[600]}`,
              borderRadius: designTokens.radius[8],
              cursor: 'pointer',
              fontSize: designTokens.typography.fontSize.sm,
            }}
          >
            Desktop (1440×900)
          </button>
          <button
            onClick={() => setActiveBreakpoint('tablet')}
            style={{
              padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
              background: activeBreakpoint === 'tablet' ? designTokens.color.primary[600] : 'transparent',
              color: designTokens.color.text.inverse,
              border: `1px solid ${designTokens.color.primary[600]}`,
              borderRadius: designTokens.radius[8],
              cursor: 'pointer',
              fontSize: designTokens.typography.fontSize.sm,
            }}
          >
            Tablet (1024×800)
          </button>
          <button
            onClick={() => setActiveBreakpoint('mobile')}
            style={{
              padding: `${designTokens.space[8]} ${designTokens.space[16]}`,
              background: activeBreakpoint === 'mobile' ? designTokens.color.primary[600] : 'transparent',
              color: designTokens.color.text.inverse,
              border: `1px solid ${designTokens.color.primary[600]}`,
              borderRadius: designTokens.radius[8],
              cursor: 'pointer',
              fontSize: designTokens.typography.fontSize.sm,
            }}
          >
            Mobile (390×844)
          </button>
        </div>
      </div>

      {/* Responsive Frame Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: designTokens.space[32],
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {activeView === 'layouts' ? (
          <LayoutShowcase breakpoint={activeBreakpoint} />
        ) : (
          <ComponentShowcase />
        )}
      </div>
    </div>
  );
}

// Layout Showcase - Full App Shells
function LayoutShowcase({ breakpoint }: { breakpoint: Breakpoint }) {
  const dimensions = {
    desktop: { width: 1440, height: 900 },
    tablet: { width: 1024, height: 800 },
    mobile: { width: 390, height: 844 },
  };

  const currentDimensions = dimensions[breakpoint];

  return (
    <div
      style={{
        width: `${currentDimensions.width}px`,
        height: `${currentDimensions.height}px`,
        boxShadow: designTokens.shadow.xl,
        borderRadius: designTokens.radius[12],
        overflow: 'hidden',
        background: designTokens.color.background,
        border: `1px solid ${designTokens.color.border}`,
      }}
    >
      <DSAppShell
        breakpoint={breakpoint}
        header={
          <DSHeader
            sticky
            logo={
              <div style={{ display: 'flex', alignItems: 'center', gap: designTokens.space[12] }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: `linear-gradient(135deg, ${designTokens.color.primary[600]}, ${designTokens.color.primary[400]})`,
                    borderRadius: designTokens.radius[8],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: designTokens.color.text.inverse,
                    fontWeight: designTokens.typography.fontWeight.bold,
                  }}
                >
                  DS
                </div>
                {breakpoint !== 'mobile' && (
                  <span style={{ fontSize: designTokens.typography.fontSize.lg, fontWeight: designTokens.typography.fontWeight.semibold }}>
                    Design System
                  </span>
                )}
              </div>
            }
            navigation={
              breakpoint !== 'mobile' && (
                <DSNav
                  orientation="horizontal"
                  variant="underline"
                  items={[
                    { label: 'Dashboard', icon: <Home size={16} />, active: true },
                    { label: 'Users', icon: <Users size={16} /> },
                    { label: 'Settings', icon: <Settings size={16} /> },
                  ]}
                />
              )
            }
            actions={
              <div style={{ display: 'flex', gap: designTokens.space[12], alignItems: 'center' }}>
                {breakpoint === 'desktop' && (
                  <DSInput
                    size="sm"
                    placeholder="Search..."
                    fullWidth={false}
                    style={{ width: '200px' }}
                  />
                )}
                <button
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: designTokens.radius[8],
                    border: `1px solid ${designTokens.color.border}`,
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Bell size={18} />
                </button>
                {breakpoint === 'mobile' && (
                  <button
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: designTokens.radius[8],
                      border: `1px solid ${designTokens.color.border}`,
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Menu size={18} />
                  </button>
                )}
              </div>
            }
          />
        }
        sidebar={
          <DSSidebar
            header={
              <div style={{ padding: designTokens.space[8] }}>
                <span style={{ fontSize: designTokens.typography.fontSize.sm, fontWeight: designTokens.typography.fontWeight.semibold }}>
                  Navigation
                </span>
              </div>
            }
            navigation={
              <DSNav
                orientation="vertical"
                variant="pills"
                items={[
                  { label: 'Dashboard', icon: <Home size={18} />, active: true },
                  { label: 'Users', icon: <Users size={18} /> },
                  { label: 'Settings', icon: <Settings size={18} /> },
                  { label: 'Notifications', icon: <Bell size={18} /> },
                ]}
              />
            }
            footer={
              <div style={{ fontSize: designTokens.typography.fontSize.xs, color: designTokens.color.text.tertiary }}>
                v1.0.0
              </div>
            }
          />
        }
        footer={
          <DSFooter
            sections={[
              {
                title: 'Product',
                links: [
                  { label: 'Features' },
                  { label: 'Pricing' },
                  { label: 'Security' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About' },
                  { label: 'Blog' },
                  { label: 'Careers' },
                ],
              },
              {
                title: 'Support',
                links: [
                  { label: 'Help Center' },
                  { label: 'Contact' },
                  { label: 'Status' },
                ],
              },
            ]}
            copyright="© 2025 Design System. All rights reserved."
          />
        }
      >
        {/* Main Content Area with Card Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: breakpoint === 'mobile' 
              ? '1fr' 
              : breakpoint === 'tablet' 
              ? 'repeat(2, 1fr)' 
              : 'repeat(3, 1fr)',
            gap: designTokens.space[24],
            width: '100%',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DSCard
              key={i}
              variant="elevated"
              size="md"
              interactive
              header={
                <div>
                  <h3 style={{ margin: 0, fontSize: designTokens.typography.fontSize.lg, fontWeight: designTokens.typography.fontWeight.semibold }}>
                    Card Title {i}
                  </h3>
                  <p style={{ margin: `${designTokens.space[8]} 0 0`, fontSize: designTokens.typography.fontSize.sm, color: designTokens.color.text.secondary }}>
                    Subtitle with description
                  </p>
                </div>
              }
              footer={
                <div style={{ display: 'flex', gap: designTokens.space[12], width: '100%' }}>
                  <DSButton variant="primary" size="sm" fullWidth>
                    Action
                  </DSButton>
                  <DSButton variant="outline" size="sm" fullWidth>
                    Cancel
                  </DSButton>
                </div>
              }
            >
              <p style={{ margin: 0, fontSize: designTokens.typography.fontSize.sm, color: designTokens.color.text.secondary, lineHeight: designTokens.typography.lineHeight.relaxed }}>
                This is the card content area that fills the available space. Auto Layout ensures proper spacing and alignment.
              </p>
            </DSCard>
          ))}
        </div>
      </DSAppShell>
    </div>
  );
}

// Component Variants Showcase
function ComponentShowcase() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1200px',
        background: designTokens.color.background,
        borderRadius: designTokens.radius[12],
        padding: designTokens.space[32],
        boxShadow: designTokens.shadow.lg,
      }}
    >
      <h1 style={{ marginBottom: designTokens.space[32], fontSize: designTokens.typography.fontSize['4xl'] }}>
        Component Library
      </h1>

      {/* Buttons Section */}
      <section style={{ marginBottom: designTokens.space[48] }}>
        <h2 style={{ marginBottom: designTokens.space[24], fontSize: designTokens.typography.fontSize['2xl'] }}>
          Buttons
        </h2>
        
        {/* Button Variants */}
        <div style={{ marginBottom: designTokens.space[24] }}>
          <h3 style={{ marginBottom: designTokens.space[16], fontSize: designTokens.typography.fontSize.lg, color: designTokens.color.text.secondary }}>
            Variants
          </h3>
          <div style={{ display: 'flex', gap: designTokens.space[12], flexWrap: 'wrap' }}>
            <DSButton variant="primary">Primary</DSButton>
            <DSButton variant="secondary">Secondary</DSButton>
            <DSButton variant="outline">Outline</DSButton>
            <DSButton variant="ghost">Ghost</DSButton>
          </div>
        </div>

        {/* Button Sizes */}
        <div style={{ marginBottom: designTokens.space[24] }}>
          <h3 style={{ marginBottom: designTokens.space[16], fontSize: designTokens.typography.fontSize.lg, color: designTokens.color.text.secondary }}>
            Sizes
          </h3>
          <div style={{ display: 'flex', gap: designTokens.space[12], alignItems: 'center', flexWrap: 'wrap' }}>
            <DSButton variant="primary" size="sm">Small</DSButton>
            <DSButton variant="primary" size="md">Medium</DSButton>
            <DSButton variant="primary" size="lg">Large</DSButton>
          </div>
        </div>

        {/* Button States */}
        <div style={{ marginBottom: designTokens.space[24] }}>
          <h3 style={{ marginBottom: designTokens.space[16], fontSize: designTokens.typography.fontSize.lg, color: designTokens.color.text.secondary }}>
            States
          </h3>
          <div style={{ display: 'flex', gap: designTokens.space[12], flexWrap: 'wrap' }}>
            <DSButton variant="primary">Default</DSButton>
            <DSButton variant="primary" disabled>Disabled</DSButton>
            <DSButton variant="primary" fullWidth>Full Width</DSButton>
          </div>
        </div>
      </section>

      {/* Inputs Section */}
      <section style={{ marginBottom: designTokens.space[48] }}>
        <h2 style={{ marginBottom: designTokens.space[24], fontSize: designTokens.typography.fontSize['2xl'] }}>
          Inputs
        </h2>
        
        <div style={{ display: 'grid', gap: designTokens.space[24], maxWidth: '600px' }}>
          <DSInput label="Default Input" placeholder="Enter text..." />
          <DSInput label="Small Input" size="sm" placeholder="Small size..." />
          <DSInput label="Large Input" size="lg" placeholder="Large size..." />
          <DSInput label="Error State" error helperText="This field has an error" placeholder="Error state..." />
          <DSInput label="Disabled" disabled placeholder="Disabled..." />
          <DSInput label="With Helper Text" helperText="This is helpful information" placeholder="Input with help..." />
        </div>
      </section>

      {/* Cards Section */}
      <section style={{ marginBottom: designTokens.space[48] }}>
        <h2 style={{ marginBottom: designTokens.space[24], fontSize: designTokens.typography.fontSize['2xl'] }}>
          Cards
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: designTokens.space[24] }}>
          <DSCard variant="default" header={<h3 style={{ margin: 0 }}>Default Card</h3>}>
            <p style={{ margin: 0, color: designTokens.color.text.secondary }}>
              Content goes here with default styling
            </p>
          </DSCard>

          <DSCard variant="outlined" header={<h3 style={{ margin: 0 }}>Outlined Card</h3>}>
            <p style={{ margin: 0, color: designTokens.color.text.secondary }}>
              Content with border outline
            </p>
          </DSCard>

          <DSCard
            variant="elevated"
            interactive
            header={<h3 style={{ margin: 0 }}>Elevated Card</h3>}
            footer={
              <DSButton variant="primary" size="sm" fullWidth>
                Action
              </DSButton>
            }
          >
            <p style={{ margin: 0, color: designTokens.color.text.secondary }}>
              Interactive card with shadow
            </p>
          </DSCard>
        </div>
      </section>

      {/* Design Tokens Reference */}
      <section>
        <h2 style={{ marginBottom: designTokens.space[24], fontSize: designTokens.typography.fontSize['2xl'] }}>
          Design Tokens
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: designTokens.space[24] }}>
          {/* Spacing */}
          <div>
            <h3 style={{ marginBottom: designTokens.space[12], fontSize: designTokens.typography.fontSize.base }}>Spacing</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.space[8] }}>
              {Object.entries(designTokens.space).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: designTokens.space[12] }}>
                  <div style={{ width: value, height: '16px', background: designTokens.color.primary[400], borderRadius: designTokens.radius[4] }} />
                  <span style={{ fontSize: designTokens.typography.fontSize.xs }}>{key}: {value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 style={{ marginBottom: designTokens.space[12], fontSize: designTokens.typography.fontSize.base }}>Primary Colors</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.space[8] }}>
              {Object.entries(designTokens.color.primary).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: designTokens.space[12] }}>
                  <div style={{ width: '24px', height: '24px', background: value, borderRadius: designTokens.radius[4], border: `1px solid ${designTokens.color.border}` }} />
                  <span style={{ fontSize: designTokens.typography.fontSize.xs }}>{key}: {value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div>
            <h3 style={{ marginBottom: designTokens.space[12], fontSize: designTokens.typography.fontSize.base }}>Border Radius</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.space[8] }}>
              {Object.entries(designTokens.radius).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: designTokens.space[12] }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: designTokens.color.primary[400], 
                    borderRadius: value === '9999px' ? '50%' : value,
                  }} />
                  <span style={{ fontSize: designTokens.typography.fontSize.xs }}>{key}: {value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
