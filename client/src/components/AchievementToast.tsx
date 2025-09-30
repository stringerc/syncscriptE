import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AchievementToastProps {
  title: string
  description: string
  points: number
  icon?: string
  isVisible: boolean
  onClose: () => void
}

export function AchievementToast({
  title,
  description,
  points,
  icon = '🏆',
  isVisible,
  onClose
}: AchievementToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!shouldRender) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-20 right-6 z-[100] max-w-sm"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 p-1 rounded-lg shadow-2xl">
            <div className="bg-gray-900 rounded-md p-4 flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl animate-bounce">
                  {icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h4 className="font-bold text-white text-sm">Achievement Unlocked!</h4>
                </div>
                <p className="font-semibold text-yellow-100 mb-1">{title}</p>
                <p className="text-xs text-gray-300">{description}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-yellow-400 font-bold text-sm">+{points}</span>
                  <span className="text-yellow-300 text-xs">points</span>
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

