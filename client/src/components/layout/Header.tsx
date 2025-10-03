import { Search, User, LogOut, Settings, UserCircle, Zap, Clock, Calendar, CheckCircle, MessageSquare, Loader2, Trophy, Menu, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { BriefModal } from '@/components/brief/BriefModal'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AnimatedCounter } from '@/components/AnimatedCounter'
// Removed animation context import
import { getWeatherIcon } from '@/utils/weatherIcons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAchievements } from '@/contexts/AchievementsContext'
import { useSidebar } from '@/contexts/SidebarContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useSidebar()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [showMorningBrief, setShowMorningBrief] = useState(false)
  const [showEveningBrief, setShowEveningBrief] = useState(false)
  // Removed animation functionality
  const navigate = useNavigate()
  const location = useLocation()
  const { showAchievements } = useAchievements()

  // Check if we're on the dashboard
  const isDashboard = location.pathname === '/dashboard'

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search query
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['header-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) return { tasks: [], events: [], totalResults: 0 }
      
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(debouncedQuery.trim())}`)
        return response.data.data || response.data
      } catch (error) {
        console.error('Search error:', error)
        return { tasks: [], events: [], totalResults: 0 }
      }
    },
    enabled: !!debouncedQuery.trim() && debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied or failed:', error)
          // Fallback to user's saved location or default
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    }
  }, [])

  // Weather query for header - only fetch if not on dashboard
  const { data: currentWeatherData } = useQuery({
    queryKey: ['current-weather', userLocation],
    queryFn: async () => {
      let locationParam = ''
      if (userLocation) {
        locationParam = `?lat=${userLocation.lat}&lon=${userLocation.lon}`
      }
      const response = await api.get(`/location/weather/current${locationParam}`)
      return response.data.data || response.data
    },
    enabled: false, // Disabled for performance
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })

  // Achievements query for header - only fetch if not on dashboard
  const { data: gamificationData } = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: async () => {
      const response = await api.get('/gamification')
      return response.data.data
    },
    enabled: false, // Disabled for performance
    staleTime: 30 * 1000, // 30 seconds
  })


  // Search handlers
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setSearchQuery('')
      setShowDropdown(false)
    }
  }, [navigate])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }, [searchQuery, handleSearch])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowDropdown(value.length >= 2)
  }, [])

  const handleInputFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowDropdown(true)
    }
  }, [searchQuery])

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow clicking on results
    setTimeout(() => setShowDropdown(false), 200)
  }, [])

  // Check if query looks like AI question
  const isAIQuery = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return query.includes('?') || 
           query.startsWith('what') || 
           query.startsWith('how') || 
           query.startsWith('why') || 
           query.startsWith('when') || 
           query.startsWith('where') ||
           query.startsWith('can you') ||
           query.startsWith('help me') ||
           query.includes('advice') ||
           query.includes('suggest')
  }, [searchQuery])

  const totalResults = searchResults?.totalResults || 0
  const tasks = searchResults?.tasks || []
  const events = searchResults?.events || []

  return (
    <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="lg:hidden mr-2"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, events, or ask AI..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="pl-10"
            />
            
            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {/* AI Query Suggestion */}
                  {isAIQuery && searchQuery.length >= 2 && (
                    <div 
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}&ai=true`)
                        setSearchQuery('')
                        setShowDropdown(false)
                      }}
                    >
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Ask AI: "{searchQuery}"
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Get AI-powered answer with citations
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        AI Search
                      </Badge>
                    </div>
                  )}

                  {/* Loading State */}
                  {isSearching && (
                    <div className="flex items-center gap-3 p-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <div className="text-sm text-gray-500">Searching...</div>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isSearching && debouncedQuery && (
                    <>
                      {/* Tasks */}
                      {tasks.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <CheckCircle className="w-4 h-4" />
                            Tasks ({tasks.length})
                          </div>
                          {tasks.slice(0, 3).map((task: any) => (
                            <div 
                              key={task.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                navigate('/tasks')
                                setSearchQuery('')
                                setShowDropdown(false)
                              }}
                            >
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {task.description}
                                  </div>
                                )}
                              </div>
                              {task.status && (
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Events */}
                      {events.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <Calendar className="w-4 h-4" />
                            Events ({events.length})
                          </div>
                          {events.slice(0, 3).map((event: any) => (
                            <div 
                              key={event.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                              onClick={() => {
                                navigate('/calendar')
                                setSearchQuery('')
                                setShowDropdown(false)
                              }}
                            >
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {event.title}
                                </div>
                                {event.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {event.description}
                                  </div>
                                )}
                              </div>
                              {event.date && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(event.date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {totalResults === 0 && tasks.length === 0 && events.length === 0 && (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                          <div className="text-sm">No results found for "{debouncedQuery}"</div>
                          <div className="text-xs mt-1">Try different keywords or ask AI for help</div>
                        </div>
                      )}

                      {/* View All Results */}
                      {(totalResults > 0 || isAIQuery) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                          <div 
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                            onClick={() => handleSearch(searchQuery)}
                          >
                            <Search className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                View all results for "{searchQuery}"
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {totalResults > 0 ? `${totalResults} total results` : 'Search everything'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Minimum Characters */}
                  {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                      <div className="text-sm">Type at least 2 characters to search</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dashboard Layout: Brief → End Day → Notifications → Name/Energy → Profile → Logout */}
          {isDashboard ? (
            <>
              {/* Brief Button - Coming Soon */}
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="flex items-center gap-1 px-3 opacity-60"
                title="Morning Brief - Coming Soon"
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Brief</span>
                <span className="text-xs text-muted-foreground ml-1">(Soon)</span>
              </Button>

              {/* End Day Button - Coming Soon */}
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="flex items-center gap-1 px-3 opacity-60"
                title="Evening Reflection - Coming Soon"
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm font-medium">End Day</span>
                <span className="text-xs text-muted-foreground ml-1">(Soon)</span>
              </Button>

              {/* Notifications - Coming Soon */}
              <Button
                variant="ghost"
                size="icon"
                disabled
                className="opacity-60"
                title="Notifications - Coming Soon"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Energy Level: {user?.energyLevel ?? 5}/10
                </p>
              </div>

              {/* Profile Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => navigate('/profile')}
                title="Go to Profile"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            /* Non-Dashboard Layout: Notifications → Weather → Energy → Points → Profile → Logout */
            <>
              {/* Notifications */}
              <NotificationCenter />

              {/* Weather Display - only show if not on dashboard */}
              {currentWeatherData && (
                <div className="flex items-center space-x-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="relative w-5 h-5">
                    {getWeatherIcon(
                      currentWeatherData.weather?.condition || currentWeatherData.condition,
                      currentWeatherData.weather?.emoji || currentWeatherData.emoji
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {currentWeatherData.weather?.temperature || currentWeatherData.temperature}°
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {(currentWeatherData.weather?.location || currentWeatherData.location || 'Loading...')
                        .split(',')[0]
                        .trim()}
                    </div>
                  </div>
                </div>
              )}

              {/* Energy Display - Better integrated */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="relative">
                  {/* Simplified energy aura */}
                  <div 
                    className={`absolute inset-0 rounded-full ${(user?.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/30 to-yellow-600/40 animate-pulse' : ''}`} 
                    style={{ 
                      width: '120%',
                      height: '120%',
                      left: '-10%',
                      top: '-10%',
                      animationDuration: '2s'
                    }}
                  />
                  
                  {/* Main lightning bolt - Larger and more visible */}
                  <Zap 
                    className={`w-5 h-5 ${
                      (user?.energyLevel ?? 5) >= 10 ? 'text-yellow-200' : 
                      (user?.energyLevel ?? 5) >= 9 ? 'text-yellow-300' : 
                      (user?.energyLevel ?? 5) >= 7 ? 'text-yellow-400' : 
                      (user?.energyLevel ?? 5) >= 5 ? 'text-yellow-500' : 
                      (user?.energyLevel ?? 5) >= 3 ? 'text-yellow-600' : 
                      'text-yellow-700'
                    }`}
                    title={`Energy Level: ${user?.energyLevel ?? 5}/10`}
                  />
                </div>
                
                {/* Energy level number */}
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  {user?.energyLevel ?? 5}
                </span>
              </div>

              {/* Points Display - Better integrated */}
              {gamificationData && showAchievements && (
                <div 
                  onClick={() => navigate('/gamification')}
                  className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 transition-colors"
                  title="View Achievements"
                >
                  <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <AnimatedCounter 
                    value={gamificationData?.stats?.totalPoints || 0}
                    duration={1000}
                    className="text-sm font-semibold text-blue-700 dark:text-blue-300"
                  />
                </div>
              )}

              {/* Profile Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => navigate('/profile')}
                title="Go to Profile"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Brief Modals */}
      <BriefModal 
        isOpen={showMorningBrief} 
        onClose={() => setShowMorningBrief(false)} 
        type="morning" 
      />
      <BriefModal 
        isOpen={showEveningBrief} 
        onClose={() => setShowEveningBrief(false)} 
        type="evening" 
      />
    </header>
  )
}
