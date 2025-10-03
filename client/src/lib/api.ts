import axios from 'axios'

// Dynamic API URL detection for different environments
const getApiBaseUrl = () => {
  console.log('🌐 Current hostname:', window.location.hostname)
  
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_API_URL) {
    console.log('🌐 Using VITE_API_URL environment variable')
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
  
  // If running on local network IP, use proxy
  if (window.location.hostname === '192.168.1.246') {
    console.log('🌐 Running on local network - using proxy')
    return '/api'
  }
  
  // Default to localhost for development - use proxy
  console.log('🌐 Running locally - using proxy')
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL)
console.log('🔗 Full URL being used:', API_BASE_URL)

// Use the detected API base URL
const finalBaseURL = API_BASE_URL

// Request throttling disabled - was causing blocking issues
// let activeRequests = 0
// const MAX_CONCURRENT_REQUESTS = 3
// const requestQueue: Array<() => void> = []

// const processQueue = () => {
//   if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
//     const nextRequest = requestQueue.shift()
//     if (nextRequest) {
//       nextRequest()
//     }
//   }
// }

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
    // Only log non-sensitive request info
    console.log('🔗 API Request:', config.method?.toUpperCase(), config.url)
    if (config.url === '/auth/login') {
      console.log('🔗 Login request data:', config.data)
      console.log('🔗 Login request data types:', {
        emailType: typeof config.data?.email,
        passwordType: typeof config.data?.password,
        emailValue: config.data?.email,
        passwordValue: config.data?.password
      })
    }
    
    // Add auth token if available
    const token = localStorage.getItem('syncscript-auth')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
          console.log('🔐 API: Using token from syncscript-auth:', authData.state.token.substring(0, 20) + '...')
        }
      } catch (error) {
        console.log('🔐 Invalid token format')
      }
    }
    
    // Also check for mock Google token
    const mockToken = localStorage.getItem('syncscript_token')
    if (mockToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${mockToken}`
      console.log('🔐 API: Using mock Google token:', mockToken.substring(0, 20) + '...')
    }
    
    // Check if we have any authorization header
    if (!config.headers.Authorization) {
      console.log('🔐 API: No authorization token found for request:', config.url)
    }
    
    return config
  },
  (error) => {
    console.error('🔗 API Request Error:', error.message)
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
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    })
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      localStorage.removeItem('syncscript-auth')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
