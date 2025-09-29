import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Loader2 } from 'lucide-react'

export function GoogleCallbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')

        if (error) {
          setError(`Google authentication failed: ${error}`)
          setIsLoading(false)
          return
        }

        if (!code) {
          setError('No authorization code received from Google')
          setIsLoading(false)
          return
        }

        // Send the code to our backend
        const response = await fetch('https://syncscripte.onrender.com/api/google-calendar/auth/login-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Check if response has content
        const text = await response.text()
        if (!text) {
          throw new Error('Empty response from server')
        }

        let data
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          console.error('Failed to parse JSON:', text)
          throw new Error('Invalid response format from server')
        }

        if (data.success) {
          // Set user and token in auth store
          setUser(data.data.user)
          setToken(data.data.token)

          // Redirect to dashboard
          navigate('/dashboard')
        } else {
          setError(data.error || 'Login failed')
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Google callback error:', error)
        setError(error.message || 'An unexpected error occurred')
        setIsLoading(false)
      }
    }

    handleGoogleCallback()
  }, [navigate, setUser, setToken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Completing Google Login</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Please wait...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Login Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
