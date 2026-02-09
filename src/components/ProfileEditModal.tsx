import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Clock, Briefcase, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useUserProfile } from '../utils/user-profile';
import { StatusSelector } from './StatusSelector';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio,
    timezone: profile.timezone,
    workingHoursStart: profile.workingHours.start,
    workingHoursEnd: profile.workingHours.end,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: profile.name,
        bio: profile.bio,
        timezone: profile.timezone,
        workingHoursStart: profile.workingHours.start,
        workingHoursEnd: profile.workingHours.end,
      });
    }
  }, [isOpen, profile]);

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      bio: formData.bio,
      timezone: formData.timezone,
      workingHours: {
        start: formData.workingHoursStart,
        end: formData.workingHoursEnd,
      },
    });
    toast.success('Profile updated successfully');
    onClose();
  };

  const handleAvatarUpload = () => {
    // In a real app, this would open file picker and upload
    toast.info('Avatar upload', { description: 'This feature would allow you to upload a custom avatar' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1e2128] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl text-white">Edit Profile</h2>
              <p className="text-sm text-gray-400">Update your personal information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                />
                <button
                  onClick={handleAvatarUpload}
                  className="absolute bottom-0 right-0 p-2 bg-teal-600 hover:bg-teal-500 rounded-full transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">{profile.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{profile.email}</p>
                <StatusSelector size="md" showLabel />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-300">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white min-h-[100px]"
                placeholder="Tell us about yourself..."
                maxLength={200}
              />
              <p className="text-xs text-gray-500 text-right">{formData.bio.length}/200</p>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timezone
              </Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2128] border-gray-800">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-gray-300">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Working Hours */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Working Hours
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-xs text-gray-400">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-xs text-gray-400">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-[#1a1c20]">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-500">
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
