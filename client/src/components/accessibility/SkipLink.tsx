/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and jump to main content
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        background: '#3b82f6',
        color: 'white',
        padding: '8px 16px',
        textDecoration: 'none',
        fontWeight: 600,
        zIndex: 100,
        borderRadius: '0 0 4px 0',
        transition: 'top 0.2s'
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px'
      }}
    >
      Skip to main content
    </a>
  )
}
