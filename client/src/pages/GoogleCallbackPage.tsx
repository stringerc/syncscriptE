import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login: authLogin } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        if (error) {
          setStatus('error')
          setMessage(`OAuth error: ${error}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        // For now, simulate a successful Google OAuth login
        // In a real implementation, you'd exchange the code for user info
        console.log('🔐 GoogleCallback: Processing Google OAuth callback')
        
        // Simulate user data from Google
        const mockUser = {
          id: 'google_' + Date.now(),
          email: 'user@gmail.com',
          name: 'Google User',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // Store user data temporarily in localStorage for auth store to pick up
        localStorage.setItem('syncscript_user', JSON.stringify(mockUser))
        localStorage.setItem('syncscript_token', 'google_token_' + Date.now())
        
        setStatus('success')
        
        // Check if we should auto-sync after authentication
        const returnTo = searchParams.get('returnTo') || '/dashboard'
        const shouldAutoSync = returnTo === '/calendar-sync'
        
        console.log('🔐 GoogleCallback: Redirect logic', {
          returnTo,
          shouldAutoSync,
          allParams: Object.fromEntries(searchParams.entries()),
          url: window.location.href
        })
        
        // Force redirect to google-calendar if returnTo is google-calendar
        if (returnTo === '/google-calendar') {
          console.log('🔐 GoogleCallback: Forcing redirect to google-calendar')
          setMessage('Successfully signed in! Syncing your Google Calendar events...')
          
          // Show success toast with sync info
          toast({
            title: "Google Calendar Connected!",
            description: "Syncing your events and holidays...",
            variant: "default"
          })
          
          // Redirect to calendar sync page after 2 seconds
          setTimeout(() => {
            console.log('🔐 GoogleCallback: Navigating to /google-calendar')
            navigate('/google-calendar')
          }, 2000)
          return
        }
        
        // Default redirect to dashboard
        setMessage('Successfully signed in with Google!')
        
        // Show success toast
        toast({
          title: "Welcome!",
          description: "You've successfully signed in with Google.",
          variant: "default"
        })

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          console.log('🔐 GoogleCallback: Navigating to dashboard')
          navigate('/dashboard')
        }, 2000)
      } catch (error: any) {
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage('An error occurred while signing in with Google')
      }
    }

    handleCallback()
  }, [searchParams, navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
            Google Sign In
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your Google sign in...'}
            {status === 'success' && 'Sign in successful!'}
            {status === 'error' && 'Sign in failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Please wait while we sign you in with Google...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-700 font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to {searchParams.get('returnTo') === '/calendar-sync' ? 'Calendar Sync' : 'Dashboard'}...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-700 font-medium">{message}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}