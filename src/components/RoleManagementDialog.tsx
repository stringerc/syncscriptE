import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, Shield, Users, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AnimatedAvatar } from './AnimatedAvatar';

interface Collaborator {
  name: string;
  image: string;
  fallback: string;
  progress: number;
  animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
  status?: 'online' | 'away' | 'offline';
  role: 'creator' | 'admin' | 'collaborator' | 'viewer';
}

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  collaborators: Collaborator[];
  currentUserRole: 'creator' | 'admin' | 'collaborator' | 'viewer';
  onUpdateRole: (memberName: string, newRole: 'admin' | 'collaborator' | 'viewer') => void;
}

export function RoleManagementDialog({ 
  open, 
  onOpenChange, 
  goalTitle,
  collaborators,
  currentUserRole,
  onUpdateRole
}: RoleManagementDialogProps) {
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'admin' | 'collaborator' | 'viewer'>>({});

  const canManageRoles = currentUserRole === 'creator' || currentUserRole === 'admin';

  const roleInfo = {
    creator: {
      icon: Crown,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500',
      description: 'Full control, cannot be changed',
      permissions: ['All permissions', 'Delete goal', 'Manage roles', 'Edit goal', 'Add collaborators']
    },
    admin: {
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500',
      description: 'Can manage goal and collaborators',
      permissions: ['Manage roles', 'Edit goal', 'Add/remove collaborators', 'Manage milestones']
    },
    collaborator: {
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      borderColor: 'border-cyan-500',
      description: 'Can contribute to goal progress',
      permissions: ['Update progress', 'Complete milestones', 'Add comments', 'View all content']
    },
    viewer: {
      icon: Eye,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500',
      description: 'Read-only access',
      permissions: ['View goal', 'View progress', 'View comments']
    }
  };

  const getEffectiveRole = (member: Collaborator) => {
    return pendingChanges[member.name] || member.role;
  };

  const handleRoleChange = (memberName: string, newRole: 'admin' | 'collaborator' | 'viewer') => {
    const member = collaborators.find(c => c.name === memberName);
    if (!member) return;

    if (member.role === newRole) {
      // Remove pending change if reverting to original
      const { [memberName]: _, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } else {
      setPendingChanges({
        ...pendingChanges,
        [memberName]: newRole
      });
    }
  };

  const handleApplyChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to apply');
      return;
    }

    Object.entries(pendingChanges).forEach(([memberName, newRole]) => {
      onUpdateRole(memberName, newRole);
    });

    toast.success('Roles updated', { 
      description: `${Object.keys(pendingChanges).length} role(s) have been updated` 
    });
    setPendingChanges({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Role Management
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">{goalTitle}</p>
        </DialogHeader>

        {!canManageRoles && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-400">
              You don't have permission to manage roles. Only creators and admins can change roles.
            </p>
          </div>
        )}

        <div className="space-y-6 mt-4">
          {/* Role Permissions Reference */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(roleInfo).map(([role, info]) => {
              const Icon = info.icon;
              return (
                <div key={role} className={`p-3 rounded-lg border ${info.borderColor} ${info.bgColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${info.color}`} />
                    <span className={`text-sm font-medium ${info.color} capitalize`}>{role}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{info.description}</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {info.permissions.slice(0, 3).map((perm, i) => (
                      <li key={i}>• {perm}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Team Members */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-300">Team Members</h3>
            {collaborators.map((member) => {
              const effectiveRole = getEffectiveRole(member);
              const hasChange = pendingChanges[member.name] !== undefined;
              const roleData = roleInfo[effectiveRole as keyof typeof roleInfo] || roleInfo.viewer; // Fallback to viewer if role not found
              const RoleIcon = roleData.icon;
              const isCreator = member.role === 'creator';

              return (
                <div 
                  key={member.name}
                  className={`p-4 rounded-lg border transition-all ${
                    hasChange 
                      ? 'border-yellow-500 bg-yellow-500/10' 
                      : 'border-gray-700 bg-[#2a2d35]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AnimatedAvatar
                        name={member.name}
                        image={member.image}
                        fallback={member.fallback}
                        progress={member.progress}
                        animationType={member.animationType}
                        size={40}
                      />
                      <div>
                        <p className="text-sm text-white font-medium">{member.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${roleData.color} ${roleData.borderColor}`}
                          >
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {effectiveRole}
                          </Badge>
                          {member.status && (
                            <span className={`text-xs ${
                              member.status === 'online' ? 'text-emerald-400' :
                              member.status === 'away' ? 'text-amber-400' :
                              'text-gray-500'
                            }`}>
                              {member.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role Controls */}
                    <div className="flex items-center gap-2">
                      {isCreator ? (
                        <span className="text-xs text-gray-500 italic">Cannot change</span>
                      ) : canManageRoles ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(member.name, 'admin')}
                            disabled={effectiveRole === 'admin'}
                            className={`text-xs ${
                              effectiveRole === 'admin' 
                                ? 'border-purple-500 text-purple-400' 
                                : 'border-gray-700 hover:border-purple-500 hover:text-purple-400'
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(member.name, 'collaborator')}
                            disabled={effectiveRole === 'collaborator'}
                            className={`text-xs ${
                              effectiveRole === 'collaborator' 
                                ? 'border-cyan-500 text-cyan-400' 
                                : 'border-gray-700 hover:border-cyan-500 hover:text-cyan-400'
                            }`}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Collaborator
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRoleChange(member.name, 'viewer')}
                            disabled={effectiveRole === 'viewer'}
                            className={`text-xs ${
                              effectiveRole === 'viewer' 
                                ? 'border-gray-500 text-gray-400' 
                                : 'border-gray-700 hover:border-gray-500 hover:text-gray-400'
                            }`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Viewer
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">View only</span>
                      )}
                    </div>
                  </div>

                  {hasChange && (
                    <div className="mt-3 pt-3 border-t border-yellow-500/30">
                      <p className="text-xs text-yellow-400">
                        Role will change: <span className="capitalize">{member.role}</span> → <span className="capitalize">{effectiveRole}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(pendingChanges).length > 0 && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">
                {Object.keys(pendingChanges).length} pending change(s) • Click "Apply Changes" to save
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => {
              setPendingChanges({});
              onOpenChange(false);
            }}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyChanges}
            disabled={Object.keys(pendingChanges).length === 0}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50"
          >
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}