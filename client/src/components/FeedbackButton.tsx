import { useState, useRef } from 'react'
import { MessageCircle, Send, X, Upload, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { usePointAnimation } from '@/contexts/PointAnimationContext'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'
import { api } from '@/lib/api'

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState('bug')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [includeConsoleErrors, setIncludeConsoleErrors] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { showPointAnimation } = usePointAnimation()
  const { flags } = useFeatureFlags()

  // Capture context for feedback
  const captureContext = () => {
    const context: any = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString(),
      flags: flags
    }

    // Capture console errors if enabled
    if (includeConsoleErrors) {
      const debugErrors = localStorage.getItem('syncscript_debug_errors')
      if (debugErrors) {
        try {
          const errors = JSON.parse(debugErrors)
          context.consoleErrors = errors.slice(-5) // Last 5 errors
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return context
  }

  // Handle screenshot upload
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove screenshot
  const removeScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback before submitting.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const context = captureContext()
      
      const formData = new FormData()
      formData.append('message', feedback.trim())
      formData.append('category', category)
      formData.append('context', JSON.stringify(context))
      
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      const response = await api.post('/feedback', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const pointsAwarded = response.data.data?.pointsAwarded || 50
        
        // Invalidate and refetch all relevant queries immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['gamification-summary'] }),
          queryClient.invalidateQueries({ queryKey: ['gamification'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['user-dashboard'] })
        ])
        
        // Force refetch the gamification data
        await queryClient.refetchQueries({ queryKey: ['gamification-summary'] })
        
        // Small delay to ensure data is updated before showing animation
        setTimeout(() => {
          showPointAnimation(pointsAwarded)
        }, 100)
        
        // Show appropriate message based on points awarded
        if (pointsAwarded > 0) {
          toast({
            title: "Feedback Sent! 🎉",
            description: `Thank you for your feedback! You've earned ${pointsAwarded} points for helping us improve.`,
          })
        } else {
          toast({
            title: "Feedback Sent! 📝",
            description: "Thank you for your feedback! You've reached your daily limit of 50 points for feedback.",
          })
        }
        setFeedback('')
        setCategory('bug')
        removeScreenshot()
        setIsOpen(false)
      } else {
        throw new Error(response.data.error || 'Failed to send feedback')
      }
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmitFeedback()
    }
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 group">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
          title="Leave us feedback!"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <span className="text-sm font-medium text-gray-700 bg-white px-3 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
          Leave us feedback!
        </span>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">Send Feedback</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selector */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-black"
                >
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">✨ Feature Request</option>
                  <option value="improvement">🚀 Improvement</option>
                  <option value="general">💬 General Feedback</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <label htmlFor="feedback" className="text-sm font-medium">
                  Your Feedback
                </label>
                <Textarea
                  id="feedback"
                  placeholder="Share your thoughts, suggestions, or report any issues..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {feedback.length}/1000 characters
                </div>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Screenshot (optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeScreenshot}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Screenshot
                  </Button>
                )}
              </div>

              {/* Include Console Errors Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeErrors"
                  checked={includeConsoleErrors}
                  onChange={(e) => setIncludeConsoleErrors(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="includeErrors" className="text-sm text-muted-foreground">
                  Include console errors (helps us debug issues)
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting || !feedback.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                💡 Tip: Press Ctrl+Enter to send quickly
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
