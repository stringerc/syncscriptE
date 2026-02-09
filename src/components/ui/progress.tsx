/**
 * Progress Component
 * Based on shadcn/ui patterns
 */

import * as React from "react"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, indicatorClassName = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ${className}`}
        {...props}
      >
        <div
          className={`h-full w-full flex-1 transition-all ${indicatorClassName || 'bg-gray-900 dark:bg-gray-50'}`}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }
