import React from 'react'
import { Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ResourcesBadgeProps {
  count: number
  onClick: () => void
  className?: string
  alwaysShow?: boolean
  resourceNames?: string[] // Array of resource names for tooltip
}

export function ResourcesBadge({ count, onClick, className = '', alwaysShow = false, resourceNames = [] }: ResourcesBadgeProps) {
  if (!alwaysShow && count === 0) return null

  const tooltipText = resourceNames.length > 0 
    ? `Resources: ${resourceNames.join(', ')}`
    : `${count} resource${count !== 1 ? 's' : ''}`

  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
      onClick={onClick}
      title={tooltipText}
    >
      <Paperclip className="w-3 h-3 mr-1" />
      {count}
    </Badge>
  )
}
