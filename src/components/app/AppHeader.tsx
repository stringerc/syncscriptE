import { Search, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAiPageChromeMobileToolbar } from '@/contexts/AiPageChromeContext'

export function AppHeader() {
  const { user, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const aiMobileToolbar = useAiPageChromeMobileToolbar()
  const showAiMobileChrome = location.pathname === '/app/ai-assistant' && aiMobileToolbar

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-card border-b border-border flex flex-col">
      {showAiMobileChrome ? (
        <div className="w-full lg:hidden border-b border-border bg-muted/30 px-6 py-2">{aiMobileToolbar}</div>
      ) : null}
      <div className="px-6 py-4 flex items-center justify-between">
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

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">
              Energy Level: {user?.energyLevel || 'Not set'}/10
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/app/profile')}
            title="Go to Profile"
          >
            <User className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
