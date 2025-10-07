import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { HeaderClean } from './HeaderClean'
import { useSidebar } from '@/contexts/SidebarContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isOpen, closeSidebar } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <nav
          aria-label="Main navigation"
          className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:relative
          inset-y-0 left-0 z-50
          w-64 bg-card border-r border-border
          transition-transform duration-300 ease-in-out
          lg:transition-none
        `}>
          <Sidebar />
        </nav>

        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
            role="button"
            tabIndex={0}
            aria-label="Close navigation"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                closeSidebar()
              }
            }}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <HeaderClean />
          <main 
            id="main-content"
            className="flex-1 overflow-auto p-4 lg:p-6"
            tabIndex={-1}
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
