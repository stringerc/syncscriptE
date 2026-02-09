import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, X } from 'lucide-react';

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (milestone: {
    id: string;
    title: string;
    completed: boolean;
    completedBy: string | null;
    completedAt: string | null;
    assignedTo?: { name: string; image: string; fallback: string }[];
    steps?: any[];
    resources?: any[];
  }) => void;
  availableUsers: { name: string; image: string; fallback: string }[];
}

export function AddMilestoneDialog({ open, onOpenChange, onAdd, availableUsers }: AddMilestoneDialogProps) {
  const [title, setTitle] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<{ name: string; image: string; fallback: string }[]>([]);

  const handleAdd = () => {
    if (!title.trim()) return;
    
    const newMilestone = {
      id: `milestone-${Date.now()}`,
      title: title.trim(),
      completed: false,
      completedBy: null,
      completedAt: null,
      assignedTo: selectedUsers.length > 0 ? selectedUsers : undefined,
      steps: [],
      resources: []
    };
    
    onAdd(newMilestone);
    
    // Reset form
    setTitle('');
    setSelectedUsers([]);
    onOpenChange(false);
  };

  const toggleUser = (user: { name: string; image: string; fallback: string }) => {
    if (selectedUsers.find(u => u.name === user.name)) {
      setSelectedUsers(selectedUsers.filter(u => u.name !== user.name));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-md bg-[#1a1d24] border-gray-800 text-white !z-[110]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Milestone</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new milestone with optional assignees
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="milestone-title" className="text-sm text-gray-300">
              Milestone Title *
            </Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#2a2d35] border-gray-700 text-white"
              placeholder="Enter milestone title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>

          {/* Assign To */}
          {availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">
                <User className="w-4 h-4 inline mr-1" />
                Assign To (optional)
              </Label>
              <div className="bg-[#2a2d35] border border-gray-700 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                <div className="space-y-2">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUsers.find(u => u.name === user.name);
                    return (
                      <div
                        key={user.name}
                        onClick={() => toggleUser(user)}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-500/20 border border-teal-500/50' : 'hover:bg-gray-800'
                        }`}
                      >
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-white">{user.name}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.name}
                      className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/30 rounded-full pl-1 pr-2 py-1"
                    >
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-teal-300">{user.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUser(user);
                        }}
                        className="hover:bg-teal-500/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-teal-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setTitle('');
              setSelectedUsers([]);
              onOpenChange(false);
            }}
            className="hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Milestone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
