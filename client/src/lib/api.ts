import axios from 'axios'

// Dynamic API URL detection
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL
  }
  
  // If running on GitHub Pages, try to detect Railway backend
  if (window.location.hostname === 'stringerc.github.io') {
    // Try common Railway patterns
    const possibleUrls = [
      'https://syncscript-production.railway.app/api',
      'https://syncscript-backend.railway.app/api',
      'https://syncscript.railway.app/api',
      'https://syncscript-production.up.railway.app/api'
    ]
    
    // For now, return the most likely one - you'll need to update this with your actual domain
    return 'https://syncscript-production.railway.app/api'
  }
  
  // Default to localhost for development
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('syncscript-auth')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (error) {
        // Invalid token format, ignore
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      localStorage.removeItem('syncscript-auth')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
