import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, X } from 'lucide-react';

interface AddStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (step: {
    id: string;
    title: string;
    completed: boolean;
    assignedTo: { name: string; image: string; fallback: string };
  }) => void;
  availableUsers: { name: string; image: string; fallback: string }[];
  milestoneName: string;
}

export function AddStepDialog({ open, onOpenChange, onAdd, availableUsers, milestoneName }: AddStepDialogProps) {
  const [title, setTitle] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<{ name: string; image: string; fallback: string } | null>(null);

  const handleAdd = () => {
    if (!title.trim() || !selectedUser) return;
    
    const newStep = {
      id: `step-${Date.now()}`,
      title: title.trim(),
      completed: false,
      assignedTo: selectedUser,
    };
    
    onAdd(newStep);
    
    // Reset form
    setTitle('');
    setSelectedUser(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-md bg-[#1a1d24] border-gray-800 text-white !z-[120]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Step</DialogTitle>
          <DialogDescription className="text-gray-400">to {milestoneName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="step-title" className="text-sm text-gray-300">
              Step Title *
            </Label>
            <Input
              id="step-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#2a2d35] border-gray-700 text-white"
              placeholder="Enter step title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim() && selectedUser) {
                  handleAdd();
                }
              }}
            />
          </div>

          {/* Assign To (Required for steps) */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">
              <User className="w-4 h-4 inline mr-1" />
              Assign To *
            </Label>
            {availableUsers.length === 0 ? (
              <div className="bg-[#2a2d35] border border-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400 mb-2">No users assigned to this milestone</p>
                <p className="text-xs text-gray-500">Please assign users to the milestone first before adding steps.</p>
              </div>
            ) : (
              <>
                <div className="bg-[#2a2d35] border border-gray-700 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <div className="space-y-2">
                    {availableUsers.map((user) => {
                      const isSelected = selectedUser?.name === user.name;
                      return (
                        <div
                          key={user.name}
                          onClick={() => setSelectedUser(user)}
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
                {selectedUser && (
                  <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/30 rounded-full pl-1 pr-2 py-1 w-fit">
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs text-teal-300">{selectedUser.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(null);
                      }}
                      className="hover:bg-teal-500/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-teal-400" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setTitle('');
              setSelectedUser(null);
              onOpenChange(false);
            }}
            className="hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!title.trim() || !selectedUser}
            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}