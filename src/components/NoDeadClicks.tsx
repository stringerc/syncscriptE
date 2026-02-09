/**
 * NoDeadClicks Component
 * 
 * Wrapper to ensure all clickable elements have proper handlers.
 * Shows tooltip explaining why an element is disabled or coming soon.
 * 
 * Usage:
 * <NoDeadClicks
 *   onClick={handleClick}
 *   comingSoon
 *   comingSoonMessage="Voice input coming in Q1 2025"
 * >
 *   <Button>Voice Input</Button>
 * </NoDeadClicks>
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

interface NoDeadClicksProps {
  onClick?: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
  comingSoonMessage?: string;
  disabledMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function NoDeadClicks({
  onClick,
  disabled = false,
  comingSoon = false,
  comingSoonMessage,
  disabledMessage,
  children,
  className = '',
}: NoDeadClicksProps) {
  const handleClick = () => {
    if (disabled) {
      if (disabledMessage) {
        toast.info(disabledMessage);
      }
      return;
    }
    
    if (comingSoon) {
      toast.info(comingSoonMessage || 'Coming soon!');
      return;
    }
    
    if (onClick) {
      onClick();
    } else {
      // Development warning for dead clicks
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dead Click] No onClick handler provided');
        toast.warning('This feature is not yet connected');
      }
    }
  };
  
  const tooltipMessage = comingSoon
    ? comingSoonMessage || 'Coming soon'
    : disabled
    ? disabledMessage || 'This action is not available'
    : null;
  
  if (tooltipMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={handleClick}
              className={`${disabled || comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
            >
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div onClick={handleClick} className={`cursor-pointer ${className}`}>
      {children}
    </div>
  );
}

/**
 * SafeLink Component
 * 
 * Ensures all links go to valid routes defined in navigationLinks.
 * Warns in development if route is invalid.
 * 
 * Usage:
 * <SafeLink href="/tasks">View Tasks</SafeLink>
 */

import { validateRoute } from '@/utils/global-rules';
import Link from 'next/link';

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

export function SafeLink({
  href,
  children,
  external = false,
  className = '',
}: SafeLinkProps) {
  // Validate route in development
  if (process.env.NODE_ENV === 'development' && !external) {
    validateRoute(href);
  }
  
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
