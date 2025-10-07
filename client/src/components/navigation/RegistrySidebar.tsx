/**
 * Registry-Based Sidebar Component
 * 
 * This component uses the navigation registry for consistent navigation
 * across the application. It's designed to replace the hardcoded sidebar
 * once the registry is fully integrated.
 */

import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { useSidebar } from '@/contexts/SidebarContext'
import { SyncScriptLogo } from '@/components/SyncScriptLogo'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { navigationRegistry, getFilteredNavigation, NavSection, NavItem } from '@/nav/registry'
import { telemetryService } from '@/services/telemetryService'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Settings,
  Trophy,
  Bell,
  User,
  Users,
  BookTemplate,
  Folder,
  Brain,
  Flag
} from 'lucide-react'

// Icon mapping for registry icons
const iconMap: Record<string, any> = {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  Trophy,
  Bell,
  User,
  Users,
  BookTemplate,
  Folder,
  Brain,
  Flag
}

// Individual navigation item component
interface NavItemProps {
  item: NavItem
  location: any
  closeSidebar: () => void
  prefetchData: (href: string) => void
}

function NavigationItem({ item, location, closeSidebar, prefetchData }: NavItemProps) {
  const IconComponent = iconMap[item.icon] || Settings
  const isActive = location.pathname === item.href

  if (item.comingSoon) {
    return (
      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-60">
        <IconComponent className="h-5 w-5" />
        {item.name}
        <Badge variant="secondary" className="ml-auto text-xs">
          Soon
        </Badge>
      </div>
    )
  }

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground group focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:outline-none',
          isActive 
            ? 'bg-accent text-accent-foreground shadow-sm' 
            : 'text-muted-foreground hover:text-foreground'
        )
      }
      onClick={() => {
        // Record navigation click
        telemetryService.recordNavClick(item.id);
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth < 1024) {
          closeSidebar()
        }
      }}
      onMouseEnter={() => {
        if (item.href === '/dashboard') {
          prefetchData(item.href)
        }
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      <IconComponent className={cn(
        "h-5 w-5 transition-colors",
        isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <Badge 
          variant={item.badge.variant || 'default'} 
          className="ml-auto text-xs font-medium"
        >
          {item.badge.count}
        </Badge>
      )}
    </NavLink>
  )
}

export function RegistrySidebar() {
  const { user } = useAuthStore()
  const { closeSidebar } = useSidebar()
  const queryClient = useQueryClient()
  const { flags } = useFeatureFlags()
  const location = useLocation()
  
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed-sections')
    if (saved) {
      try {
        setCollapsedSections(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to parse collapsed sections from localStorage')
      }
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] }
      localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(newState))
      return newState
    })
  }

  const prefetchData = (href: string) => {
    if (!user) return

    // Only prefetch if data is not already cached or is stale
    const queryKey = ['dashboard']
    const cachedData = queryClient.getQueryData(queryKey)
    
    if (!cachedData) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await fetch('/api/user/dashboard')
          return response.json()
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    }
  }

  // Get filtered navigation using our registry
  const filteredNavigation = getFilteredNavigation(flags, user?.role || 'user')

  return (
    <aside 
      className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-in-out data-[state=open]:translate-x-0 lg:translate-x-0" 
      onClick={closeSidebar}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-4 lg:px-6 flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <SyncScriptLogo size="sm" />
          <h1 className="text-xl font-bold text-foreground">SyncScript</h1>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {filteredNavigation.map((section) => {
          const isCollapsed = collapsedSections[section.id] ?? section.defaultCollapsed
          
          return (
            <div key={section.id} className="space-y-2">
              {section.collapsible ? (
                <Collapsible open={!isCollapsed} onOpenChange={() => toggleSection(section.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-0 h-auto font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{section.title}</span>
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2 data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
                    {section.items.map((item) => (
                      <NavigationItem key={item.id} item={item} location={location} closeSidebar={closeSidebar} prefetchData={prefetchData} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavigationItem key={item.id} item={item} location={location} closeSidebar={closeSidebar} prefetchData={prefetchData} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
