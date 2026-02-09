// PHASE 4: Enhanced Role Management Modal with Future Enhancements
// Includes: Bulk Operations, Permission History, Role Templates, Temporary Access
// Research-backed: Slack, GitHub, Google Workspace permission patterns

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatedAvatar } from '@/components/AnimatedAvatar';
import { 
  Crown, Shield, User, Eye, Info, Check, AlertCircle, UserPlus, X,
  CheckSquare, History, Sparkles, Clock, Filter, Search, Calendar, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

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
  addedAt?: string;
  expiresAt?: string; // For temporary access
}

interface PermissionHistoryEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'role_changed' | 'added' | 'removed' | 'invited';
  target: string;
  details: string;
  oldRole?: string;
  newRole?: string;
}

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  roles: Record<string, 'admin' | 'collaborator' | 'viewer'>;
  icon: string;
}

interface EnhancedRoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'task' | 'goal';
  itemTitle: string;
  collaborators: Collaborator[];
  currentUserRole: 'creator' | 'admin' | 'collaborator' | 'viewer';
  onUpdateRole: (collaboratorId: string, newRole: 'admin' | 'collaborator' | 'viewer', expiresAt?: string) => void;
  onBulkUpdateRoles?: (updates: Array<{ id: string; role: string; expiresAt?: string }>) => void;
  onRemoveCollaborator?: (collaboratorId: string) => void;
  onInviteCollaborator?: () => void;
  permissionHistory?: PermissionHistoryEntry[];
  roleTemplates?: RoleTemplate[];
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

const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'marketing-team',
    name: 'Marketing Team',
    description: 'Full collaboration access for marketing team members',
    roles: {},
    icon: '📢'
  },
  {
    id: 'dev-team',
    name: 'Development Team',
    description: 'Admin access for developers, viewer for others',
    roles: {},
    icon: '💻'
  },
  {
    id: 'executive-view',
    name: 'Executive View',
    description: 'Viewer access for executives and stakeholders',
    roles: {},
    icon: '👔'
  },
  {
    id: 'client-access',
    name: 'Client Access',
    description: 'Limited viewer access for external clients',
    roles: {},
    icon: '🤝'
  }
];

