import { Search, User, LogOut, Settings, UserCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [animationEnabled, setAnimationEnabled] = useState(false) // Default off
  const navigate = useNavigate()
  const location = useLocation()

  // Check if we're on the dashboard
  const isDashboard = location.pathname === '/dashboard'

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


  // Weather icon function
  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Navigate to a search results page or implement search logic
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }, [navigate])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }, [searchQuery, handleSearch])

  const getWeatherIcon = useCallback((condition: string | undefined | null) => {
    if (!condition || typeof condition !== 'string') {
      return '🌤️'
    }
    
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      const hour = new Date().getHours()
      const isNight = hour >= 19 || hour < 6
      return isNight ? '🌙' : '☀️'
    }
    
    if (conditionLower.includes('cloud')) {
      return '☁️'
    }
    
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return '🌧️'
    }
    
    if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
      return '⛈️'
    }
    
    if (conditionLower.includes('snow')) {
      return '🌨️'
    }
    
    if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) {
      return '🌫️'
    }
    
    return '🌤️'
  }, [])

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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
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
                <span className="text-lg">
                  {getWeatherIcon(currentWeatherData.weather?.condition || currentWeatherData.condition)}
                </span>
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

                {/* Main lightning bolt - Fill effect based on energy level */}
                <div className="relative w-4 h-4">
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
                    } ${animationEnabled ? 'animate-pulse' : ''}`} 
                    style={{
                      clipPath: `polygon(0% 0%, ${((user?.energyLevel ?? 5) / 10) * 100}% 0%, ${((user?.energyLevel ?? 5) / 10) * 100}% 100%, 0% 100%)`,
                      ...(animationEnabled && (user?.energyLevel ?? 5) >= 7 ? { 
                        animationDuration: `${0.6 - ((user?.energyLevel ?? 5) * 0.04)}s`,
                        filter: (user?.energyLevel ?? 5) >= 9 ? 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))' : 'none'
                      } : {})
                    }}
                  />
                </div>


                {/* Super Saiyan + God Level Sparks - Combined epicness (only when animation enabled) */}
                {animationEnabled && (user?.energyLevel ?? 5) >= 3 && (
                  <>
                    {/* Inner ring sparks - Super Saiyan */}
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
                            opacity: opacity
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
                                filter: (user?.energyLevel ?? 5) >= 9 ? 'drop-shadow(0 0 4px rgba(255, 255, 0, 0.6))' : 'none'
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
                                filter: 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))'
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
            
            {/* Animation Toggle Button - Enhanced toggle design */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">
                {animationEnabled ? 'ON' : 'OFF'}
              </span>
              <Button 
                variant={animationEnabled ? "default" : "outline"}
                size="icon"
                className={`cursor-pointer transition-all duration-200 ${
                  animationEnabled 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 shadow-lg' 
                    : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                }`}
                onClick={() => setAnimationEnabled(!animationEnabled)}
                title={animationEnabled ? "Disable Energy Animation" : "Enable Energy Animation"}
              >
                <Zap className={`w-5 h-5 transition-all duration-200 ${
                  animationEnabled 
                    ? 'text-white animate-pulse' 
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              </Button>
            </div>
            
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
