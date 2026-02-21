import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/railway-api'

interface User {
  id: string;
  email: string;
  name?: string;
  timezone?: string;
  energyLevel?: number;
  createdAt: string;
  updatedAt: string;
}

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
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data.data
          set({ user, token, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', { email, password, name })
          const { user, token } = response.data.data
          set({ user, token, isLoading: false })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        delete api.defaults.headers.common['Authorization']
      },

      checkAuth: async () => {
        const { token, isLoading, user } = get()
        if (isLoading) return
        if (user && token) {
          set({ isLoading: false })
          return
        }
        if (!token) {
          set({ isLoading: false })
          return
        }
        set({ isLoading: true })
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          set({ user: response.data.data, isLoading: false })
        } catch (error) {
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
          set({ error: errorMessage, isLoading: false })
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
          set({ error: errorMessage, isLoading: false })
          throw new Error(errorMessage)
        }
      }
    }),
    {
      name: 'syncscript-auth',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
)
