/**
 * Registry-Based Sidebar Component
 * 
 * This component uses the navigation registry for consistent navigation
 * across the application. It's designed to replace the hardcoded sidebar
 * once the registry is fully integrated.
 */

import { NavLink } from 'react-router-dom'
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
  Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { useSidebar } from '@/contexts/SidebarContext'
import { SyncScriptLogo } from '@/components/SyncScriptLogo'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

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
  Flag
}

// Mock navigation registry data (in real implementation, this would be imported)
const navigationSections = [
  {
    title: "Core",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard"
      },
      {
        name: "Tasks",
        href: "/tasks",
        icon: "CheckSquare"
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "Calendar"
      }
    ]
  },
  {
    title: "Plan",
    items: [
      {
        name: "Projects",
        href: "/projects",
        icon: "Folder",
        featureFlag: "shareScript"
      },
      {
        name: "Templates",
        href: "/templates",
        icon: "BookTemplate",
        featureFlag: "templates"
      }
    ]
  },
  {
    title: "People",
    items: [
      {
        name: "Friends",
        href: "/friends",
        icon: "Users",
        featureFlag: "friends"
      }
    ]
  },
  {
    title: "Me",
    items: [
      {
        name: "Progress",
        href: "/gamification",
        icon: "Trophy"
      },
      {
        name: "Notifications",
        href: "/notifications",
        icon: "Bell",
        comingSoon: true,
        featureFlag: "notifications"
      },
      {
        name: "Profile",
        href: "/profile",
        icon: "User"
      },
      {
        name: "Settings",
        href: "/settings",
        icon: "Settings"
      }
    ]
  }
]

export function RegistrySidebar() {
  const { user } = useAuthStore()
  const { closeSidebar } = useSidebar()
  const queryClient = useQueryClient()
  const { flags } = useFeatureFlags()

  const prefetchData = (href: string) => {
    if (!user) return

    // Only prefetch if data is not already cached or is stale
    const queryKey = ['dashboard']
    const cachedData = queryClient.getQueryData(queryKey)
    
    if (!cachedData) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await api.get('/user/dashboard')
          return response.data
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      })
    }
  }

  const getFilteredNavigation = () => {
    return navigationSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Filter by feature flags
        if (item.featureFlag && !flags[item.featureFlag as keyof typeof flags]) {
          return false
        }
        return true
      })
    })).filter(section => section.items.length > 0)
  }

  const filteredNavigation = getFilteredNavigation()

  return (
    <aside 
      className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out data-[state=open]:translate-x-0 lg:translate-x-0" 
      onClick={closeSidebar}
    >
      <div className="flex h-14 items-center justify-between border-b px-4 lg:px-6 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <SyncScriptLogo size="sm" />
          <h1 className="text-xl font-bold text-foreground">SyncScript</h1>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {filteredNavigation.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const IconComponent = iconMap[item.icon] || Settings
                
                return (
                  <div key={item.name} className="relative">
                    {item.comingSoon ? (
                      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed">
                        <IconComponent className="h-5 w-5" />
                        {item.name}
                        <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                          Soon
                        </span>
                      </div>
                    ) : (
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                            isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                          )
                        }
                        onClick={(e) => {
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
                      >
                        <IconComponent className="h-5 w-5" />
                        {item.name}
                      </NavLink>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
