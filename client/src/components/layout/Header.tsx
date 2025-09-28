import { Search, User, LogOut, Settings, UserCircle, Zap, Clock, Calendar, CheckCircle, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
// Removed animation context import
import { getWeatherIcon } from '@/utils/weatherIcons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  // Removed animation functionality
  const navigate = useNavigate()
  const location = useLocation()

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
    enabled: !isDashboard, // Only fetch weather if not on dashboard
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
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
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
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
                        navigate('/ai-assistant')
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
                          Get AI-powered help and advice
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        AI
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
          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                Energy Level: {user?.energyLevel ?? 5}/10
              </p>
            </div>

            {/* Weather Display - only show if not on dashboard */}
            {!isDashboard && currentWeatherData && (
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
                           {currentWeatherData.weather?.location?.split(',')[0] || 'Current'}
                         </div>
                </div>
              </div>
            )}

            {/* Energy Animation - Combined Super Saiyan + God Level - only show if not on dashboard */}
            {!isDashboard && (
              <div className="relative">

                {/* Multi-layered Energy Aura - God Level progression */}
                <div className="relative">
                  {/* Base aura - Super Saiyan foundation */}
                  <div 
                    className={`absolute inset-0 rounded-full ${(user?.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/25 to-yellow-600/35 animate-pulse' : ''}`} 
                    style={{ 
                      width: `${100 + ((user?.energyLevel ?? 5) * 25)}%`,
                      height: `${100 + ((user?.energyLevel ?? 5) * 25)}%`,
                      left: `-${((user?.energyLevel ?? 5) * 12.5)}%`,
                      top: `-${((user?.energyLevel ?? 5) * 12.5)}%`,
                      animationDuration: `${2.2 - ((user?.energyLevel ?? 5) * 0.15)}s`
                    }}
                  >
                  </div>
                  
                  {/* Secondary aura - Super Saiyan power */}
                  {(user?.energyLevel ?? 5) >= 4 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/20 to-yellow-500/30 animate-ping" 
                      style={{ 
                        width: `${130 + ((user?.energyLevel ?? 5) * 18)}%`, 
                        height: `${130 + ((user?.energyLevel ?? 5) * 18)}%`,
                        left: `-${15 + ((user?.energyLevel ?? 5) * 9)}%`,
                        top: `-${15 + ((user?.energyLevel ?? 5) * 9)}%`,
                        animationDuration: `${2.8 - ((user?.energyLevel ?? 5) * 0.18)}s`
                      }}
                    >
                    </div>
                  )}
                  
                  {/* Tertiary aura - God Level transcendence */}
                  {(user?.energyLevel ?? 5) >= 7 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200/15 to-yellow-400/25 animate-pulse" 
                      style={{ 
                        width: `${160 + ((user?.energyLevel ?? 5) * 12)}%`, 
                        height: `${160 + ((user?.energyLevel ?? 5) * 12)}%`,
                        left: `-${30 + ((user?.energyLevel ?? 5) * 6)}%`,
                        top: `-${30 + ((user?.energyLevel ?? 5) * 6)}%`,
                        animationDuration: `${1.8 - ((user?.energyLevel ?? 5) * 0.12)}s`
                      }}
                    >
                    </div>
                  )}

                  {/* God Level Divine Aura - Ultimate power */}
                  {(user?.energyLevel ?? 5) >= 9 && (
                    <div 
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-100/10 to-yellow-300/20 animate-ping" 
                      style={{ 
                        width: `${200 + ((user?.energyLevel ?? 5) * 8)}%`, 
                        height: `${200 + ((user?.energyLevel ?? 5) * 8)}%`,
                        left: `-${50 + ((user?.energyLevel ?? 5) * 4)}%`,
                        top: `-${50 + ((user?.energyLevel ?? 5) * 4)}%`,
                        animationDuration: `${1.5 - ((user?.energyLevel ?? 5) * 0.08)}s`
                      }}
                    >
                    </div>
                  )}
                </div>

                {/* Main lightning bolt - Fill effect based on energy level - CLICKABLE TOGGLE */}
                <button 
                  className="relative w-4 h-4 cursor-pointer hover:scale-110 transition-transform duration-200"
                  onClick={() => {}}
                  title="Energy Level Display"
                >
                  {/* Background lightning bolt (empty) */}
                  <Zap 
                    className="absolute inset-0 w-4 h-4 text-gray-300 dark:text-gray-600"
                  />
                  {/* Filled lightning bolt based on energy level */}
                  <Zap 
                    className={`absolute inset-0 w-4 h-4 ${
                      (user?.energyLevel ?? 5) >= 10 ? 'text-yellow-200' : 
                      (user?.energyLevel ?? 5) >= 9 ? 'text-yellow-300' : 
                      (user?.energyLevel ?? 5) >= 7 ? 'text-yellow-400' : 
                      (user?.energyLevel ?? 5) >= 5 ? 'text-yellow-500' : 
                      (user?.energyLevel ?? 5) >= 3 ? 'text-yellow-600' : 
                      'text-primary'
                    } opacity-70`} 
                    style={{
                      clipPath: `polygon(0% 0%, ${((user?.energyLevel ?? 5) / 10) * 100}% 0%, ${((user?.energyLevel ?? 5) / 10) * 100}% 100%, 0% 100%)`
                    }}
                  />
                </button>


                {/* Animation effects removed */}
                {false && (
                  <>
                    {/* GROUND-BREAKING EFFECTS - Super Saiyan Style */}
                    <div className="absolute -bottom-6 left-0 w-full h-6 overflow-hidden">
                      {/* Ground pieces flying up - Super Saiyan style */}
                      {Array.from({ length: Math.min(Math.floor(((user?.energyLevel ?? 5) - 2) * 2), 12) }, (_, i) => (
                        <div 
                          key={i}
                          className={`absolute bottom-0 bg-gradient-to-t from-yellow-800 to-yellow-500 rounded-sm`}
                          style={{
                            left: `${3 + (i * 4)}px`,
                            width: `${0.4 + (i % 3) * 0.2}rem`,
                            height: `${0.4 + (i % 3) * 0.2}rem`,
                            animation: `bounce ${1.2 - ((user?.energyLevel ?? 5) * 0.08)}s ease-in-out infinite ${i * 0.08}s`,
                            zIndex: 1
                          }}
                        >
                          {/* Inner glow effect */}
                          <div className="w-full h-full bg-gradient-to-t from-yellow-600 to-yellow-300 rounded-sm opacity-80"></div>
                        </div>
                      ))}
                    </div>

                    {/* SUPER SAIYAN ENERGY SHOCKWAVES - Level 5+ */}
                    {(user?.energyLevel ?? 5) >= 5 && (
                      <>
                        {/* Primary shockwave */}
                        <div 
                          className="absolute inset-0 rounded-full border-2 border-yellow-400/60 animate-ping"
                          style={{
                            width: `${60 + ((user?.energyLevel ?? 5) * 6)}px`,
                            height: `${60 + ((user?.energyLevel ?? 5) * 6)}px`,
                            left: `${-30 - ((user?.energyLevel ?? 5) * 3)}px`,
                            top: `${-30 - ((user?.energyLevel ?? 5) * 3)}px`,
                            animationDuration: `${2.5 - ((user?.energyLevel ?? 5) * 0.2)}s`,
                            zIndex: 2
                          }}
                        />
                        {/* Secondary shockwave */}
                        <div 
                          className="absolute inset-0 rounded-full border border-yellow-300/40 animate-ping"
                          style={{
                            width: `${90 + ((user?.energyLevel ?? 5) * 9)}px`,
                            height: `${90 + ((user?.energyLevel ?? 5) * 9)}px`,
                            left: `${-45 - ((user?.energyLevel ?? 5) * 4.5)}px`,
                            top: `${-45 - ((user?.energyLevel ?? 5) * 4.5)}px`,
                            animationDuration: `${3 - ((user?.energyLevel ?? 5) * 0.25)}s`,
                            animationDelay: '0.5s',
                            zIndex: 2
                          }}
                        />
                      </>
                    )}

                    {/* SUPER SAIYAN HAIR-STANDING-UP EFFECT - Level 7+ */}
                    {(user?.energyLevel ?? 5) >= 7 && (
                      <>
                        {/* Vertical energy streams shooting upward */}
                        {Array.from({ length: 6 }, (_, i) => (
                          <div
                            key={`hair-${i}`}
                            className="absolute bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-full animate-pulse"
                            style={{
                              width: `${0.8 + ((user?.energyLevel ?? 5) * 0.15)}px`,
                              height: `${12 + ((user?.energyLevel ?? 5) * 1.5)}px`,
                              left: `${2 + (i * 2)}px`,
                              top: `${-12 - ((user?.energyLevel ?? 5) * 1.5)}px`,
                              animationDuration: `${1.2 - ((user?.energyLevel ?? 5) * 0.1)}s`,
                              animationDelay: `${i * 0.1}s`,
                              zIndex: 3,
                              filter: 'drop-shadow(0 0 3px rgba(255, 255, 0, 0.8))'
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* SUPER SAIYAN POWER LEVEL INDICATORS - Level 8+ */}
                    {(user?.energyLevel ?? 5) >= 8 && (
                      <>
                        {/* Power level text effect */}
                        <div 
                          className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-yellow-300 animate-pulse"
                          style={{
                            animationDuration: `${0.8 - ((user?.energyLevel ?? 5) * 0.05)}s`,
                            filter: 'drop-shadow(0 0 4px rgba(255, 255, 0, 0.9))',
                            zIndex: 4
                          }}
                        >
                          POWER: {((user?.energyLevel ?? 5) * 1000).toLocaleString()}
                        </div>
                      </>
                    )}

                    {/* SUPER SAIYAN TRANSFORMATION BURST - Level 9+ */}
                    {(user?.energyLevel ?? 5) >= 9 && (
                      <>
                        {/* Explosive energy burst */}
                        <div 
                          className="absolute inset-0 rounded-full bg-gradient-radial from-yellow-200/80 via-yellow-400/40 to-transparent animate-ping"
                          style={{
                            width: `${150 + ((user?.energyLevel ?? 5) * 15)}px`,
                            height: `${150 + ((user?.energyLevel ?? 5) * 15)}px`,
                            left: `${-75 - ((user?.energyLevel ?? 5) * 7.5)}px`,
                            top: `${-75 - ((user?.energyLevel ?? 5) * 7.5)}px`,
                            animationDuration: `${1.5 - ((user?.energyLevel ?? 5) * 0.1)}s`,
                            zIndex: 1
                          }}
                        />
                        {/* Divine energy particles */}
                        {Array.from({ length: 12 }, (_, i) => {
                          const angle = (i * 30) % 360;
                          const radius = 25 + ((user?.energyLevel ?? 5) * 2.5);
                          const x = Math.cos(angle * Math.PI / 180) * radius;
                          const y = Math.sin(angle * Math.PI / 180) * radius;
                          
                          return (
                            <div
                              key={`divine-${i}`}
                              className="absolute w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ping"
                              style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                animationDuration: `${1 - ((user?.energyLevel ?? 5) * 0.05)}s`,
                                animationDelay: `${i * 0.05}s`,
                                zIndex: 3,
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 0, 1))'
                              }}
                            />
                          );
                        })}
                      </>
                    )}

                    {/* SUPER SAIYAN MAXIMUM POWER - Level 10 */}
                    {(user?.energyLevel ?? 5) >= 10 && (
                      <>
                        {/* Ultimate transformation aura */}
                        <div 
                          className="absolute inset-0 rounded-full bg-gradient-conic from-yellow-200 via-yellow-400 to-yellow-200 animate-spin"
                          style={{
                            width: `${200}px`,
                            height: `${200}px`,
                            left: `${-100}px`,
                            top: `${-100}px`,
                            animationDuration: '2s',
                            zIndex: 1,
                            opacity: 0.3
                          }}
                        />
                        {/* Energy storm effect */}
                        <div 
                          className="absolute inset-0 rounded-full border-3 border-yellow-300/80 animate-pulse"
                          style={{
                            width: `${180}px`,
                            height: `${180}px`,
                            left: `${-90}px`,
                            top: `${-90}px`,
                            animationDuration: '0.5s',
                            zIndex: 2
                          }}
                        />
                        {/* MAXIMUM POWER text */}
                        <div 
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-black text-yellow-200 animate-bounce"
                          style={{
                            animationDuration: '0.8s',
                            filter: 'drop-shadow(0 0 6px rgba(255, 255, 0, 1))',
                            zIndex: 5
                          }}
                        >
                          MAX POWER!
                        </div>
                      </>
                    )}

                    {/* Multi-layered Energy Aura - Super Saiyan */}
                    {/* Base aura - grows with energy level */}
                    <div 
                      className={`absolute inset-0 rounded-full ${(user?.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/30 animate-pulse' : ''}`} 
                      style={{
                        width: `${100 + ((user?.energyLevel ?? 5) * 20)}%`,
                        height: `${100 + ((user?.energyLevel ?? 5) * 20)}%`,
                        left: `${-((user?.energyLevel ?? 5) * 10)}%`,
                        top: `${-((user?.energyLevel ?? 5) * 10)}%`,
                        animationDuration: `${2 - ((user?.energyLevel ?? 5) * 0.15)}s`,
                        zIndex: 1
                      }}
                    />

                    {/* Secondary aura - level 4+ */}
                    {(user?.energyLevel ?? 5) >= 4 && (
                      <div 
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/15 to-yellow-500/25 animate-ping"
                        style={{
                          width: `${120 + ((user?.energyLevel ?? 5) * 15)}%`,
                          height: `${120 + ((user?.energyLevel ?? 5) * 15)}%`,
                          left: `${-((user?.energyLevel ?? 5) * 7.5)}%`,
                          top: `${-((user?.energyLevel ?? 5) * 7.5)}%`,
                          animationDuration: `${1.8 - ((user?.energyLevel ?? 5) * 0.12)}s`
                        }}
                      />
                    )}

                    {/* Tertiary aura - level 7+ */}
                    {(user?.energyLevel ?? 5) >= 7 && (
                      <div 
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200/10 to-yellow-400/20 animate-pulse"
                        style={{
                          width: `${140 + ((user?.energyLevel ?? 5) * 10)}%`,
                          height: `${140 + ((user?.energyLevel ?? 5) * 10)}%`,
                          left: `${-((user?.energyLevel ?? 5) * 5)}%`,
                          top: `${-((user?.energyLevel ?? 5) * 5)}%`,
                          animationDuration: `${1.5 - ((user?.energyLevel ?? 5) * 0.1)}s`
                        }}
                      />
                    )}

                    {/* Divine aura - level 9+ */}
                    {(user?.energyLevel ?? 5) >= 9 && (
                      <div 
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-100/5 to-yellow-300/15 animate-ping"
                        style={{
                          width: `${160 + ((user?.energyLevel ?? 5) * 5)}%`,
                          height: `${160 + ((user?.energyLevel ?? 5) * 5)}%`,
                          left: `${-((user?.energyLevel ?? 5) * 2.5)}%`,
                          top: `${-((user?.energyLevel ?? 5) * 2.5)}%`,
                          animationDuration: `${1.2 - ((user?.energyLevel ?? 5) * 0.08)}s`,
                          filter: 'drop-shadow(0 0 10px rgba(255, 255, 0, 0.6))'
                        }}
                      />
                    )}
                    {Array.from({ length: Math.min(Math.floor(((user?.energyLevel ?? 5) - 2) * 2.5), 16) }, (_, i) => {
                      const angle = (i * 22.5) % 360; // More sparks, tighter distribution
                      const radius = 12 + ((user?.energyLevel ?? 5) * 2.5);
                      const x = Math.cos(angle * Math.PI / 180) * radius;
                      const y = Math.sin(angle * Math.PI / 180) * radius;
                      const size = 1.2 + ((user?.energyLevel ?? 5) * 0.15);
                      const opacity = 0.4 + ((user?.energyLevel ?? 5) * 0.04);
                      const animationSpeed = 1.8 - ((user?.energyLevel ?? 5) * 0.12);

                      return (
                        <svg 
                          key={`inner-${i}`}
                          className={`absolute text-yellow-400`}
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${size}rem`,
                            height: `${size}rem`,
                            animation: `ping ${animationSpeed}s cubic-bezier(0, 0, 0.2, 1) infinite ${i * 0.05}s`,
                            opacity: opacity,
                            zIndex: 1
                          }}
                          viewBox="0 0 24 24" 
                          fill="none"
                        >
                          <path d="M8 2L5 8h3l-2 4 4-5h-2z" fill="currentColor" />
                        </svg>
                      );
                    })}

                    {/* Outer ring sparks - God Level */}
                    {(user?.energyLevel ?? 5) >= 6 && (
                      <>
                        {Array.from({ length: Math.min(Math.floor(((user?.energyLevel ?? 5) - 5) * 3), 20) }, (_, i) => {
                          const angle = (i * 18) % 360; // Even more sparks for God Level
                          const radius = 20 + ((user?.energyLevel ?? 5) * 3);
                          const x = Math.cos(angle * Math.PI / 180) * radius;
                          const y = Math.sin(angle * Math.PI / 180) * radius;
                          const size = 1.8 + ((user?.energyLevel ?? 5) * 0.2);
                          const opacity = 0.3 + ((user?.energyLevel ?? 5) * 0.03);
                          const animationSpeed = 1.5 - ((user?.energyLevel ?? 5) * 0.1);

                          return (
                            <svg 
                              key={`outer-${i}`}
                              className={`absolute text-yellow-300`}
                              style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${size}rem`,
                                height: `${size}rem`,
                                animation: `ping ${animationSpeed}s cubic-bezier(0, 0, 0.2, 1) infinite ${i * 0.03}s`,
                                opacity: opacity,
                                filter: (user?.energyLevel ?? 5) >= 9 ? 'drop-shadow(0 0 4px rgba(255, 255, 0, 0.6))' : 'none',
                                zIndex: -1
                              }}
                              viewBox="0 0 24 24" 
                              fill="none"
                            >
                              <path d="M8 2L5 8h3l-2 4 4-5h-2z" fill="currentColor" />
                            </svg>
                          );
                        })}
                      </>
                    )}

                    {/* Divine sparks - Ultimate God Level */}
                    {(user?.energyLevel ?? 5) >= 10 && (
                      <>
                        {Array.from({ length: 8 }, (_, i) => {
                          const angle = (i * 45) % 360;
                          const radius = 30;
                          const x = Math.cos(angle * Math.PI / 180) * radius;
                          const y = Math.sin(angle * Math.PI / 180) * radius;
                          const size = 2.5;
                          const opacity = 0.6;

                          return (
                            <svg 
                              key={`divine-${i}`}
                              className={`absolute text-yellow-200`}
                              style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${size}rem`,
                                height: `${size}rem`,
                                animation: `ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite ${i * 0.05}s`,
                                opacity: opacity,
                                filter: 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))',
                                zIndex: -1
                              }}
                              viewBox="0 0 24 24" 
                              fill="none"
                            >
                              <path d="M8 2L5 8h3l-2 4 4-5h-2z" fill="currentColor" />
                            </svg>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            
            
            {/* Test button - navigation */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => navigate('/profile')}
              title="Go to Profile"
            >
              <User className="w-5 h-5" />
            </Button>
            
            {/* Keep logout button separate for now */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logout()}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
