import axios from 'axios'

// Dynamic API URL detection for different environments
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL
  }
  
  // If running on GitHub Pages, use Railway backend
  if (window.location.hostname === 'stringerc.github.io') {
    // You need to replace this with your actual Railway domain
    // Common Railway patterns - update this with your actual domain
    return 'https://syncscript-production.railway.app/api'
  }
  
  // Default to localhost for development
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL)

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
