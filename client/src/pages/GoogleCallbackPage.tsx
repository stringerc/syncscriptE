import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
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

        // Send the code to the backend
        const response = await api.post('/calendar-auth/google/callback', {
          code,
          state
        })

        if (response.data.success) {
          setStatus('success')
          setMessage('Google Calendar connected successfully!')
          
          // Show success toast
          toast({
            title: "Success!",
            description: "Google Calendar has been connected successfully.",
            variant: "default"
          })

          // Redirect to Calendar Sync page after 2 seconds
          setTimeout(() => {
            navigate('/calendar-sync')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(response.data.error || 'Failed to connect Google Calendar')
        }
      } catch (error: any) {
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage(error.response?.data?.error || 'An error occurred while connecting Google Calendar')
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
            Google Calendar Connection
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your Google Calendar connection...'}
            {status === 'success' && 'Connection successful!'}
            {status === 'error' && 'Connection failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Please wait while we connect your Google Calendar...
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
                Redirecting you back to Calendar Sync...
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
                  onClick={() => navigate('/calendar-sync')}
                  className="w-full"
                >
                  Back to Calendar Sync
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