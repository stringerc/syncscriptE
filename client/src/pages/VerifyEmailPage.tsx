import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { checkAuth } = useAuthStore()
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [message, setMessage] = useState('')
  
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('invalid')
        setMessage('Invalid verification link. No token provided.')
        return
      }

      try {
        const response = await api.post('/user/verify-email', { token })
        setVerificationStatus('success')
        setMessage(response.data.message || 'Email verified successfully!')
        
        // Refresh authentication state to get updated user info
        await checkAuth()
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      } catch (error: any) {
        setVerificationStatus('error')
        setMessage(error.response?.data?.error || 'Failed to verify email. The link may be expired or invalid.')
      }
    }

    verifyEmail()
  }, [token, navigate])

  const handleResendEmail = async () => {
    try {
      await api.post('/user/resend-verification')
      setMessage('A new verification email has been sent to your email address.')
    } catch (error: any) {
      setMessage('Failed to resend verification email. Please try again later.')
    }
  }

  const handleGoToDashboard = async () => {
    // Refresh authentication state before navigating
    await checkAuth()
    navigate('/dashboard')
  }

  const handleGoToLogin = () => {
    navigate('/auth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
              {verificationStatus === 'loading' && (
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              )}
              {verificationStatus === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-600" />
              )}
              {(verificationStatus === 'error' || verificationStatus === 'invalid') && (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {verificationStatus === 'loading' && 'Verifying Email...'}
              {verificationStatus === 'success' && 'Email Verified!'}
              {(verificationStatus === 'error' || verificationStatus === 'invalid') && 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {verificationStatus === 'loading' && 'Please wait while we verify your email address.'}
              {verificationStatus === 'success' && 'Your email has been successfully verified.'}
              {(verificationStatus === 'error' || verificationStatus === 'invalid') && 'There was a problem verifying your email address.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>

            {verificationStatus === 'success' && (
              <div className="space-y-3">
                <Button onClick={handleGoToDashboard} className="w-full">
                  Go to Dashboard
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You will be automatically redirected in a few seconds...
                </p>
              </div>
            )}

            {(verificationStatus === 'error' || verificationStatus === 'invalid') && (
              <div className="space-y-3">
                <Button onClick={handleResendEmail} variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </Button>
                <Button onClick={handleGoToLogin} variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </div>
            )}

            {verificationStatus === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  This may take a few moments...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
