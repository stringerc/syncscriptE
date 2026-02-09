/**
 * StandardModal Component
 * 
 * Enforces consistent modal pattern across the entire app:
 * - Title + description
 * - Primary action (optional)
 * - Secondary close button
 * - ESC to close
 * - Background dim
 * - Prevent body scroll
 * 
 * Usage:
 * <StandardModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Task"
 *   description="Are you sure you want to delete this task?"
 *   primaryAction={{ label: "Delete", onClick: handleDelete, variant: "destructive" }}
 * >
 *   <p>This action cannot be undone.</p>
 * </StandardModal>
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { INTERACTION_PATTERNS } from '@/utils/global-rules';
import { useEffect } from 'react';

interface StandardModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function StandardModal({
  open,
  onClose,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  size = 'md',
  className = '',
}: StandardModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open && INTERACTION_PATTERNS.modal.preventBodyScroll) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${sizeClasses[size]} ${className}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <DialogFooter>
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          
          {primaryAction ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant={primaryAction.variant || 'default'}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.loading ? 'Loading...' : primaryAction.label}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * StandardDrawer Component
 * 
 * Enforces consistent drawer/sheet pattern:
 * - Slides from right (desktop) or bottom (mobile)
 * - ESC to close
 * - Prevent body scroll
 * - Full screen on mobile
 * 
 * Usage:
 * <StandardDrawer
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Integration Settings"
 *   description="Configure sync settings"
 *   primaryAction={{ label: "Save", onClick: handleSave }}
 * >
 *   <SyncSettingsForm />
 * </StandardDrawer>
 */

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet';

interface StandardDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
  side?: 'right' | 'left' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StandardDrawer({
  open,
  onClose,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  side = INTERACTION_PATTERNS.drawer.defaultSide,
  size = 'md',
  className = '',
}: StandardDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open && INTERACTION_PATTERNS.drawer.preventBodyScroll) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);
  
  const sizeClasses = {
    sm: 'w-[320px]',
    md: 'w-[400px]',
    lg: 'w-[600px]',
  };
  
  // On mobile, always full screen
  const drawerClassName = `${sizeClasses[size]} sm:max-w-full ${className}`;
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side={side} className={drawerClassName}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        
        {children && (
          <div className="flex-1 overflow-y-auto py-4">
            {children}
          </div>
        )}
        
        <SheetFooter>
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          
          {primaryAction ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant={primaryAction.variant || 'default'}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
              >
                {primaryAction.loading ? 'Loading...' : primaryAction.label}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
