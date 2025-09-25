import axios from 'axios'

// Dynamic API URL detection for different environments
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL
  }
  
  // If running on GitHub Pages, use Railway backend
  if (window.location.hostname === 'stringerc.github.io') {
    // Use your actual Railway domain
    return 'https://syncscripte-production.up.railway.app/api'
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
    console.log('🔐 Auth token from localStorage:', token)
    if (token) {
      try {
        const authData = JSON.parse(token)
        console.log('🔐 Parsed auth data:', authData)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
          console.log('🔐 Authorization header set:', config.headers.Authorization)
        } else {
          console.log('🔐 No token found in auth data')
        }
      } catch (error) {
        console.log('🔐 Error parsing auth token:', error)
        // Invalid token format, ignore
      }
    } else {
      console.log('🔐 No auth token found in localStorage')
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