export function EnhancedRoleManagementModal({
  open,
  onOpenChange,
  itemType,
  itemTitle,
  collaborators,
  currentUserRole,
  onUpdateRole,
  onBulkUpdateRoles,
  onRemoveCollaborator,
  onInviteCollaborator,
  permissionHistory = [],
  roleTemplates = DEFAULT_ROLE_TEMPLATES
}: EnhancedRoleManagementModalProps) {
  const [selectedCollaborators, setSelectedCollaborators] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Record<string, { role: string; expiresAt?: string }>>({});
  const [bulkRole, setBulkRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showExpired, setShowExpired] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [temporaryAccessDuration, setTemporaryAccessDuration] = useState<string>('');

  const canManageRoles = currentUserRole === 'creator' || currentUserRole === 'admin';
  const isBulkMode = selectedCollaborators.size > 0;

  // Filter collaborators based on search and role filter
  const filteredCollaborators = useMemo(() => {
    return collaborators.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || c.role === roleFilter;
      const matchesExpiry = showExpired || !c.expiresAt || new Date(c.expiresAt) > new Date();
      return matchesSearch && matchesRole && matchesExpiry;
    });
  }, [collaborators, searchQuery, roleFilter, showExpired]);

  // Check if a collaborator has temporary access expiring soon
  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  const handleToggleCollaborator = (id: string) => {
    const collaborator = collaborators.find(c => c.id === id);
    if (collaborator?.role === 'creator') return; // Can't select creator
    
    const newSelected = new Set(selectedCollaborators);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCollaborators(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCollaborators.size === filteredCollaborators.filter(c => c.role !== 'creator').length) {
      setSelectedCollaborators(new Set());
    } else {
      const allIds = filteredCollaborators.filter(c => c.role !== 'creator').map(c => c.id);
      setSelectedCollaborators(new Set(allIds));
    }
  };

  const handleBulkRoleChange = () => {
    if (!bulkRole || selectedCollaborators.size === 0) {
      toast.error('Please select collaborators and a role');
      return;
    }

    const expiresAt = temporaryAccessDuration ? calculateExpiryDate(temporaryAccessDuration) : undefined;

    selectedCollaborators.forEach(id => {
      setPendingChanges(prev => ({
        ...prev,
        [id]: { role: bulkRole, expiresAt }
      }));
    });

    toast.success(`Updated ${selectedCollaborators.size} collaborator(s)`, {
      description: temporaryAccessDuration ? `Access expires ${expiresAt}` : 'Role changes pending save'
    });

    setSelectedCollaborators(new Set());
    setBulkRole('');
    setTemporaryAccessDuration('');
  };

  const handleRoleChange = (collaboratorId: string, newRole: string, expiresAt?: string) => {
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

    setPendingChanges(prev => ({ ...prev, [collaboratorId]: { role: newRole, expiresAt } }));
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = roleTemplates.find(t => t.id === templateId);
    if (!template) return;

    let updatedCount = 0;
    filteredCollaborators.forEach(collab => {
      if (collab.role !== 'creator' && template.roles[collab.id]) {
        setPendingChanges(prev => ({
          ...prev,
          [collab.id]: { role: template.roles[collab.id] }
        }));
        updatedCount++;
      }
    });

    toast.success(`Applied template: ${template.name}`, {
      description: `${updatedCount} role(s) updated`
    });
  };

  const handleSaveChanges = () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to save');
      return;
    }

    if (onBulkUpdateRoles && Object.keys(pendingChanges).length > 1) {
      const updates = Object.entries(pendingChanges).map(([id, change]) => ({
        id,
        role: change.role,
        expiresAt: change.expiresAt
      }));
      onBulkUpdateRoles(updates);
    } else {
      Object.entries(pendingChanges).forEach(([collaboratorId, change]) => {
        onUpdateRole(collaboratorId, change.role as 'admin' | 'collaborator' | 'viewer', change.expiresAt);
      });
    }

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
    return pendingChanges[collaboratorId]?.role || currentRole;
  };

  const getEffectiveExpiry = (collaboratorId: string, currentExpiry?: string) => {
    return pendingChanges[collaboratorId]?.expiresAt || currentExpiry;
  };

  const calculateExpiryDate = (duration: string): string => {
    const now = new Date();
    switch (duration) {
      case '1h':
        now.setHours(now.getHours() + 1);
        break;
      case '24h':
        now.setHours(now.getHours() + 24);
        break;
      case '7d':
        now.setDate(now.getDate() + 7);
        break;
      case '30d':
        now.setDate(now.getDate() + 30);
        break;
      case '90d':
        now.setDate(now.getDate() + 90);
        break;
      default:
        return '';
    }
    return now.toISOString();
  };

  const formatExpiryDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1d24] border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            Manage Access & Roles
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Control who can access and edit "{itemTitle}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="collaborators" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-gray-900 border-b border-gray-800 justify-start rounded-none p-0">
            <TabsTrigger 
              value="collaborators" 
              className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Collaborators ({collaborators.length})
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300"
            >
              <History className="w-4 h-4 mr-2" />
              History ({permissionHistory.length})
            </TabsTrigger>
          </TabsList>

          {/* COLLABORATORS TAB */}
          <TabsContent value="collaborators" className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
            {/* Filters & Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] bg-gray-900 border-gray-700 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2128] border-gray-700">
                    <SelectItem value="all" className="text-white">All Roles</SelectItem>
                    <SelectItem value="admin" className="text-white">Admins</SelectItem>
                    <SelectItem value="collaborator" className="text-white">Collaborators</SelectItem>
                    <SelectItem value="viewer" className="text-white">Viewers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions Bar */}
              {canManageRoles && (
                <div className="bg-gray-900/60 border border-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAll}
                      className="border-gray-700 text-gray-300"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedCollaborators.size === filteredCollaborators.filter(c => c.role !== 'creator').length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>

                    {isBulkMode && (
                      <>
                        <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                          {selectedCollaborators.size} selected
                        </Badge>
                        <Select value={bulkRole} onValueChange={setBulkRole}>
                          <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Change role..." />
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

                        {/* Temporary Access Duration */}
                        <Select value={temporaryAccessDuration} onValueChange={setTemporaryAccessDuration}>
                          <SelectTrigger className="w-[160px] bg-gray-800 border-gray-700 text-white">
                            <Clock className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Permanent" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1e2128] border-gray-700">
                            <SelectItem value="" className="text-white">Permanent</SelectItem>
                            <SelectItem value="1h" className="text-white">1 Hour</SelectItem>
                            <SelectItem value="24h" className="text-white">24 Hours</SelectItem>
                            <SelectItem value="7d" className="text-white">7 Days</SelectItem>
                            <SelectItem value="30d" className="text-white">30 Days</SelectItem>
                            <SelectItem value="90d" className="text-white">90 Days</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={handleBulkRoleChange}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          Apply to Selected
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                      ? 'Select multiple collaborators to update roles in bulk. Set temporary access with expiry dates for time-limited permissions.'
                      : 'You can view collaborator roles but cannot modify them. Contact the creator or an admin to request changes.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Collaborators List */}
            <div className="space-y-3">
              {filteredCollaborators.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No collaborators found</p>
                </div>
              ) : (
                filteredCollaborators.map((collaborator) => {
                  const effectiveRole = getEffectiveRole(collaborator.id, collaborator.role);
                  const effectiveExpiry = getEffectiveExpiry(collaborator.id, collaborator.expiresAt);
                  const roleInfo = ROLE_DESCRIPTIONS[effectiveRole as keyof typeof ROLE_DESCRIPTIONS] || ROLE_DESCRIPTIONS.viewer;
                  const RoleIcon = roleInfo.icon;
                  const hasChanges = pendingChanges[collaborator.id] !== undefined;
                  const isSelected = selectedCollaborators.has(collaborator.id);
                  const isExpired = effectiveExpiry && new Date(effectiveExpiry) < new Date();
                  const expiringSoon = isExpiringSoon(effectiveExpiry);

                  return (
                    <div
                      key={collaborator.id}
                      className={`bg-gray-900/40 border rounded-lg p-4 transition-all ${
                        hasChanges ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' :
                        isSelected ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' :
                        'border-gray-700/30'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Selection Checkbox */}
                        {canManageRoles && collaborator.role !== 'creator' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleCollaborator(collaborator.id)}
                            className="mt-3"
                          />
                        )}

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
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-sm font-medium text-white truncate">
                                  {collaborator.name}
                                </h4>
                                {hasChanges && (
                                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                                {isExpired && (
                                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Expired
                                  </Badge>
                                )}
                                {expiringSoon && !isExpired && (
                                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Expires soon
                                  </Badge>
                                )}
                              </div>
                              {collaborator.email && (
                                <p className="text-xs text-gray-400 truncate">{collaborator.email}</p>
                              )}
                              {effectiveExpiry && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  Access expires: {formatExpiryDate(effectiveExpiry)}
                                </p>
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

                          {/* Role Description & Actions */}
                          <div className="flex items-center justify-between gap-3">
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
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* TEMPLATES TAB */}
          <TabsContent value="templates" className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-teal-300 mb-1">
                    Role Templates
                  </h4>
                  <p className="text-xs text-gray-300">
                    Apply pre-configured role sets to quickly organize team permissions
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-gray-900/40 border rounded-lg p-4 cursor-pointer transition-all hover:border-teal-500/50 ${
                    selectedTemplate === template.id ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' : 'border-gray-700/30'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-400">{template.description}</p>
                    </div>
                  </div>
                  {canManageRoles && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(template.id);
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply Template
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Template Creator */}
            {canManageRoles && (
              <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Create Custom Template
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Save your current role configuration as a reusable template
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              </div>
            )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="flex-1 overflow-y-auto space-y-3 mt-4 pr-2">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <History className="w-5 h-5 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-teal-300 mb-1">
                    Permission History
                  </h4>
                  <p className="text-xs text-gray-300">
                    Audit trail of all role changes and access modifications
                  </p>
                </div>
              </div>
            </div>

            {permissionHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No permission history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {permissionHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          entry.action === 'added' ? 'bg-green-400' :
                          entry.action === 'removed' ? 'bg-red-400' :
                          entry.action === 'role_changed' ? 'bg-blue-400' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">
                            <span className="text-teal-400">{entry.actor}</span>
                            {' '}{entry.details}
                          </p>
                          {entry.oldRole && entry.newRole && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-gray-700/30 text-gray-400 border-gray-600/30 text-xs">
                                {entry.oldRole}
                              </Badge>
                              <span className="text-gray-500">→</span>
                              <Badge variant="outline" className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
                                {entry.newRole}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{entry.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            {Object.keys(pendingChanges).length > 0 && (
              <span className="text-xs text-teal-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {Object.keys(pendingChanges).length} unsaved change(s)
              </span>
            )}
            {canManageRoles && onInviteCollaborator && (
              <Button
                size="sm"
                variant="outline"
                onClick={onInviteCollaborator}
                className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingChanges({});
                setSelectedCollaborators(new Set());
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
                Save Changes ({Object.keys(pendingChanges).length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}