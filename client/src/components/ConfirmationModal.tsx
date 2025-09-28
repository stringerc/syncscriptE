import { Button } from '@/components/ui/button'
import { AlertTriangle, X, Trash2, Calendar } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'delete'
  isLoading?: boolean
  eventTitle?: string
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  eventTitle
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'delete':
        return {
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200 dark:border-red-800',
          IconComponent: Trash2
        }
      case 'danger':
        return {
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200 dark:border-red-800',
          IconComponent: AlertTriangle
        }
      case 'warning':
        return {
          icon: 'text-orange-600 dark:text-orange-400',
          iconBg: 'bg-orange-100 dark:bg-orange-900/20',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          border: 'border-orange-200 dark:border-orange-800',
          IconComponent: AlertTriangle
        }
      case 'info':
        return {
          icon: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          border: 'border-blue-200 dark:border-blue-800',
          IconComponent: Calendar
        }
      default:
        return {
          icon: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          border: 'border-red-200 dark:border-red-800',
          IconComponent: AlertTriangle
        }
    }
  }

  const styles = getVariantStyles()
  const { IconComponent } = styles

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 border border-border animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${styles.iconBg}`}>
              <IconComponent className={`w-6 h-6 ${styles.icon}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {eventTitle && (
                <p className="text-sm text-muted-foreground font-medium">{eventTitle}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-muted-foreground leading-relaxed">{message}</p>
          {variant === 'delete' && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                ⚠️ This action cannot be undone. All associated tasks and data will be permanently removed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-muted"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${styles.confirmButton} min-w-[100px]`}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
