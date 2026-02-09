// PHASE 3: Role Management Modal Component
// Research-backed role management interface for creators/admins
// Based on: Slack's permission management patterns, GitHub collaborator UI

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedAvatar } from '@/components/task/AnimatedAvatar';
import { Crown, Shield, User, Eye, Info, Check, AlertCircle, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email?: string;
  image?: string;
  fallback: string;
  role: 'creator' | 'admin' | 'collaborator' | 'viewer';
  status?: 'online' | 'away' | 'offline';
  progress?: number;
  animationType?: string;
}

interface RoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'task' | 'goal';
  itemTitle: string;
  collaborators: Collaborator[];
  currentUserRole: 'creator' | 'admin' | 'collaborator' | 'viewer';
  onUpdateRole: (collaboratorId: string, newRole: 'admin' | 'collaborator' | 'viewer') => void;
  onRemoveCollaborator?: (collaboratorId: string) => void;
  onInviteCollaborator?: () => void;
}

const ROLE_DESCRIPTIONS = {
  creator: {
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
    label: 'Creator',
    description: 'Full control - can manage all aspects and delete the item',
    permissions: ['Edit all details', 'Delete item', 'Manage collaborators', 'Change privacy settings', 'Archive/unarchive']
  },
  admin: {
    icon: Shield,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    label: 'Admin',
    description: 'Can manage and edit, but cannot delete',
    permissions: ['Edit all details', 'Manage collaborators', 'Change privacy settings', 'Archive/unarchive']
  },
  collaborator: {
    icon: User,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    label: 'Collaborator',
    description: 'Can update progress and complete assigned items',
    permissions: ['Update progress', 'Complete assigned items', 'Add comments', 'View all details']
  },
  viewer: {
    icon: Eye,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    borderColor: 'border-gray-500/30',
    label: 'Viewer',
    description: 'Read-only access - can view but not edit',
    permissions: ['View all details', 'Add comments']
  }
};

