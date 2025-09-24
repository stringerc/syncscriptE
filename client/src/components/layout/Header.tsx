import { Search, User, LogOut, Settings, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationsDropdown } from '@/components/NotificationsDropdown'
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
  const navigate = useNavigate()

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
          <NotificationsDropdown />

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">
                Energy Level: {user?.energyLevel || 'Not set'}/10
              </p>
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
