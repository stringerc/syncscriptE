import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
// import { cn } from '@/lib/utils'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [debugError, setDebugError] = useState<string | null>(null)
  
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const { toast } = useToast()

        // Check for saved debug error on component mount
        React.useEffect(() => {
          try {
            const savedError = localStorage.getItem('syncscript-debug-error')
            if (savedError) {
              const errorData = JSON.parse(savedError)
              setDebugError(JSON.stringify(errorData, null, 2))
              console.log('🔐 AuthPage: Found saved debug error:', errorData)
            }
          } catch (e) {
            console.error('Failed to load debug error:', e)
          }
        }, [])

        // Also check for debug error every 2 seconds to catch new errors
        React.useEffect(() => {
          const interval = setInterval(() => {
            try {
              const savedError = localStorage.getItem('syncscript-debug-error')
              if (savedError && !debugError) {
                const errorData = JSON.parse(savedError)
                setDebugError(JSON.stringify(errorData, null, 2))
                console.log('🔐 AuthPage: Found new debug error:', errorData)
              }
            } catch (e) {
              console.error('Failed to check debug error:', e)
            }
          }, 2000)

          return () => clearInterval(interval)
        }, [debugError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔐 AuthPage: handleSubmit called', { isLogin, hasEmail: !!formData.email, hasPassword: !!formData.password })
    clearError()
    
    // Clear any previous debug error
    setDebugError(null)
    localStorage.removeItem('syncscript-debug-error')

    try {
      if (isLogin) {
        console.log('🔐 AuthPage: Calling login function')
        const result = await login(formData.email, formData.password)
        if (result && !result.success) {
          // Login failed, error is already set in store
          console.log('🔐 AuthPage: Login failed, error:', result.error)
          toast({
            title: "Login failed",
            description: result.error || "Login failed",
            variant: "destructive",
            duration: 10000
          })
          return // Don't proceed with success flow
        }
        console.log('🔐 AuthPage: Login successful')
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in to SyncScript."
        })
      } else {
        console.log('🔐 AuthPage: Calling register function')
        await register(formData.email, formData.password, formData.name)
        console.log('🔐 AuthPage: Registration successful')
        toast({
          title: "Welcome to SyncScript!",
          description: "Your account has been created successfully."
        })
      }
    } catch (error: any) {
      console.error('🔐 AuthPage: Authentication failed:', {
        status: error.response?.status,
        message: error.message,
        hasResponse: !!error.response
      })
      
      // Use the error from the auth store, or fallback to the thrown error
      const errorMessage = error.response?.data?.error || error.message || "Something went wrong. Please try again."
      
      // Show error for longer duration
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
        duration: 10000 // Show for 10 seconds instead of default
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SyncScript</h1>
          <p className="text-muted-foreground">
            AI-powered life management system
          </p>
        </div>

        {/* Auth Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to your SyncScript account' 
                : 'Get started with your AI-powered life manager'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required={!isLogin}
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

               {debugError && (
                 <div className="p-4 bg-red-50 border-2 border-red-300 rounded-md mb-4">
                   <div className="flex items-center justify-between mb-2">
                     <p className="text-sm font-bold text-red-800">🚨 LOGIN DEBUG ERROR DETECTED:</p>
                     <button
                       type="button"
                       onClick={() => {
                         setDebugError(null)
                         localStorage.removeItem('syncscript-debug-error')
                       }}
                       className="text-xs text-red-600 hover:text-red-800 underline font-bold"
                     >
                       CLEAR DEBUG INFO
                     </button>
                   </div>
                   <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-40 bg-white p-2 rounded border">
                     {debugError}
                   </pre>
                   <p className="text-xs text-red-600 mt-2 font-medium">
                     ⚠️ This error was automatically captured. Please try logging in again to see if the issue persists.
                   </p>
                 </div>
               )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="p-0 ml-1 h-auto"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    clearError()
                    setFormData({ email: '', password: '', name: '' })
                  }}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm">AI-Powered</h3>
            <p className="text-xs text-muted-foreground">Smart task prioritization</p>
          </div>
          <div className="p-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm">Integrated</h3>
            <p className="text-xs text-muted-foreground">Calendar, tasks & finance</p>
          </div>
          <div className="p-4">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm">Adaptive</h3>
            <p className="text-xs text-muted-foreground">Learns your patterns</p>
          </div>
        </div>
      </div>
    </div>
  )
}
