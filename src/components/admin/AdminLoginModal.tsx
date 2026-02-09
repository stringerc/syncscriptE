import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Admin Login Modal
 * 
 * Research-based security approach:
 * - Password-only authentication (no OAuth needed for single admin)
 * - Session storage (cleared on browser close)
 * - Brute-force protection (5 attempts max)
 * - Password requirements: min 12 chars
 * 
 * Access Methods:
 * 1. Triple-click SyncScript logo
 * 2. Keyboard shortcut: Ctrl+Shift+A
 */
export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 300; // 5 minutes in seconds

  // Check if already locked
  useEffect(() => {
    const lockedUntil = localStorage.getItem('admin_locked_until');
    if (lockedUntil) {
      const remainingTime = Math.floor((parseInt(lockedUntil) - Date.now()) / 1000);
      if (remainingTime > 0) {
        setIsLocked(true);
        setLockTimer(remainingTime);
      } else {
        localStorage.removeItem('admin_locked_until');
        localStorage.removeItem('admin_attempts');
      }
    }

    const storedAttempts = localStorage.getItem('admin_attempts');
    if (storedAttempts) {
      setAttempts(parseInt(storedAttempts));
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            localStorage.removeItem('admin_locked_until');
            localStorage.removeItem('admin_attempts');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockTimer]);

  const handleLogin = async () => {
    if (isLocked) {
      toast.error('Too many failed attempts. Please wait.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Hash the password client-side for comparison
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store the correct hash in localStorage on first setup
      // For initial setup, admin should set password first
      let storedHash = localStorage.getItem('admin_password_hash');
      
      // First-time setup
      if (!storedHash) {
        if (password.length < 12) {
          toast.error('For security, admin password must be at least 12 characters');
          setIsLoading(false);
          return;
        }
        
        localStorage.setItem('admin_password_hash', hashHex);
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_session_start', Date.now().toString());
        
        toast.success('Admin password set successfully!');
        setPassword('');
        setAttempts(0);
        localStorage.removeItem('admin_attempts');
        onSuccess();
        setIsLoading(false);
        return;
      }

      // Verify password
      if (hashHex === storedHash) {
        // Success!
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_session_start', Date.now().toString());
        
        toast.success('Welcome back, Admin!');
        setPassword('');
        setAttempts(0);
        localStorage.removeItem('admin_attempts');
        onSuccess();
      } else {
        // Failed attempt
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        localStorage.setItem('admin_attempts', newAttempts.toString());

        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock account
          const lockedUntil = Date.now() + (LOCK_DURATION * 1000);
          localStorage.setItem('admin_locked_until', lockedUntil.toString());
          setIsLocked(true);
          setLockTimer(LOCK_DURATION);
          toast.error(`Too many failed attempts. Account locked for ${LOCK_DURATION / 60} minutes.`);
        } else {
          toast.error(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleResetPassword = () => {
    if (confirm('This will reset your admin password. You will set a new password on next login. Continue?')) {
      localStorage.removeItem('admin_password_hash');
      localStorage.removeItem('admin_attempts');
      localStorage.removeItem('admin_locked_until');
      setAttempts(0);
      setIsLocked(false);
      setLockTimer(0);
      toast.success('Password reset. You can now set a new password.');
    }
  };

  const formatLockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-yellow-500/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Shield className="w-6 h-6 text-yellow-500" />
            </div>
            <DialogTitle className="text-2xl text-white">Admin Access</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400">
            {localStorage.getItem('admin_password_hash') 
              ? 'Enter your admin password to access the dashboard'
              : 'Set your admin password (min 12 characters)'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Security Notice */}
          {!localStorage.getItem('admin_password_hash') && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-200">
                <strong>First-time setup:</strong> Create a strong password (min 12 characters). 
                Store it safely - there is no recovery option.
              </p>
            </div>
          )}

          {/* Lock Warning */}
          {isLocked && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-200 font-medium">Account Locked</p>
                <p className="text-xs text-red-300 mt-1">
                  Too many failed attempts. Try again in {formatLockTime(lockTimer)}
                </p>
              </div>
            </div>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-200">
                <strong>Warning:</strong> {MAX_ATTEMPTS - attempts} attempts remaining before lockout
              </p>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-gray-300">
              Admin Password
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter password"
                disabled={isLocked}
                className="pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLocked}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {!localStorage.getItem('admin_password_hash') && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                <li className={password.length >= 12 ? 'text-green-400' : ''}>
                  At least 12 characters
                </li>
                <li>Mix of letters, numbers, and symbols recommended</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleLogin}
              disabled={isLoading || isLocked || password.length === 0}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              {isLoading ? 'Authenticating...' : localStorage.getItem('admin_password_hash') ? 'Login' : 'Set Password'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>

          {/* Reset Password Link */}
          {localStorage.getItem('admin_password_hash') && (
            <button
              onClick={handleResetPassword}
              className="text-xs text-gray-500 hover:text-gray-400 underline w-full text-center"
            >
              Forgot password? Reset admin password
            </button>
          )}

          {/* Security Info */}
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              🔒 Session expires when browser closes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
