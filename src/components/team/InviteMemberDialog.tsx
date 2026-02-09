import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useTeam } from '../../contexts/TeamContext';
import { Mail, UserPlus } from 'lucide-react';
import { TeamRole } from '../../types/team';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

/**
 * InviteMemberDialog Component
 * 
 * Modal for inviting members to a team.
 * Features:
 * - Email input
 * - Role selection (admin/member)
 * - Sends invitation (mock)
 */
export function InviteMemberDialog({ open, onClose, teamId }: InviteMemberDialogProps) {
  const { inviteMember } = useTeam();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) return;

    setIsInviting(true);
    try {
      await inviteMember({
        teamId,
        email: email.trim(),
        role,
      });

      // Reset form
      setEmail('');
      setRole('member');
      onClose();
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    if (!isInviting) {
      setEmail('');
      setRole('member');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1d24] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Send an invitation to collaborate on this team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="member-email" className="text-sm text-gray-300">
              Email Address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="member-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white pl-10"
                disabled={isInviting}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="member-role" className="text-sm text-gray-300">
              Role
            </Label>
            <Select value={role} onValueChange={(value) => setRole(value as TeamRole)} disabled={isInviting}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {role === 'admin' 
                ? 'Can manage members, events, and settings' 
                : 'Can view and collaborate on team events'
              }
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Note:</span> In production, this will send an email invitation. For now, the member will be added immediately.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isInviting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!email.trim() || !email.includes('@') || isInviting}
            className="flex-1 gap-2"
          >
            <Mail className="w-4 h-4" />
            {isInviting ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
