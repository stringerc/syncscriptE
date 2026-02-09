/**
 * UserStatus Component
 * 
 * Displays user status with color-coded indicators.
 * Used in profile menu, team view, and hover cards.
 * 
 * Status types:
 * - Available (green)
 * - Away (yellow)
 * - In meeting (orange)
 * - Deep focus (blue)
 * - Offline (gray)
 * - Custom (user-defined text with purple indicator)
 */

import { Circle } from 'lucide-react';
import { Badge } from './ui/badge';

export type UserStatusType = 'available' | 'online' | 'away' | 'in-meeting' | 'deep-focus' | 'offline' | 'custom';

interface UserStatusProps {
  status: UserStatusType;
  customStatus?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
  },
  online: {
    label: 'Online',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
  },
  away: {
    label: 'Away',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
  },
  'in-meeting': {
    label: 'In meeting',
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
  },
  'deep-focus': {
    label: 'Deep focus',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
  },
  offline: {
    label: 'Offline',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500',
  },
  custom: {
    label: 'Custom',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500',
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    dot: 'w-2 h-2',
    ring: 'w-2.5 h-2.5',
    badge: 'text-xs px-2 py-0.5',
  },
  md: {
    dot: 'w-3 h-3',
    ring: 'w-3.5 h-3.5',
    badge: 'text-sm px-2.5 py-1',
  },
  lg: {
    dot: 'w-4 h-4',
    ring: 'w-4.5 h-4.5',
    badge: 'text-base px-3 py-1.5',
  },
} as const;

export function UserStatus({
  status,
  customStatus,
  size = 'md',
  showDot = false,
  showLabel = false,
  className = '',
}: UserStatusProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.offline;
  const sizeConfig = SIZE_CONFIG[size];
  
  const displayLabel = status === 'custom' && customStatus 
    ? customStatus 
    : config.label;

  // Dot only (for avatar overlay)
  if (showDot && !showLabel) {
    return (
      <div className={`${sizeConfig.ring} rounded-full bg-[#1e2128] flex items-center justify-center ${className}`}>
        <div className={`${sizeConfig.dot} rounded-full ${config.color}`} />
      </div>
    );
  }

  // Label only (text badge)
  if (showLabel && !showDot) {
    return (
      <Badge 
        variant="outline" 
        className={`${sizeConfig.badge} ${config.borderColor} ${config.textColor} font-normal ${className}`}
      >
        {displayLabel}
      </Badge>
    );
  }

  // Both dot and label
  if (showDot && showLabel) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className={`${sizeConfig.dot} rounded-full ${config.color}`} />
        <span className={`text-xs ${config.textColor}`}>{displayLabel}</span>
      </div>
    );
  }

  // Default: just the dot
  return (
    <div className={`${sizeConfig.dot} rounded-full ${config.color} ${className}`} />
  );
}

/**
 * UserStatusPicker Component
 * 
 * Allows users to select their status.
 * Includes custom status input with profanity filter.
 */

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from 'sonner';

interface UserStatusPickerProps {
  currentStatus: UserStatusType;
  currentCustomStatus?: string;
  onStatusChange: (status: UserStatusType, customStatus?: string) => void;
  className?: string;
}

// Mock profanity filter
function containsProfanity(text: string): boolean {
  const blockedWords = [
    'badword1', 'badword2', 'inappropriate', 
    // Add more as needed for mock filter
  ];
  
  const lowerText = text.toLowerCase();
  return blockedWords.some(word => lowerText.includes(word));
}

export function UserStatusPicker({
  currentStatus,
  currentCustomStatus = '',
  onStatusChange,
  className = '',
}: UserStatusPickerProps) {
  const [selectedStatus, setSelectedStatus] = useState<UserStatusType>(currentStatus);
  const [customText, setCustomText] = useState(currentCustomStatus);
  const [customError, setCustomError] = useState('');

  const handleSave = () => {
    // Validate custom status if selected
    if (selectedStatus === 'custom') {
      if (!customText.trim()) {
        setCustomError('Please enter a custom status message');
        return;
      }
      
      if (containsProfanity(customText)) {
        setCustomError('This status contains inappropriate language. Please choose a different message.');
        toast.error('Status contains inappropriate language');
        return;
      }
      
      if (customText.length > 50) {
        setCustomError('Status message must be 50 characters or less');
        return;
      }
    }

    onStatusChange(selectedStatus, selectedStatus === 'custom' ? customText : undefined);
    toast.success('Status updated');
  };

  const handleCustomTextChange = (value: string) => {
    setCustomText(value);
    setCustomError('');
  };

  const statusOptions: { value: UserStatusType; label: string }[] = [
    { value: 'available', label: 'Available' },
    { value: 'away', label: 'Away' },
    { value: 'in-meeting', label: 'In meeting' },
    { value: 'deep-focus', label: 'Deep focus' },
    { value: 'offline', label: 'Offline' },
    { value: 'custom', label: 'Custom status' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label className="text-white mb-3 block">Set your status</Label>
        <RadioGroup value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as UserStatusType)}>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                  <UserStatus status={option.value} size="sm" showDot />
                  <span className="text-gray-300">{option.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Custom status input */}
      {selectedStatus === 'custom' && (
        <div className="space-y-2">
          <Label htmlFor="custom-status" className="text-white">Custom status message</Label>
          <Input
            id="custom-status"
            value={customText}
            onChange={(e) => handleCustomTextChange(e.target.value)}
            placeholder="What's your status?"
            maxLength={50}
            className={`bg-[#1a1c20] border-gray-800 ${customError ? 'border-red-500' : ''}`}
          />
          {customError && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <X className="w-3 h-3" />
              {customError}
            </p>
          )}
          <p className="text-xs text-gray-500">{customText.length}/50 characters</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600">
          <Check className="w-4 h-4 mr-2" />
          Save Status
        </Button>
      </div>
    </div>
  );
}
