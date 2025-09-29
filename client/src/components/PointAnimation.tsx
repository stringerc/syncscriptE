import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PointAnimationProps {
  points: number
  isVisible: boolean
  onAnimationComplete?: () => void
}

export function PointAnimation({ points, isVisible, onAnimationComplete }: PointAnimationProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (isVisible && points > 0) {
      setShouldAnimate(true)
      
      // Reset animation after completion
      const timer = setTimeout(() => {
        setShouldAnimate(false)
        onAnimationComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, points, onAnimationComplete])

  return (
    <AnimatePresence>
      {shouldAnimate && (
        <motion.div
          initial={{ 
            opacity: 0, 
            scale: 0.5,
            y: 0,
            x: 0
          }}
          animate={{ 
            opacity: 1, 
            scale: 1.2,
            y: -50,
            x: 20
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            y: -80,
            x: 40
          }}
          transition={{
            duration: 2,
            ease: "easeOut",
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 },
            y: { duration: 2, ease: "easeOut" },
            x: { duration: 2, ease: "easeOut" }
          }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <motion.div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-lg flex items-center gap-2"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              💰
            </motion.span>
            <span>+{points}</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, delay: 1 }}
              className="text-sm"
            >
              points!
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
