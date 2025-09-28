import axios from 'axios'

// Dynamic API URL detection for different environments
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL
  }
  
  // If running on Vercel, use Render backend
  if (window.location.hostname.includes('vercel.app')) {
    console.log('🌐 Running on Vercel - using Render backend')
    return 'https://syncscripte.onrender.com/api'
  }
  
  // If running on GitHub Pages, use Render backend
  if (window.location.hostname === 'stringerc.github.io') {
    console.log('🌐 Running on GitHub Pages - using Render backend')
    return 'https://syncscripte.onrender.com/api'
  }
  
  // If running on local network IP, use the same IP for API calls
  if (window.location.hostname === '192.168.1.246') {
    return 'http://192.168.1.246:3001/api'
  }
  
  // Default to localhost for development
  return 'http://localhost:3001/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL)
console.log('🌐 Current hostname:', window.location.hostname)
console.log('🔗 Full URL being used:', API_BASE_URL)

// Use the detected API base URL
const finalBaseURL = API_BASE_URL

export const api = axios.create({
  baseURL: finalBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('🔗 Final API instance baseURL:', api.defaults.baseURL)

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🔗 API Request:', config.method?.toUpperCase(), config.baseURL + config.url)
    console.log('🔗 Request config:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      data: config.data
    })
    
    // Add auth token if available
    const token = localStorage.getItem('syncscript-auth')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
          console.log('🔐 Auth token added to request')
        }
      } catch (error) {
        console.log('🔐 Invalid token format:', error)
      }
    } else {
      console.log('🔐 No auth token found')
    }
    return config
  },
  (error) => {
    console.error('🔗 API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.response?.data)
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      localStorage.removeItem('syncscript-auth')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
