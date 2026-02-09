/**
 * TeamPermissionsModal Component
 * 
 * Permissions management for teams (same pattern as event permissions).
 * Team lead/admin can set member permissions.
 */

import { useState } from 'react';
import { Shield, Crown, Eye, Edit, Trash2, UserPlus, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { AnimatedAvatar } from './AnimatedAvatar';

type TeamRole = 'admin' | 'editor' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: TeamRole;
  energy?: number;
  animation?: 'glow' | 'heartbeat' | 'pulse' | 'bounce';
}

interface TeamPermissionsModalProps {
  team: {
    id: string;
    name: string;
    admin: TeamMember;
    members: TeamMember[];
  };
  currentUserId: string;
  open: boolean;
  onClose: () => void;
  onRoleChange: (memberId: string, newRole: TeamRole) => void;
  onRemoveMember: (memberId: string) => void;
  onAdminTransfer: (newAdminId: string) => void;
  onInvite: (emails: string[]) => void;
}

export function TeamPermissionsModal({
  team,
  currentUserId,
  open,
  onClose,
  onRoleChange,
  onRemoveMember,
  onAdminTransfer,
  onInvite,
}: TeamPermissionsModalProps) {
  const [inviteEmails, setInviteEmails] = useState('');
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  const isAdmin = team.admin.id === currentUserId;
  const currentMember = team.members.find(m => m.id === currentUserId);
  const currentUserRole = currentMember?.role || 'viewer';

  const handleInvite = () => {
    if (!inviteEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emails = inviteEmails.split(',').map(e => e.trim()).filter(Boolean);
    onInvite(emails);
    setInviteEmails('');
    toast.success(`Invited ${emails.length} member${emails.length > 1 ? 's' : ''}`);
  };

  const handleRoleChange = (memberId: string, newRole: TeamRole) => {
    // Prevent admin from demoting themselves
    if (memberId === currentUserId && isAdmin && newRole !== 'admin') {
      toast.error('Admin cannot demote themselves', {
        description: 'Transfer admin role first to demote yourself',
      });
      return;
    }

    onRoleChange(memberId, newRole);
    toast.success('Role updated');
  };

  const handleRemove = (memberId: string) => {
    // Prevent removing yourself
    if (memberId === currentUserId) {
      toast.error('Cannot remove yourself from team');
      return;
    }

    // Prevent removing admin
    if (memberId === team.admin.id) {
      toast.error('Cannot remove team admin');
      return;
    }

    onRemoveMember(memberId);
    toast.success('Member removed from team');
  };

  const handleTransferAdmin = () => {
    if (!transferTarget) return;

    onAdminTransfer(transferTarget);
    setShowTransferConfirm(false);
    setTransferTarget(null);
    toast.success('Admin role transferred');
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'editor':
        return <Edit className="w-4 h-4 text-blue-400" />;
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'editor':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'viewer':
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-teal-400" />
            Team Permissions
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage team member roles and access levels for {team.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Members (Admin only) */}
          {isAdmin && (
            <div className="p-4 bg-[#252830] border border-gray-700 rounded-lg">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Invite Team Members
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="invite-emails" className="text-gray-300">
                    Email Addresses (comma-separated)
                  </Label>
                  <Input
                    id="invite-emails"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="user@example.com, another@example.com"
                    className="mt-1 bg-[#1a1c20] border-gray-800"
                  />
                </div>
                <Button onClick={handleInvite} className="w-full bg-gradient-to-r from-teal-600 to-blue-600">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitations
                </Button>
              </div>
            </div>
          )}

          {/* Role Descriptions */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white font-medium">Admin</span>
              </div>
              <p className="text-xs text-gray-400">Full control including permissions</p>
            </div>
            <div className="p-3 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Edit className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white font-medium">Editor</span>
              </div>
              <p className="text-xs text-gray-400">Can edit and manage tasks</p>
            </div>
            <div className="p-3 bg-[#252830] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white font-medium">Viewer</span>
              </div>
              <p className="text-xs text-gray-400">View-only access</p>
            </div>
          </div>

          {/* Team Members List */}
          <div>
            <h3 className="text-white font-medium mb-3">Team Members ({team.members.length})</h3>
            <div className="space-y-2">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 bg-[#252830] border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <AnimatedAvatar
                    src={member.avatar}
                    alt={member.name}
                    animation={member.animation || 'glow'}
                    size="sm"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{member.name}</p>
                      {member.id === team.admin.id && (
                        <Badge className={getRoleBadgeColor('admin')}>
                          <Crown className="w-3 h-3 mr-1" />
                          Team Lead
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>

                  {/* Role Selector (Admin only) */}
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: TeamRole) => handleRoleChange(member.id, value)}
                        disabled={member.id === team.admin.id}
                      >
                        <SelectTrigger className="w-32 bg-[#1a1c20] border-gray-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>

                      {member.id !== currentUserId && member.id !== team.admin.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Admin (Current Admin only) */}
          {isAdmin && !showTransferConfirm && (
            <div className="p-4 bg-orange-600/10 border border-orange-600/30 rounded-lg">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4 text-orange-400" />
                Transfer Team Lead Role
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Transfer admin privileges to another team member
              </p>
              <Button
                variant="outline"
                onClick={() => setShowTransferConfirm(true)}
                className="w-full border-orange-600/30 text-orange-400 hover:bg-orange-600/10"
              >
                Transfer Admin
              </Button>
            </div>
          )}

          {/* Transfer Confirmation */}
          {showTransferConfirm && (
            <div className="p-4 bg-orange-600/10 border border-orange-600/30 rounded-lg space-y-3">
              <h3 className="text-white font-medium">Confirm Admin Transfer</h3>
              <p className="text-sm text-orange-400">
                ⚠️ You will become an Editor after transferring admin role
              </p>
              <Select value={transferTarget || ''} onValueChange={setTransferTarget}>
                <SelectTrigger className="bg-[#1a1c20] border-gray-800">
                  <SelectValue placeholder="Select new admin" />
                </SelectTrigger>
                <SelectContent>
                  {team.members
                    .filter(m => m.id !== currentUserId)
                    .map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  onClick={handleTransferAdmin}
                  disabled={!transferTarget}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Confirm Transfer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransferConfirm(false);
                    setTransferTarget(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
