/**
 * ResourceManager Component
 * 
 * Manages files and links for tasks and goals with plan-based limits.
 * 
 * Features:
 * - Add files and links
 * - Plan-based limits (Free: 3+10, Pro: 20+50, Team: 50+100, Enterprise: unlimited)
 * - Inline error with upgrade link when limit hit
 * - Preview and delete resources
 * - Mock upload/add functionality
 */

import { useState } from 'react';
import { Paperclip, Link as LinkIcon, X, ExternalLink, File, FileText, Image, Video, Music, Archive, Upload, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import { BillingModal, LimitType } from './BillingModal';

export interface Resource {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'link';
  fileType?: 'pdf' | 'doc' | 'spreadsheet' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  size?: string;
  addedAt?: string;
}

type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

interface ResourceLimits {
  files: number;
  links: number;
}

const PLAN_LIMITS: Record<PlanTier, ResourceLimits> = {
  free: { files: 3, links: 10 },
  pro: { files: 20, links: 50 },
  team: { files: 50, links: 100 },
  enterprise: { files: Infinity, links: Infinity },
};

interface ResourceManagerProps {
  resources: Resource[];
  onResourcesChange: (resources: Resource[]) => void;
  currentPlan?: PlanTier;
  onUpgradeClick?: () => void;
}

export function ResourceManager({
  resources,
  onResourcesChange,
  currentPlan = 'free',
  onUpgradeClick,
}: ResourceManagerProps) {
  const [isAddFileOpen, setIsAddFileOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingLimitType, setBillingLimitType] = useState<LimitType>('files');

  const limits = PLAN_LIMITS[currentPlan];
  const fileCount = resources.filter(r => r.type === 'file').length;
  const linkCount = resources.filter(r => r.type === 'link').length;

  const canAddFile = currentPlan === 'enterprise' || fileCount < limits.files;
  const canAddLink = currentPlan === 'enterprise' || linkCount < limits.links;

  const handleAddFile = () => {
    if (!canAddFile) {
      setBillingLimitType('files');
      setShowBillingModal(true);
      toast.error('File limit reached', {
        description: `Your ${currentPlan} plan allows ${limits.files} files per item. Click to upgrade.`,
        action: {
          label: 'Upgrade',
          onClick: () => setShowBillingModal(true),
        },
      });
      return;
    }
    setIsAddFileOpen(true);
  };

  const handleAddLink = () => {
    if (!canAddLink) {
      setBillingLimitType('links');
      setShowBillingModal(true);
      toast.error('Link limit reached', {
        description: `Your ${currentPlan} plan allows ${limits.links} links per item. Click to upgrade.`,
        action: {
          label: 'Upgrade',
          onClick: () => setShowBillingModal(true),
        },
      });
      return;
    }
    setIsAddLinkOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check limit
    if (!canAddFile) {
      toast.error('File limit reached', {
        description: `Your ${currentPlan} plan allows ${limits.files} files per item.`,
      });
      return;
    }

    // Mock file upload
    const newResource: Resource = {
      id: Date.now().toString(),
      name: file.name,
      url: `https://example.com/files/${file.name}`,
      type: 'file',
      fileType: getFileType(file.name),
      size: formatFileSize(file.size),
      addedAt: new Date().toISOString(),
    };

    onResourcesChange([...resources, newResource]);
    toast.success('File uploaded', { description: newResource.name });
    setIsAddFileOpen(false);
  };

  const handleAddLinkSubmit = () => {
    if (!linkName.trim() || !linkUrl.trim()) {
      toast.error('Please fill in both fields');
      return;
    }

    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    if (!canAddLink) {
      toast.error('Link limit reached', {
        description: `Your ${currentPlan} plan allows ${limits.links} links per item.`,
      });
      return;
    }

    const newResource: Resource = {
      id: Date.now().toString(),
      name: linkName,
      url: linkUrl,
      type: 'link',
      addedAt: new Date().toISOString(),
    };

    onResourcesChange([...resources, newResource]);
    toast.success('Link added', { description: linkName });
    setLinkName('');
    setLinkUrl('');
    setIsAddLinkOpen(false);
  };

  const handleRemoveResource = (id: string) => {
    const resource = resources.find(r => r.id === id);
    onResourcesChange(resources.filter(r => r.id !== id));
    toast.success('Resource removed', { description: resource?.name });
  };

  return (
    <div className="space-y-4">
      {/* Header with counts and limits */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Files: {fileCount}/{currentPlan === 'enterprise' ? '∞' : limits.files}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              Links: {linkCount}/{currentPlan === 'enterprise' ? '∞' : limits.links}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddFile}
                  disabled={!canAddFile}
                  className={!canAddFile ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add File
                </Button>
              </TooltipTrigger>
              {!canAddFile && (
                <TooltipContent>
                  <p>File limit reached. Upgrade to add more.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!canAddLink}
                  className={!canAddLink ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </TooltipTrigger>
              {!canAddLink && (
                <TooltipContent>
                  <p>Link limit reached. Upgrade to add more.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Limit warning */}
      {(!canAddFile || !canAddLink) && (
        <div className="flex items-center gap-2 p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <p className="text-sm text-orange-400 flex-1">
            You've reached your {currentPlan} plan limit for {!canAddFile && 'files'}{!canAddFile && !canAddLink && ' and '}{!canAddLink && 'links'}.
          </p>
          {onUpgradeClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUpgradeClick}
              className="text-orange-400 hover:text-orange-300"
            >
              Upgrade
            </Button>
          )}
        </div>
      )}

      {/* Resource list */}
      <div className="space-y-2">
        <AnimatePresence>
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-3 bg-[#252830] border border-gray-700 rounded-lg group hover:border-gray-600 transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {resource.type === 'file' ? (
                  getFileIcon(resource.fileType)
                ) : (
                  <LinkIcon className="w-5 h-5 text-blue-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{resource.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {resource.type === 'file' ? resource.size : 'Link'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => window.open(resource.url, '_blank')}
                        className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Open</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleRemoveResource(resource.id)}
                        className="p-1.5 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {resources.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No resources added yet
          </div>
        )}
      </div>

      {/* Add File Dialog */}
      <Dialog open={isAddFileOpen} onOpenChange={setIsAddFileOpen}>
        <DialogContent className="bg-[#1e2128] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add File</DialogTitle>
            <DialogDescription className="text-gray-400">
              Upload a file to attach to this item
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="file-upload" className="text-white">Choose a file to upload</Label>
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-teal-600 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-400">Click to browse files</span>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
        <DialogContent className="bg-[#1e2128] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Link</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a web link or external resource
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link-name" className="text-white">Link Name</Label>
              <Input
                id="link-name"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                placeholder="e.g., Design Mockups"
                className="mt-1 bg-[#1a1c20] border-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="link-url" className="text-white">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-1 bg-[#1a1c20] border-gray-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLinkSubmit} className="bg-gradient-to-r from-teal-600 to-cyan-600">
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing Modal */}
      <BillingModal
        open={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        limitType={billingLimitType}
        currentCount={billingLimitType === 'files' ? fileCount : linkCount}
        limitCount={billingLimitType === 'files' ? limits.files : limits.links}
      />
    </div>
  );
}

/**
 * ResourceIcons Component
 * 
 * Shows resource count badges on task/goal cards.
 * - Only shows if resources exist
 * - Icon only if count is 1
 * - Number badge if count >= 2
 * - Tooltip preview on hover
 */

interface ResourceIconsProps {
  resources: Resource[];
  size?: 'sm' | 'md';
}

export function ResourceIcons({ resources, size = 'md' }: ResourceIconsProps) {
  if (resources.length === 0) return null;

  const fileCount = resources.filter(r => r.type === 'file').length;
  const linkCount = resources.filter(r => r.type === 'link').length;

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-2">
      {fileCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Paperclip className={`${iconSize} text-gray-400`} />
                {fileCount >= 2 && (
                  <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {fileCount}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">Files ({fileCount})</p>
                {resources
                  .filter(r => r.type === 'file')
                  .slice(0, 5)
                  .map(r => (
                    <p key={r.id} className="text-xs">• {r.name}</p>
                  ))}
                {fileCount > 5 && <p className="text-xs text-gray-400">+{fileCount - 5} more</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {linkCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <LinkIcon className={`${iconSize} text-gray-400`} />
                {linkCount >= 2 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {linkCount}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">Links ({linkCount})</p>
                {resources
                  .filter(r => r.type === 'link')
                  .slice(0, 5)
                  .map(r => (
                    <p key={r.id} className="text-xs">• {r.name}</p>
                  ))}
                {linkCount > 5 && <p className="text-xs text-gray-400">+{linkCount - 5} more</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Helper functions
function getFileType(filename: string): Resource['fileType'] {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac'].includes(ext)) return 'audio';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java'].includes(ext)) return 'code';
  
  return 'other';
}

function getFileIcon(fileType?: Resource['fileType']) {
  const className = 'w-5 h-5';
  
  switch (fileType) {
    case 'pdf':
      return <FileText className={`${className} text-red-400`} />;
    case 'doc':
      return <FileText className={`${className} text-blue-400`} />;
    case 'spreadsheet':
      return <FileText className={`${className} text-green-400`} />;
    case 'image':
      return <Image className={`${className} text-purple-400`} />;
    case 'video':
      return <Video className={`${className} text-pink-400`} />;
    case 'audio':
      return <Music className={`${className} text-orange-400`} />;
    case 'archive':
      return <Archive className={`${className} text-yellow-400`} />;
    case 'code':
      return <FileText className={`${className} text-cyan-400`} />;
    default:
      return <File className={`${className} text-gray-400`} />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}