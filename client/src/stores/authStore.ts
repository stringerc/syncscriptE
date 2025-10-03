import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import { User } from '@/shared/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        console.log('🔐 AuthStore: Starting login for user')
        console.log('🔐 AuthStore: API Base URL:', api.defaults.baseURL)
        
        // Clear any existing authentication state before login
        set({ user: null, token: null, error: null, isLoading: true })
        delete api.defaults.headers.common['Authorization']
        
        // Clear only AI chat data from localStorage (not all localStorage)
        localStorage.removeItem('syncscript-chats')
        localStorage.removeItem('syncscript-current-chat-id')
        
        try {
          console.log('🔐 AuthStore: Attempting login for user')
          
          // First, test if the backend is reachable
          try {
            console.log('🔐 AuthStore: Testing backend connectivity...')
            const healthResponse = await api.get('/health')
            console.log('🔐 AuthStore: Backend health check:', healthResponse.status)
          } catch (healthError: any) {
            console.error('🔐 AuthStore: Backend health check failed:', {
              status: healthError.response?.status,
              statusText: healthError.response?.statusText,
              message: healthError.message,
              code: healthError.code
            })
          }
          
          console.log('🔐 AuthStore: Sending login request with:', { email, password, emailType: typeof email, passwordType: typeof password })
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data.data
          
          set({ user, token, isLoading: false })
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          console.log('🔐 AuthStore: Login successful')
        } catch (error: any) {
          const errorDetails = {
            status: error.response?.status,
            message: error.message,
            hasResponse: !!error.response,
            timestamp: new Date().toISOString(),
            url: error.config?.url,
            method: error.config?.method,
            responseData: error.response?.data,
            fullError: error.toString()
          }
          
          console.error('🔐 AuthStore: Login failed:', errorDetails)
          
          // Save error to localStorage for debugging
          try {
            localStorage.setItem('syncscript-debug-error', JSON.stringify(errorDetails))
            console.log('🔐 AuthStore: Debug error saved to localStorage')
          } catch (e) {
            console.error('Failed to save debug error:', e)
          }
          
          const errorMessage = error.response?.data?.error || error.message || 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          
          // Don't throw error immediately - let the UI handle it
          console.log('🔐 AuthStore: Login error set in state, not throwing')
          return { success: false, error: errorMessage }
        }
      },

      register: async (email: string, password: string, name?: string) => {
        console.log('🔐 AuthStore: Starting registration for user')
        console.log('🔐 AuthStore: API Base URL:', api.defaults.baseURL)
        
        // Clear any existing authentication state before registration
        set({ user: null, token: null, error: null, isLoading: true })
        delete api.defaults.headers.common['Authorization']
        
        // Clear only AI chat data from localStorage (not all localStorage)
        localStorage.removeItem('syncscript-chats')
        localStorage.removeItem('syncscript-current-chat-id')
        
        try {
          const response = await api.post('/auth/register', { email, password, name })
          console.log('🔐 AuthStore: Registration successful')
          const { user, token } = response.data.data
          
          set({ user, token, isLoading: false })
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          console.log('🔐 AuthStore: Registration successful')
        } catch (error: any) {
          console.error('🔐 AuthStore: Registration error:', error)
          console.error('🔐 AuthStore: Error response:', error.response?.data)
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          // Throw a custom error with the clean message
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        console.log('🔐 AuthStore: Logging out user')
        set({ user: null, token: null, error: null })
        delete api.defaults.headers.common['Authorization']
        
        // Clear only AI chat data from localStorage (not all localStorage)
        localStorage.removeItem('syncscript-chats')
        localStorage.removeItem('syncscript-current-chat-id')
        console.log('🔐 AuthStore: Cleared AI chat data from localStorage')
      },

      clearAuth: () => {
        console.log('🔐 AuthStore: Clearing authentication state')
        set({ user: null, token: null, error: null, isLoading: false })
        delete api.defaults.headers.common['Authorization']
        
        // Clear only AI chat data from localStorage (not all localStorage)
        localStorage.removeItem('syncscript-chats')
        localStorage.removeItem('syncscript-current-chat-id')
        console.log('🔐 AuthStore: Cleared AI chat data from localStorage')
      },

      checkAuth: async () => {
        const { token, isLoading, user } = get()
        
        console.log('🔐 AuthStore: checkAuth called', { hasToken: !!token, isLoading, hasUser: !!user, tokenLength: token?.length })
        
        // Check localStorage for Google OAuth data first
        const storedUser = localStorage.getItem('syncscript_user')
        const storedToken = localStorage.getItem('syncscript_token')
        
        if (storedUser && storedToken && !user && !token) {
          console.log('🔐 AuthStore: Found Google OAuth data in localStorage, loading it')
          try {
            const parsedUser = JSON.parse(storedUser)
            set({ user: parsedUser, token: storedToken })
            
            // Set token in API client
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
            
            // Clear localStorage after loading
            localStorage.removeItem('syncscript_user')
            localStorage.removeItem('syncscript_token')
            
            console.log('🔐 AuthStore: Successfully loaded Google OAuth data from localStorage')
            return
          } catch (error) {
            console.error('🔐 AuthStore: Error parsing stored user data:', error)
            // Clear invalid data
            localStorage.removeItem('syncscript_user')
            localStorage.removeItem('syncscript_token')
          }
        }
        
        // Prevent multiple simultaneous calls
        if (isLoading) {
          console.log('🔐 AuthStore: Already loading, skipping checkAuth')
          return
        }
        
        // If we already have a user and token, don't refetch
        if (user && token) {
          console.log('🔐 AuthStore: Already have user and token, skipping checkAuth')
          return
        }
        
        if (!token) {
          console.log('🔐 AuthStore: No token, user not authenticated')
          set({ user: null, isLoading: false })
          return
        }

        console.log('🔐 AuthStore: Proceeding with checkAuth')
        set({ isLoading: true })
        try {
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          console.log('🔐 AuthStore: Making checkAuth request to /auth/me')
          console.log('🔐 AuthStore: API Base URL:', api.defaults.baseURL)
          
          const response = await api.get('/auth/me')
          console.log('🔐 AuthStore: checkAuth successful')
          set({ user: response.data.data, isLoading: false })
        } catch (error: any) {
          console.error('🔐 AuthStore: Token validation failed:', {
            status: error.response?.status,
            message: error.message,
            hasResponse: !!error.response
          })
          
          // Token is invalid, clear it
          set({ user: null, token: null, isLoading: false })
          delete api.defaults.headers.common['Authorization']
        }
      },

      clearError: () => set({ error: null }),

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/forgot-password', { email })
          set({ isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to send reset email'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          // Throw a custom error with the clean message
          throw new Error(errorMessage)
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/reset-password', { token, password })
          set({ isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Failed to reset password'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          // Throw a custom error with the clean message
          throw new Error(errorMessage)
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      }
    }),
    {
      name: 'syncscript-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      })
    }
  )
)
