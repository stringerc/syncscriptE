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
  const navigate = useNavigate()
  const location = useLocation()

  // Check if we're on the dashboard
  const isDashboard = location.pathname === '/'

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
  const getWeatherIcon = useCallback((condition: string) => {
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
                  {getWeatherIcon(currentWeatherData.condition)}
                </span>
                <div className="text-xs">
                  <div className="font-medium text-slate-700 dark:text-slate-300">
                    {currentWeatherData.temperature}°
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {currentWeatherData.location?.split(',')[0] || 'Current'}
                  </div>
                </div>
              </div>
            )}

            {/* Energy Animation - only show if not on dashboard */}
            {!isDashboard && (
              <div className="relative">
              {/* Ground-breaking effects - gradual progression */}
              {(user?.energyLevel ?? 5) >= 3 && (
                <>
                  <div className="absolute -bottom-6 left-0 w-full h-6 overflow-hidden">
                    {/* Ground pieces - number increases with energy level */}
                    {Array.from({ length: Math.min(Math.floor(((user?.energyLevel ?? 5) - 2) * 1.5), 8) }, (_, i) => (
                      <div 
                        key={i}
                        className={`absolute bottom-0 bg-yellow-600 rounded-sm animate-bounce`}
                        style={{
                          left: `${5 + (i * 6)}px`,
                          width: `${0.3 + (i % 2) * 0.3}rem`,
                          height: `${0.3 + (i % 2) * 0.3}rem`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${1.5 - ((user?.energyLevel ?? 5) * 0.1)}s`
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-t from-yellow-800 to-yellow-500 rounded-sm"></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Main energy aura - gradual progression */}
              <div className="relative">
                {/* Base aura - grows with energy level */}
                <div 
                  className={`absolute inset-0 rounded-full ${(user?.energyLevel ?? 5) >= 2 ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/30 animate-pulse' : ''}`} 
                  style={{ 
                    width: `${100 + ((user?.energyLevel ?? 5) * 20)}%`,
                    height: `${100 + ((user?.energyLevel ?? 5) * 20)}%`,
                    left: `-${((user?.energyLevel ?? 5) * 10)}%`,
                    top: `-${((user?.energyLevel ?? 5) * 10)}%`,
                    animationDuration: `${2.5 - ((user?.energyLevel ?? 5) * 0.2)}s`
                  }}
                >
                </div>
                
                {/* Secondary aura - appears at level 4+ */}
                {(user?.energyLevel ?? 5) >= 4 && (
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-300/15 to-yellow-500/25 animate-ping" 
                    style={{ 
                      width: `${120 + ((user?.energyLevel ?? 5) * 15)}%`, 
                      height: `${120 + ((user?.energyLevel ?? 5) * 15)}%`,
                      left: `-${10 + ((user?.energyLevel ?? 5) * 7.5)}%`,
                      top: `-${10 + ((user?.energyLevel ?? 5) * 7.5)}%`,
                      animationDuration: `${3 - ((user?.energyLevel ?? 5) * 0.2)}s`
                    }}
                  >
                  </div>
                )}
                
                {/* Tertiary aura - appears at level 7+ */}
                {(user?.energyLevel ?? 5) >= 7 && (
                  <div 
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-200/10 to-yellow-400/20 animate-pulse" 
                    style={{ 
                      width: `${140 + ((user?.energyLevel ?? 5) * 10)}%`, 
                      height: `${140 + ((user?.energyLevel ?? 5) * 10)}%`,
                      left: `-${20 + ((user?.energyLevel ?? 5) * 5)}%`,
                      top: `-${20 + ((user?.energyLevel ?? 5) * 5)}%`,
                      animationDuration: `${1.5 - ((user?.energyLevel ?? 5) * 0.1)}s`
                    }}
                  >
                  </div>
                )}
              </div>

              {/* Main lightning bolt - gradual color progression */}
              <Zap 
                className={`w-4 h-4 ${
                  (user?.energyLevel ?? 5) >= 9 ? 'text-yellow-300 animate-pulse' : 
                  (user?.energyLevel ?? 5) >= 7 ? 'text-yellow-400 animate-pulse' : 
                  (user?.energyLevel ?? 5) >= 5 ? 'text-yellow-500' : 
                  (user?.energyLevel ?? 5) >= 3 ? 'text-yellow-600' : 
                  'text-primary'
                }`} 
                style={(user?.energyLevel ?? 5) >= 7 ? { animationDuration: `${0.8 - ((user?.energyLevel ?? 5) * 0.05)}s` } : {}}
              />
              
              {/* Super Saiyan sparks - gradual progression */}
              {(user?.energyLevel ?? 5) >= 3 && (
                <>
                  {/* Generate sparks based on energy level */}
                  {Array.from({ length: Math.min(Math.floor(((user?.energyLevel ?? 5) - 2) * 2), 12) }, (_, i) => {
                    const angle = (i * 30) % 360; // Distribute sparks in a circle
                    const radius = 15 + ((user?.energyLevel ?? 5) * 3);
                    const x = Math.cos(angle * Math.PI / 180) * radius;
                    const y = Math.sin(angle * Math.PI / 180) * radius;
                    const size = 1.5 + ((user?.energyLevel ?? 5) * 0.2);
                    const opacity = 0.3 + ((user?.energyLevel ?? 5) * 0.05);
                    const animationSpeed = 2 - ((user?.energyLevel ?? 5) * 0.15);
                    
                    return (
                      <svg 
                        key={i}
                        className={`absolute text-yellow-400 animate-ping`}
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          width: `${size}rem`,
                          height: `${size}rem`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${animationSpeed}s`,
                          opacity: opacity
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
