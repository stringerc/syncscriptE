import { useState } from 'react';
import { Crown, UserPlus, Shield, UserMinus, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner@2.0.3';
import { Event } from '../utils/event-task-types';

export type EventRole = 'admin' | 'editor' | 'viewer';

export interface EventMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: EventRole;
}

interface EventAdminManagerProps {
  event: Event;
  currentUserId: string;
  onUpdateEvent: (event: Event) => void;
}

export function EventAdminManager({
  event,
  currentUserId,
  onUpdateEvent,
}: EventAdminManagerProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<EventRole>('viewer');

  // Convert Event team members to EventMember format
  const members: EventMember[] = (event.teamMembers || []).map(tm => ({
    id: tm.id,
    name: tm.name,
    email: tm.email || `${tm.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    avatar: tm.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    role: (event.permissionOverrides?.find(po => po.userId === tm.id)?.role || 'viewer') as EventRole,
  }));

  const currentUser = members.find(m => m.id === currentUserId);
  const isCurrentUserAdmin = currentUser?.role === 'admin' || event.createdBy === currentUserId;
  const adminCount = members.filter(m => m.role === 'admin').length;

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Email required', { description: 'Please enter an email address' });
      return;
    }

    // Simulate user lookup and invite
    const newMember: EventMember = {
      id: `user-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      role: inviteRole,
    };

    const updatedEvent: Event = {
      ...event,
      teamMembers: [...(event.teamMembers || []), { id: newMember.id, name: newMember.name, email: newMember.email, avatar: newMember.avatar }],
      permissionOverrides: [...(event.permissionOverrides || []), { userId: newMember.id, role: newMember.role }],
    };

    onUpdateEvent(updatedEvent);
    toast.success('Invitation sent', {
      description: `${inviteEmail} has been invited as ${inviteRole}`,
    });
    
    setInviteEmail('');
    setInviteRole('viewer');
    setShowInviteDialog(false);
  };

  const handleRoleChange = (memberId: string, newRole: EventRole) => {
    const member = members.find(m => m.id === memberId);
    
    // Prevent demoting last admin
    if (member?.role === 'admin' && adminCount === 1 && newRole !== 'admin') {
      toast.error('Cannot demote last admin', {
        description: 'Transfer admin role to another member first',
      });
      setShowTransferDialog(true);
      return;
    }

    // Prevent self-demotion from admin
    if (memberId === currentUserId && member?.role === 'admin' && newRole !== 'admin') {
      toast.error('Cannot demote yourself', {
        description: 'Transfer admin role to another member first',
      });
      setShowTransferDialog(true);
      return;
    }

    const updatedEvent: Event = {
      ...event,
      permissionOverrides: (event.permissionOverrides || []).map(po => 
        po.userId === memberId ? { ...po, role: newRole } : po
      ),
    };

    onUpdateEvent(updatedEvent);
    
    toast.success('Role updated', {
      description: `${member?.name} is now ${newRole}`,
    });
  };

  const handleTransferAdmin = () => {
    if (!selectedUserForTransfer) {
      toast.error('Select a user', { description: 'Please select who will become admin' });
      return;
    }

    const updatedEvent: Event = {
      ...event,
      permissionOverrides: (event.permissionOverrides || []).map(po => 
        po.userId === currentUserId ? { ...po, role: 'editor' as EventRole } : 
        po.userId === selectedUserForTransfer ? { ...po, role: 'admin' as EventRole } : po
      ),
    };

    onUpdateEvent(updatedEvent);

    toast.success('Admin transferred', {
      description: 'You are now an editor',
    });
    
    setSelectedUserForTransfer('');
    setShowTransferDialog(false);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    
    // Prevent removing last admin
    if (member?.role === 'admin' && adminCount === 1) {
      toast.error('Cannot remove last admin', {
        description: 'Transfer admin role to another member first',
      });
      return;
    }

    // Prevent removing self if admin
    if (memberId === currentUserId && member?.role === 'admin') {
      toast.error('Cannot remove yourself as admin', {
        description: 'Transfer admin role to another member first',
      });
      return;
    }

    const updatedEvent: Event = {
      ...event,
      teamMembers: (event.teamMembers || []).filter(tm => tm.id !== memberId),
      permissionOverrides: (event.permissionOverrides || []).filter(po => po.userId !== memberId),
    };

    onUpdateEvent(updatedEvent);
    toast.success('Member removed', {
      description: `${member?.name} has been removed from this event`,
    });
  };

  const getRoleColor = (role: EventRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'editor':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleIcon = (role: EventRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      case 'editor':
        return <Shield className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium mb-1">Event Members</h3>
          <p className="text-sm text-gray-400">{members.length} members</p>
        </div>
        {isCurrentUserAdmin && (
          <Button
            onClick={() => setShowInviteDialog(true)}
            size="sm"
            className="gap-2 bg-teal-600 hover:bg-teal-500"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between bg-gray-800/30 border border-gray-700 rounded-lg p-3 group hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="w-10 h-10">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-white truncate">{member.name}</div>
                  {member.id === currentUserId && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">{member.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentUserAdmin && member.id !== currentUserId ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => handleRoleChange(member.id, value as EventRole)}
                >
                  <SelectTrigger className="w-28 h-8 bg-gray-800/50 border-gray-700 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2128] border-gray-800">
                    <SelectItem value="admin" className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Crown className="w-3 h-3" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="editor" className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        Editor
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer" className="text-gray-300">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={`${getRoleColor(member.role)} gap-1`}>
                  {getRoleIcon(member.role)}
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              )}

              {isCurrentUserAdmin && member.id !== currentUserId && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-opacity"
                >
                  <UserMinus className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <AlertCircle className="w-4 h-4" />
          <span className="font-medium">Role Permissions</span>
        </div>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• <strong className="text-purple-400">Admin:</strong> Full control, can manage members</div>
          <div>• <strong className="text-blue-400">Editor:</strong> Can edit event details and tasks</div>
          <div>• <strong className="text-gray-400">Viewer:</strong> Can view only</div>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a team member to this event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as EventRole)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2128] border-gray-800">
                  <SelectItem value="admin" className="text-gray-300">Admin</SelectItem>
                  <SelectItem value="editor" className="text-gray-300">Editor</SelectItem>
                  <SelectItem value="viewer" className="text-gray-300">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} className="bg-teal-600 hover:bg-teal-500">
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Admin Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              Transfer Admin Role
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a member to become the new admin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-600/10 border border-amber-600/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                You will become an editor after transferring admin rights
              </p>
            </div>

            <div className="space-y-2">
              <Label>Select New Admin</Label>
              <Select value={selectedUserForTransfer} onValueChange={setSelectedUserForTransfer}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2128] border-gray-800">
                  {members
                    .filter(m => m.id !== currentUserId)
                    .map(member => (
                      <SelectItem key={member.id} value={member.id} className="text-gray-300">
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferAdmin} className="bg-purple-600 hover:bg-purple-500">
              <ArrowRight className="w-4 h-4 mr-2" />
              Transfer Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}