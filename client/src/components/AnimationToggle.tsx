import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Zap, Heart, Sparkles, Waves } from 'lucide-react'

export function AnimationToggle() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
      if (e.matches) {
        setAnimationsEnabled(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const handleToggleAnimations = (enabled: boolean) => {
    setAnimationsEnabled(enabled)
    
    // Apply to CSS custom property for global control
    document.documentElement.style.setProperty(
      '--animations-enabled', 
      enabled ? '1' : '0'
    )

    // Store preference
    localStorage.setItem('animations-enabled', enabled.toString())
  }

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('animations-enabled')
    if (saved !== null) {
      const enabled = saved === 'true'
      setAnimationsEnabled(enabled)
      document.documentElement.style.setProperty(
        '--animations-enabled', 
        enabled ? '1' : '0'
      )
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Animation Settings
        </CardTitle>
        <CardDescription>
          Control energy emblem animations and motion effects
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Animation Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="animations-toggle" className="text-base font-medium">
              Energy Emblem Animations
            </Label>
            <p className="text-sm text-muted-foreground">
              Show animated effects when your energy level changes
            </p>
          </div>
          <Switch
            id="animations-toggle"
            checked={animationsEnabled}
            onCheckedChange={handleToggleAnimations}
            disabled={reducedMotion}
          />
        </div>

        {/* System Motion Preference Warning */}
        {reducedMotion && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Accessibility Note:</strong> Your system is set to reduce motion. 
              Animations are disabled to respect your preference.
            </p>
          </div>
        )}

        {/* Preview Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Preview:</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <div className={cn(
                "p-2 rounded-full text-yellow-400 mb-2",
                animationsEnabled && !reducedMotion && "animate-pulse"
              )}>
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">Bolt</span>
            </div>
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <div className={cn(
                "p-2 rounded-full text-red-400 mb-2",
                animationsEnabled && !reducedMotion && "animate-bounce"
              )}>
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">Heart</span>
            </div>
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <div className={cn(
                "p-2 rounded-full text-purple-400 mb-2",
                animationsEnabled && !reducedMotion && "animate-pulse"
              )}>
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">Comet</span>
            </div>
            <div className="flex flex-col items-center p-3 border rounded-lg">
              <div className={cn(
                "p-2 rounded-full text-blue-400 mb-2",
                animationsEnabled && !reducedMotion && "animate-bounce"
              )}>
                <Waves className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">Wave</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
