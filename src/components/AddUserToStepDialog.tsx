import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { AnimatedAvatar } from './AnimatedAvatar';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AddUserToStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: {
    id: string;
    milestoneId: string;
    name: string;
    assignedTo?: { name: string; image: string; fallback: string };
  } | null;
  availableUsers: {
    name: string;
    image: string;
    fallback: string;
    progress: number;
    animationType: 'glow' | 'pulse' | 'heartbeat' | 'bounce' | 'wiggle' | 'shake';
    status?: 'online' | 'away' | 'offline';
    role?: 'creator' | 'admin' | 'collaborator' | 'viewer';
  }[];
  onAssignUser: (milestoneId: string, stepId: string, user: { name: string; image: string; fallback: string }) => void;
  onUnassignUser: (milestoneId: string, stepId: string) => void;
}

export function AddUserToStepDialog({ 
  open, 
  onOpenChange, 
  step, 
  availableUsers,
  onAssignUser,
  onUnassignUser
}: AddUserToStepDialogProps) {
  if (!step) return null;

  const currentlyAssigned = step.assignedTo;
  const unassignedUsers = availableUsers.filter(u => u.name !== currentlyAssigned?.name);

  const handleAssignUser = (user: { name: string; image: string; fallback: string }) => {
    onAssignUser(step.milestoneId, step.id, user);
    toast.success(`${user.name} assigned to step`, {
      description: step.name
    });
    onOpenChange(false);
  };

  const handleUnassignUser = () => {
    if (currentlyAssigned) {
      onUnassignUser(step.milestoneId, step.id);
      toast.success(`${currentlyAssigned.name} removed from step`, {
        description: step.name
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] bg-[#1a1d24] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Assign User to Step
          </DialogTitle>
          <DialogDescription className="text-gray-400">{step.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Currently Assigned User */}
          {currentlyAssigned && (
            <div>
              <div className="text-sm text-gray-400 mb-3">Currently Assigned</div>
              <div 
                className="flex items-center gap-3 p-3 bg-[#2a2d35] border border-gray-800 rounded-lg hover:border-purple-600/50 transition-colors"
              >
                <AnimatedAvatar
                  name={currentlyAssigned.name}
                  image={currentlyAssigned.image}
                  fallback={currentlyAssigned.fallback}
                  size={40}
                  progress={0}
                  animationType="glow"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{currentlyAssigned.name}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 hover:bg-red-500/10 hover:text-red-400"
                  onClick={handleUnassignUser}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Available Users to Assign */}
          {unassignedUsers.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-3">
                {currentlyAssigned ? 'Reassign to' : 'Available to Assign'} ({unassignedUsers.length})
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {unassignedUsers.map((user, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-[#2a2d35] border border-gray-800 rounded-lg hover:border-purple-600/50 transition-colors cursor-pointer"
                    onClick={() => handleAssignUser({ name: user.name, image: user.image, fallback: user.fallback })}
                  >
                    <AnimatedAvatar
                      name={user.name}
                      image={user.image}
                      fallback={user.fallback}
                      size={40}
                      progress={user.progress}
                      animationType={user.animationType}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.progress}% energy</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 hover:bg-purple-500/10 hover:text-purple-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssignUser({ name: user.name, image: user.image, fallback: user.fallback });
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unassignedUsers.length === 0 && !currentlyAssigned && (
            <div className="text-sm text-gray-400 text-center py-4">
              No collaborators available to assign
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="hover:bg-gray-800"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