export function RoleManagementModal({
  open,
  onOpenChange,
  itemType,
  itemTitle,
  collaborators,
  currentUserRole,
  onUpdateRole,
  onRemoveCollaborator,
  onInviteCollaborator
}: RoleManagementModalProps) {
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  const canManageRoles = currentUserRole === 'creator' || currentUserRole === 'admin';

  const handleRoleChange = (collaboratorId: string, newRole: string) => {
    if (!canManageRoles) {
      toast.error('Permission denied', {
        description: 'Only creators and admins can change roles'
      });
      return;
    }

    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (collaborator?.role === 'creator') {
      toast.error('Cannot change creator role', {
        description: 'The creator role cannot be changed or transferred'
      });
      return;
    }

    setPendingChanges(prev => ({ ...prev, [collaboratorId]: newRole }));
  };

  const handleSaveChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    Object.entries(pendingChanges).forEach(([collaboratorId, newRole]) => {
      onUpdateRole(collaboratorId, newRole as 'admin' | 'collaborator' | 'viewer');
    });

    toast.success('Roles updated successfully', {
      description: `Updated ${Object.keys(pendingChanges).length} collaborator role(s)`
    });

    setPendingChanges({});
  };

  const handleRemove = (collaboratorId: string) => {
    if (!canManageRoles || !onRemoveCollaborator) return;

    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (collaborator?.role === 'creator') {
      toast.error('Cannot remove creator', {
        description: 'The creator cannot be removed from the item'
      });
      return;
    }

    onRemoveCollaborator(collaboratorId);
    toast.success('Collaborator removed', {
      description: `${collaborator?.name} has been removed`
    });
  };

  const getEffectiveRole = (collaboratorId: string, currentRole: string) => {
    return pendingChanges[collaboratorId] || currentRole;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1d24] border-gray-800 text-white max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            Manage Access & Roles
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Control who can access and edit "{itemTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Role Information Banner */}
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-teal-300 mb-1">
                  About Roles & Permissions
                </h4>
                <p className="text-xs text-gray-300">
                  {canManageRoles 
                    ? 'As a creator/admin, you can assign roles to control what each collaborator can do. Changes take effect immediately.'
                    : 'You can view collaborator roles but cannot modify them. Contact the creator or an admin to request changes.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Collaborators List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-300">
                Collaborators ({collaborators.length})
              </h3>
              {canManageRoles && onInviteCollaborator && (
                <Button
                  size="sm"
                  onClick={onInviteCollaborator}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              )}
            </div>

            {collaborators.map((collaborator) => {
              const effectiveRole = getEffectiveRole(collaborator.id, collaborator.role);
              const roleInfo = ROLE_DESCRIPTIONS[effectiveRole as keyof typeof ROLE_DESCRIPTIONS];
              const RoleIcon = roleInfo.icon;
              const hasChanges = pendingChanges[collaborator.id] !== undefined;

              return (
                <div
                  key={collaborator.id}
                  className={`bg-gray-900/40 border rounded-lg p-4 transition-all ${
                    hasChanges ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' : 'border-gray-700/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <AnimatedAvatar
                        name={collaborator.name}
                        image={collaborator.image}
                        fallback={collaborator.fallback}
                        size={48}
                        animationType={collaborator.animationType}
                        progress={collaborator.progress}
                      />
                      {collaborator.status && (
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${
                          collaborator.status === 'online' ? 'bg-green-400' :
                          collaborator.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                        }`} />
                      )}
                    </div>

                    {/* Info & Role Selector */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white truncate">
                              {collaborator.name}
                            </h4>
                            {hasChanges && (
                              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          {collaborator.email && (
                            <p className="text-xs text-gray-400 truncate">{collaborator.email}</p>
                          )}
                        </div>

                        {/* Role Selector or Badge */}
                        {canManageRoles && collaborator.role !== 'creator' ? (
                          <Select
                            value={effectiveRole}
                            onValueChange={(value) => handleRoleChange(collaborator.id, value)}
                          >
                            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e2128] border-gray-700">
                              <SelectItem value="admin" className="text-white">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="collaborator" className="text-white">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-green-400" />
                                  Collaborator
                                </div>
                              </SelectItem>
                              <SelectItem value="viewer" className="text-white">
                                <div className="flex items-center gap-2">
                                  <Eye className="w-3.5 h-3.5 text-gray-400" />
                                  Viewer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${roleInfo.bgColor} ${roleInfo.color} ${roleInfo.borderColor} border`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                        )}
                      </div>

                      {/* Role Description */}
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-400 flex-1">
                          {roleInfo.description}
                        </p>
                        
                        {/* Remove Button */}
                        {canManageRoles && collaborator.role !== 'creator' && onRemoveCollaborator && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(collaborator.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Expanded Permissions View */}
                      {selectedCollaborator === collaborator.id && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <h5 className="text-xs font-medium text-gray-300 mb-2">Permissions:</h5>
                          <ul className="space-y-1">
                            {roleInfo.permissions.map((permission, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                <Check className="w-3 h-3 text-teal-400" />
                                {permission}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Toggle Permissions Button */}
                      <button
                        onClick={() => setSelectedCollaborator(
                          selectedCollaborator === collaborator.id ? null : collaborator.id
                        )}
                        className="text-xs text-teal-400 hover:text-teal-300 mt-2"
                      >
                        {selectedCollaborator === collaborator.id ? 'Hide' : 'View'} permissions
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Legend */}
          <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Role Descriptions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ROLE_DESCRIPTIONS).map(([role, info]) => {
                const Icon = info.icon;
                return (
                  <div key={role} className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 ${info.color} mt-0.5 shrink-0`} />
                    <div>
                      <h5 className={`text-xs font-medium ${info.color}`}>{info.label}</h5>
                      <p className="text-xs text-gray-400 mt-0.5">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-400">
            {Object.keys(pendingChanges).length > 0 && (
              <span className="text-teal-400">
                {Object.keys(pendingChanges).length} unsaved change(s)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingChanges({});
                onOpenChange(false);
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {Object.keys(pendingChanges).length > 0 ? 'Cancel' : 'Close'}
            </Button>
            {canManageRoles && Object.keys(pendingChanges).length > 0 && (
              <Button
                onClick={handleSaveChanges}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
