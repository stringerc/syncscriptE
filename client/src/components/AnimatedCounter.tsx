import { useState, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedCounter({ value, duration = 1000, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const previousValueRef = useRef(value)

  useEffect(() => {
    if (value !== previousValueRef.current) {
      setIsAnimating(true)
      
      const startValue = previousValueRef.current
      const endValue = value
      const difference = endValue - startValue
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Use easeOutCubic for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.round(startValue + (difference * easeOutCubic))
        
        setDisplayValue(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
          setIsAnimating(false)
          previousValueRef.current = endValue
        }
      }

      requestAnimationFrame(animate)
    } else {
      setDisplayValue(value)
    }
  }, [value, duration])

  return (
    <span 
      className={`transition-all duration-300 ${isAnimating ? 'scale-110 text-yellow-500 drop-shadow-sm' : ''} ${className}`}
    >
      {displayValue.toLocaleString()}
    </span>
  )
}
