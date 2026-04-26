import { ReactNode } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { AiPageChromeProvider } from '@/contexts/AiPageChromeContext'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AiPageChromeProvider>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AiPageChromeProvider>
  )
}
