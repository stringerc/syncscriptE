import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Link as LinkIcon, Paperclip, X } from 'lucide-react';

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: { type: 'task' | 'milestone' | 'step', id?: string, milestoneId?: string, name: string } | null;
  taskResources: any[];
  setTaskResources: (resources: any[]) => void;
  milestoneResources: Record<string, any[]>;
  setMilestoneResources: (resources: Record<string, any[]>) => void;
  stepResources: Record<string, any[]>;
  setStepResources: (resources: Record<string, any[]>) => void;
  isTaskLeader: boolean; // Now checks if user is creator or admin
}

export function AddResourceDialog({ 
  open, 
  onOpenChange, 
  context,
  taskResources,
  setTaskResources,
  milestoneResources,
  setMilestoneResources,
  stepResources,
  setStepResources,
  isTaskLeader
}: AddResourceDialogProps) {
  const [resourceType, setResourceType] = React.useState<'link' | 'file' | null>(null);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkName, setLinkName] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddLink = () => {
    if (linkUrl && linkName && context) {
      const newResource = {
        id: Date.now().toString(),
        type: 'link' as const,
        name: linkName,
        url: linkUrl,
        addedBy: 'Sarah Chen', // Mock current user
        addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      if (context.type === 'task') {
        setTaskResources([...taskResources, newResource]);
      } else if (context.type === 'milestone' && context.id) {
        setMilestoneResources({
          ...milestoneResources,
          [context.id]: [...(milestoneResources[context.id] || []), newResource]
        });
      } else if (context.type === 'step' && context.id) {
        setStepResources({
          ...stepResources,
          [context.id]: [...(stepResources[context.id] || []), newResource]
        });
      }

      // Reset form
      setLinkUrl('');
      setLinkName('');
      setResourceType(null);
      onOpenChange(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && context) {
      // Convert file size to readable format
      const fileSizeKB = (file.size / 1024).toFixed(2);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const fileSize = file.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;

      const newResource = {
        id: Date.now().toString(),
        type: 'file' as const,
        name: file.name,
        fileName: file.name,
        fileSize: fileSize,
        url: URL.createObjectURL(file), // In real app, this would upload to server
        addedBy: 'Sarah Chen', // Mock current user
        addedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };

      if (context.type === 'task') {
        setTaskResources([...taskResources, newResource]);
      } else if (context.type === 'milestone' && context.id) {
        setMilestoneResources({
          ...milestoneResources,
          [context.id]: [...(milestoneResources[context.id] || []), newResource]
        });
      } else if (context.type === 'step' && context.id) {
        setStepResources({
          ...stepResources,
          [context.id]: [...(stepResources[context.id] || []), newResource]
        });
      }
      
      // Reset form
      setResourceType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setResourceType(null);
    setLinkUrl('');
    setLinkName('');
    onOpenChange(false);
  };

  if (!context) return null;

  const contextTypeLabel = context.type === 'task' ? 'Task' : context.type === 'milestone' ? 'Milestone' : 'Step';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1d24] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add Resource to {contextTypeLabel}</DialogTitle>
          <DialogDescription className="text-gray-400">{context.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!resourceType ? (
            // Choose resource type
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Choose resource type:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setResourceType('link')}
                  className="p-6 bg-[#2a2d35] border border-gray-700 rounded-lg hover:bg-[#32353d] hover:border-blue-500/50 transition-all group"
                >
                  <LinkIcon className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm text-white">Link</div>
                  <div className="text-xs text-gray-400 mt-1">Add a URL</div>
                </button>
                <button
                  onClick={() => {
                    setResourceType('file');
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="p-6 bg-[#2a2d35] border border-gray-700 rounded-lg hover:bg-[#32353d] hover:border-teal-500/50 transition-all group"
                >
                  <Paperclip className="w-8 h-8 text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm text-white">File</div>
                  <div className="text-xs text-gray-400 mt-1">Upload a file</div>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : resourceType === 'link' ? (
            // Add link form
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Link Name</label>
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g., Design Mockups"
                  className="w-full px-3 py-2 bg-[#2a2d35] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-[#2a2d35] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setResourceType(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleAddLink}
                  disabled={!linkUrl || !linkName}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Link
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}