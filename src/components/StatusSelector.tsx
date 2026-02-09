import { useState } from 'react';
import { Check, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useUserProfile, UserStatus, getStatusColor, getStatusLabel } from '../utils/user-profile';
import { toast } from 'sonner@2.0.3';

interface StatusOption {
  value: UserStatus;
  label: string;
  description: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'available', label: 'Available', description: 'Ready to collaborate' },
  { value: 'away', label: 'Away', description: 'Temporarily unavailable' },
  { value: 'in-meeting', label: 'In a meeting', description: 'Do not disturb' },
  { value: 'deep-focus', label: 'Deep focus', description: 'Minimize interruptions' },
  { value: 'offline', label: 'Offline', description: 'Not available' },
];

interface StatusSelectorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  children?: React.ReactNode;
}

export function StatusSelector({ size = 'md', showLabel = false, children }: StatusSelectorProps) {
  const { profile, setStatus } = useUserProfile();
  const [customText, setCustomText] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleStatusChange = (status: UserStatus) => {
    setStatus(status);
    toast.success(`Status updated to ${getStatusLabel(status)}`);
    setShowCustomInput(false);
  };

  const handleCustomStatus = () => {
    if (!customText.trim()) {
      toast.error('Please enter a status message');
      return;
    }
    setStatus('custom', customText, customEmoji || undefined);
    toast.success('Custom status set');
    setCustomText('');
    setCustomEmoji('');
    setShowCustomInput(false);
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <button className="flex items-center gap-2 hover:bg-gray-700/50 px-2 py-1 rounded transition-colors">
            <div className={`${sizeClasses[size]} rounded-full ${getStatusColor(profile.status)}`} />
            {showLabel && (
              <span className="text-sm text-gray-300">
                {getStatusLabel(profile.status, profile.customStatus)}
              </span>
            )}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-[#1e2128] border-gray-800">
        <DropdownMenuLabel className="text-white">Set your status</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />

        {/* Standard Status Options */}
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer text-gray-300 focus:bg-gray-700/50 focus:text-white"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor(option.value)}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
            {profile.status === option.value && !profile.customStatus && (
              <Check className="w-4 h-4 text-teal-400" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-gray-800" />

        {/* Custom Status */}
        {!showCustomInput ? (
          <DropdownMenuItem
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer text-gray-300 focus:bg-gray-700/50 focus:text-white"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor('custom')}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">Custom</div>
              <div className="text-xs text-gray-500">
                {profile.status === 'custom' && profile.customStatus
                  ? getStatusLabel('custom', profile.customStatus)
                  : 'Set a custom status'}
              </div>
            </div>
            {profile.status === 'custom' && <Check className="w-4 h-4 text-teal-400" />}
          </DropdownMenuItem>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 space-y-2"
          >
            <div className="flex gap-2">
              <div className="relative">
                <Input
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value.slice(0, 2))}
                  placeholder="😊"
                  className="w-14 bg-gray-800/50 border-gray-700 text-center text-lg"
                  maxLength={2}
                />
                <Smile className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value.slice(0, 32))}
                placeholder="What's your status?"
                className="flex-1 bg-gray-800/50 border-gray-700"
                maxLength={32}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">{customText.length}/32</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomText('');
                  setCustomEmoji('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCustomStatus}
                className="flex-1 bg-purple-600 hover:bg-purple-500"
              >
                Set Status
              </Button>
            </div>
          </motion.div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
