import React, { useEffect, useState } from 'react'

export function GoogleCallbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          // Store user and token in localStorage (simple approach)
          localStorage.setItem('syncscript_user', JSON.stringify(data.data.user))
          localStorage.setItem('syncscript_token', data.data.token)
          
          // Redirect to dashboard
          window.location.href = '/dashboard'
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
  }, [])

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>Completing Google Login</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span>Please wait...</span>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#dc2626' }}>Login Failed</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => window.location.href = '/auth'}
            style={{
              width: '100%',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return null
}