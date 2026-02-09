import { useState } from 'react';
import { Paperclip, File, Link as LinkIcon, X, Upload, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

export interface Attachment {
  id: string;
  type: 'file' | 'link';
  name: string;
  url?: string;
  size?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxLinks?: number;
  compact?: boolean;
}

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  maxFiles = 10,
  maxLinks = 10,
  compact = false,
}: AttachmentManagerProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const files = attachments.filter(a => a.type === 'file');
  const links = attachments.filter(a => a.type === 'link');

  const handleFileUpload = () => {
    if (files.length >= maxFiles) {
      toast.error('File limit reached', { 
        description: `Maximum ${maxFiles} files allowed per item` 
      });
      return;
    }

    // Simulate file upload
    const newFile: Attachment = {
      id: `file-${Date.now()}`,
      type: 'file',
      name: `Document_${files.length + 1}.pdf`,
      size: '2.4 MB',
    };

    onAttachmentsChange([...attachments, newFile]);
    toast.success('File attached', { description: newFile.name });
  };

  const handleAddLink = () => {
    if (links.length >= maxLinks) {
      toast.error('Link limit reached', { 
        description: `Maximum ${maxLinks} links allowed per item` 
      });
      return;
    }

    if (!linkUrl.trim()) {
      toast.error('Invalid link', { description: 'Please enter a valid URL' });
      return;
    }

    const newLink: Attachment = {
      id: `link-${Date.now()}`,
      type: 'link',
      name: linkName.trim() || linkUrl,
      url: linkUrl,
    };

    onAttachmentsChange([...attachments, newLink]);
    toast.success('Link attached');
    setLinkUrl('');
    setLinkName('');
    setIsAddingLink(false);
  };

  const handleRemove = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
    toast.success('Attachment removed');
  };

  const totalCount = attachments.length;
  const hasAttachments = totalCount > 0;

  if (compact) {
    // Compact view - just icon with badge
    return (
      <div className="flex items-center gap-2">
        {hasAttachments && (
          <div className="flex items-center gap-1 text-gray-400">
            <Paperclip className="w-4 h-4" />
            {totalCount >= 2 && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                {totalCount}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full management view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300 flex items-center gap-2">
          <Paperclip className="w-4 h-4" />
          Attachments
          {hasAttachments && (
            <Badge variant="outline" className="text-xs">
              {totalCount}/{maxFiles + maxLinks}
            </Badge>
          )}
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            disabled={files.length >= maxFiles}
            className="gap-2"
          >
            <Upload className="w-3 h-3" />
            File ({files.length}/{maxFiles})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingLink(!isAddingLink)}
            disabled={links.length >= maxLinks}
            className="gap-2"
          >
            <LinkIcon className="w-3 h-3" />
            Link ({links.length}/{maxLinks})
          </Button>
        </div>
      </div>

      {/* Add Link Form */}
      {isAddingLink && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 space-y-2">
          <Input
            placeholder="Link URL (required)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-white text-sm"
          />
          <Input
            placeholder="Link name (optional)"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="bg-gray-800/50 border-gray-700 text-white text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddLink}
              className="flex-1 bg-teal-600 hover:bg-teal-500"
            >
              Add Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingLink(false);
                setLinkUrl('');
                setLinkName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {hasAttachments && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-gray-800/30 border border-gray-700 rounded-lg p-2 group hover:border-gray-600 transition-colors"
            >
              {attachment.type === 'file' ? (
                <File className="w-4 h-4 text-blue-400 flex-shrink-0" />
              ) : (
                <LinkIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{attachment.name}</div>
                {attachment.size && (
                  <div className="text-xs text-gray-500">{attachment.size}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(attachment.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded transition-opacity"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!hasAttachments && !isAddingLink && (
        <div className="text-center py-6 text-sm text-gray-500 bg-gray-800/20 border border-dashed border-gray-700 rounded-lg">
          No attachments yet. Add files or links to get started.
        </div>
      )}
    </div>
  );
}
