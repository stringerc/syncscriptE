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
        console.log('🔐 AuthStore: Starting login for:', email)
        console.log('🔐 AuthStore: API Base URL:', api.defaults.baseURL)
        
        // Clear any existing authentication state before login
        set({ user: null, token: null, error: null, isLoading: true })
        delete api.defaults.headers.common['Authorization']
        
        try {
          const response = await api.post('/auth/login', { email, password })
          console.log('🔐 AuthStore: Login response:', response.data)
          const { user, token } = response.data.data
          
          set({ user, token, isLoading: false })
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          console.log('🔐 AuthStore: Login successful for:', email)
        } catch (error: any) {
          console.error('🔐 AuthStore: Login error:', error)
          console.error('🔐 AuthStore: Error response:', error.response?.data)
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false 
          })
          // Throw a custom error with the clean message
          throw new Error(errorMessage)
        }
      },

      register: async (email: string, password: string, name?: string) => {
        console.log('🔐 AuthStore: Starting registration for:', email)
        console.log('🔐 AuthStore: API Base URL:', api.defaults.baseURL)
        
        // Clear any existing authentication state before registration
        set({ user: null, token: null, error: null, isLoading: true })
        delete api.defaults.headers.common['Authorization']
        
        try {
          const response = await api.post('/auth/register', { email, password, name })
          console.log('🔐 AuthStore: Registration response:', response.data)
          const { user, token } = response.data.data
          
          set({ user, token, isLoading: false })
          
          // Set token in API client
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          console.log('🔐 AuthStore: Registration successful for:', email)
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
      },

      clearAuth: () => {
        console.log('🔐 AuthStore: Clearing authentication state')
        set({ user: null, token: null, error: null, isLoading: false })
        delete api.defaults.headers.common['Authorization']
      },

      checkAuth: async () => {
        const { token, isLoading, user } = get()
        
        console.log('🔐 AuthStore: checkAuth called', { hasToken: !!token, isLoading, hasUser: !!user, tokenLength: token?.length })
        
        // Prevent multiple simultaneous calls
        if (isLoading) {
          console.log('🔐 AuthStore: Already loading, skipping checkAuth')
          return
        }
        
        // If we already have a user and token, don't refetch
        if (user && token) {
          console.log('🔐 AuthStore: Already have user and token, skipping checkAuth')
          set({ isLoading: false })
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
          const response = await api.get('/auth/me')
          console.log('🔐 AuthStore: checkAuth response:', response.data)
          set({ user: response.data.data, isLoading: false })
        } catch (error) {
          console.error('🔐 AuthStore: checkAuth error:', error)
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
