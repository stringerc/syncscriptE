import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useTeam } from '../../contexts/TeamContext';
import { Users, Palette } from 'lucide-react';

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * CreateTeamDialog Component
 * 
 * Modal for creating a new team.
 * Features:
 * - Team name input
 * - Description textarea
 * - Color picker for team branding
 * - Creates team with current user as owner
 */

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function CreateTeamDialog({ open, onClose }: CreateTeamDialogProps) {
  const { createTeam } = useTeam();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await createTeam({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      });

      // Reset form
      setName('');
      setDescription('');
      setSelectedColor(PRESET_COLORS[0]);
      onClose();
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      setSelectedColor(PRESET_COLORS[0]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1d24] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Create New Team
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set up a new team to collaborate on events and goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm text-gray-300">
              Team Name *
            </Label>
            <Input
              id="team-name"
              placeholder="e.g., Product Team, Marketing, Design Squad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
              maxLength={50}
              disabled={isCreating}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="team-description" className="text-sm text-gray-300">
              Description (optional)
            </Label>
            <Textarea
              id="team-description"
              placeholder="What does this team work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white resize-none"
              rows={3}
              maxLength={200}
              disabled={isCreating}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Team Color
            </Label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={isCreating}
                  className={`
                    w-8 h-8 rounded-lg transition-all
                    ${selectedColor === color 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d24] scale-110' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: `${selectedColor}20`, 
                  borderColor: `${selectedColor}40`, 
                  borderWidth: 1 
                }}
              >
                <Users className="w-5 h-5" style={{ color: selectedColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {name || 'Team Name'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {description || 'Team description'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="flex-1"
          >
            {isCreating ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
