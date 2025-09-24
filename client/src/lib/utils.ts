import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
    case 'LOW':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
    case 'IN_PROGRESS':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
    case 'PENDING':
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
    case 'CANCELLED':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
    case 'DEFERRED':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
  }
}

export function getEnergyLevelColor(level: number): string {
  if (level >= 8) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
  if (level >= 6) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
  if (level >= 4) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950'
  return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
