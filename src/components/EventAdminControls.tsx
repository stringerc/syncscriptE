/**
 * EventAdminControls Component
 * 
 * Per-event admin controls for calendar events.
 * 
 * Features:
 * - Invite users to event
 * - Promote/demote roles for this event only
 * - Admin transfer: admin cannot demote themselves unless transferring
 * - Mock implementations with proper UI/UX
 */

import { useState } from 'react';
import { Users, UserPlus, Shield, Crown, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface EventMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

interface EventAdminControlsProps {
  event: {
    id: string;
    title: string;
    members?: EventMember[];
  };
  currentUserId: string;
  onInvite: (emails: string[]) => void;
  onRoleChange: (memberId: string, newRole: EventMember['role']) => void;
  onAdminTransfer: (newAdminId: string) => void;
  onRemoveMember: (memberId: string) => void;
}

export function EventAdminControls({
  event,
  currentUserId,
  onInvite,
  onRoleChange,
  onAdminTransfer,
  onRemoveMember,
}: EventAdminControlsProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [transferToMemberId, setTransferToMemberId] = useState('');

  const currentMember = event.members?.find(m => m.id === currentUserId);
  const isAdmin = currentMember?.role === 'admin';

  if (!isAdmin) return null;

  const handleInvite = () => {
    const emails = inviteEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    onInvite(emails);
    toast.success(`Invited ${emails.length} ${emails.length === 1 ? 'person' : 'people'}`, {
      description: 'They will receive an email invitation',
    });
    setInviteEmails('');
    setShowInviteModal(false);
  };

  const handleRoleChange = (memberId: string, newRole: EventMember['role']) => {
    const member = event.members?.find(m => m.id === memberId);
    
    // Prevent admin from demoting themselves
    if (memberId === currentUserId && currentMember?.role === 'admin' && newRole !== 'admin') {
      toast.error('Cannot demote yourself', {
        description: 'Transfer admin role to another member first',
      });
      return;
    }

    onRoleChange(memberId, newRole);
    toast.success(`Role updated to ${newRole}`, {
      description: `${member?.name} is now an ${newRole}`,
    });
  };

  const handleAdminTransfer = () => {
    if (!transferToMemberId) {
      toast.error('Please select a member');
      return;
    }

    const newAdmin = event.members?.find(m => m.id === transferToMemberId);
    
    onAdminTransfer(transferToMemberId);
    toast.success('Admin role transferred', {
      description: `${newAdmin?.name} is now the event admin`,
    });
    setShowTransferModal(false);
    setTransferToMemberId('');
  };

  const handleRemoveMember = (memberId: string) => {
    const member = event.members?.find(m => m.id === memberId);
    
    if (memberId === currentUserId) {
      toast.error('Cannot remove yourself', {
        description: 'Transfer admin role first if you want to leave',
      });
      return;
    }

    onRemoveMember(memberId);
    toast.success('Member removed', {
      description: `${member?.name} removed from event`,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-[#252830] border border-gray-700 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-400" />
          <h4 className="text-white font-medium">Event Admin Controls</h4>
        </div>
        <Badge variant="outline" className="border-teal-600 text-teal-400">
          Admin
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInviteModal(true)}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Users
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTransferModal(true)}
          className="gap-2"
        >
          <Crown className="w-4 h-4" />
          Transfer Admin
        </Button>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Event Members ({event.members?.length || 0})</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {event.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-[#1a1c20] border border-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Role Selector */}
                <Select
                  value={member.role}
                  onValueChange={(value) => handleRoleChange(member.id, value as EventMember['role'])}
                  disabled={member.id === currentUserId && member.role === 'admin'}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs bg-[#252830] border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                {/* Remove Button */}
                {member.id !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Warning */}
      {currentMember?.role === 'admin' && (
        <div className="flex items-start gap-2 p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-400">
            As admin, you cannot demote yourself. Transfer admin role to another member if needed.
          </p>
        </div>
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#1e2128] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Users to Event</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send invitations to team members via email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="invite-emails" className="text-white">
                Email Addresses
              </Label>
              <Input
                id="invite-emails"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="email@example.com, another@example.com"
                className="mt-1 bg-[#1a1c20] border-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple emails with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} className="bg-gradient-to-r from-teal-600 to-cyan-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Send Invites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Admin Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="bg-[#1e2128] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Transfer Admin Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Transfer administrative privileges to another team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-2 p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-400">
                You will become an editor after transferring admin role. This action cannot be undone unless the new admin transfers it back.
              </p>
            </div>

            <div>
              <Label htmlFor="transfer-to" className="text-white">
                Select New Admin
              </Label>
              <Select value={transferToMemberId} onValueChange={setTransferToMemberId}>
                <SelectTrigger className="mt-1 bg-[#1a1c20] border-gray-800">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {event.members
                    ?.filter(m => m.id !== currentUserId)
                    .map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdminTransfer} className="bg-gradient-to-r from-orange-600 to-yellow-600">
              <Crown className="w-4 h-4 mr-2" />
              Transfer Admin Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
