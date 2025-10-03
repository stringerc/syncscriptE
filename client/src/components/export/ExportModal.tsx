import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Download, FileText, Calendar, Table, Code, Share2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope: {
    type: 'task' | 'tasks' | 'event' | 'project' | 'script';
    id?: string;
    ids?: string[];
    groupBy?: string;
  };
  title?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  availableFor: string[];
}

interface AudiencePreset {
  id: string;
  name: string;
  description: string;
  redactionLevel: 'none' | 'partial' | 'full';
}

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Professional documents for printing and sharing',
    icon: <FileText className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'event', 'project', 'script']
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Spreadsheet data for analysis',
    icon: <Table className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'event', 'project']
  },
  {
    id: 'xlsx',
    name: 'Excel',
    description: 'Advanced spreadsheet with formatting',
    icon: <Table className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'event', 'project']
  },
  {
    id: 'ics',
    name: 'Calendar',
    description: 'Import into calendar apps',
    icon: <Calendar className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'event', 'project']
  },
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Lightweight text format',
    icon: <Code className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'script']
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'Raw data for integrations',
    icon: <Code className="h-4 w-4" />,
    availableFor: ['task', 'tasks', 'event', 'project', 'script']
  }
];

const audiencePresets: AudiencePreset[] = [
  {
    id: 'owner',
    name: 'Owner/Admin',
    description: 'Full detail with all information',
    redactionLevel: 'none'
  },
  {
    id: 'team',
    name: 'Team Member',
    description: 'Full access, PII masked',
    redactionLevel: 'partial'
  },
  {
    id: 'vendor',
    name: 'Vendor',
    description: 'Only assigned tasks, no costs',
    redactionLevel: 'full'
  },
  {
    id: 'attendee',
    name: 'Attendee',
    description: 'Schedule and location only',
    redactionLevel: 'full'
  },
  {
    id: 'personal',
    name: 'Personal Checklist',
    description: 'Only your assigned tasks',
    redactionLevel: 'none'
  }
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  scope,
  title
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [selectedPreset, setSelectedPreset] = useState<string>('owner');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [options, setOptions] = useState({
    includeBudgets: true,
    includeAcceptanceCriteria: true,
    includeQRCodes: true,
    compactMode: false,
    passcodeProtect: false,
    expireInDays: 7
  });

  const { toast } = useToast();

  // Filter available formats based on scope
  const availableFormats = exportFormats.filter(format => 
    format.availableFor.includes(scope.type)
  );

  const previewMutation = useMutation({
    mutationFn: async (previewData: any) => {
      return api.post('/export/preview', previewData);
    },
    onSuccess: (response) => {
      setPreviewData(response.data.data.preview);
      setShowPreview(true);
    },
    onError: (error: any) => {
      toast({
        title: "Preview Failed",
        description: error.response?.data?.error || "Failed to generate preview",
        variant: "destructive"
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: async (exportData: any) => {
      if (scope.type === 'task') {
        return api.post(`/export/task/${scope.id}`, exportData);
      } else if (scope.type === 'tasks') {
        return api.post('/export/tasks', {
          ...exportData,
          taskIds: scope.ids
        });
      } else {
        // Use existing export endpoint for other scopes
        return api.post('/export/create', {
          exportType: exportData.format,
          scope: {
            type: scope.type,
            id: scope.id
          },
          audiencePreset: exportData.preset,
          redactionSettings: {
            hidePII: exportData.preset === 'vendor' || exportData.preset === 'attendee',
            hideBudgetNumbers: exportData.preset === 'attendee',
            hideInternalNotes: exportData.preset === 'vendor' || exportData.preset === 'attendee',
            hideRestrictedItems: true,
            watermark: exportData.preset !== 'owner',
            passcodeProtect: exportData.passcodeProtect,
            expireShareLink: exportData.passcodeProtect
          },
          deliveryOptions: {
            download: true,
            email: false,
            shareLink: exportData.preset === 'vendor',
            pushToCloud: false,
            calendarSubscribe: false
          },
          ...exportData.options
        });
      }
    },
    onSuccess: (response) => {
      const exportJob = response.data.data.exportJob;
      
      toast({
        title: "Export Started",
        description: `Your ${selectedFormat.toUpperCase()} export is being generated. You'll be notified when it's ready.`,
        variant: "default"
      });

      // Close modal
      onClose();

      // TODO: Handle download or share link based on export job
      if (exportJob.deliveryOptions?.download) {
        // Trigger download when ready
        console.log('Export job created:', exportJob.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.response?.data?.error || "Failed to create export",
        variant: "destructive"
      });
    }
  });

  const handlePreview = () => {
    const previewData = {
      exportType: selectedFormat,
      scope: {
        type: scope.type,
        id: scope.id,
        ids: scope.ids,
        groupBy: scope.groupBy
      },
      audiencePreset: selectedPreset,
      sections: ['Overview', 'Tasks', 'Events', 'Budget']
    };

    previewMutation.mutate(previewData);
  };

  const handleExport = () => {
    const exportData = {
      format: selectedFormat,
      preset: selectedPreset,
      options: {
        ...options,
        groupBy: scope.groupBy
      },
      passcodeProtect: options.passcodeProtect
    };

    exportMutation.mutate(exportData);
  };

  const getScopeDescription = () => {
    switch (scope.type) {
      case 'task':
        return 'Single Task';
      case 'tasks':
        return `${scope.ids?.length || 0} Selected Tasks`;
      case 'event':
        return 'Event';
      case 'project':
        return 'Project';
      case 'script':
        return 'Script';
      default:
        return 'Export';
    }
  };

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);
  const selectedPresetInfo = audiencePresets.find(p => p.id === selectedPreset);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="z-[60]" />
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export {getScopeDescription()}
          </DialogTitle>
          <DialogDescription>
            {title || `Export ${getScopeDescription().toLowerCase()} in your preferred format`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableFormats.map((format) => (
                <div
                  key={format.id}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {format.icon}
                    <span className="font-medium text-sm">{format.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{format.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Preset */}
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[70]">
                {audiencePresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-gray-500">{preset.description}</div>
                      </div>
                      <Badge 
                        variant={
                          preset.redactionLevel === 'none' ? 'default' :
                          preset.redactionLevel === 'partial' ? 'secondary' : 'destructive'
                        }
                        className="ml-2"
                      >
                        {preset.redactionLevel}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBudgets"
                  checked={options.includeBudgets}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeBudgets: !!checked }))
                  }
                />
                <Label htmlFor="includeBudgets" className="text-sm">
                  Include budget information
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAcceptanceCriteria"
                  checked={options.includeAcceptanceCriteria}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeAcceptanceCriteria: !!checked }))
                  }
                />
                <Label htmlFor="includeAcceptanceCriteria" className="text-sm">
                  Include acceptance criteria
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeQRCodes"
                  checked={options.includeQRCodes}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeQRCodes: !!checked }))
                  }
                />
                <Label htmlFor="includeQRCodes" className="text-sm">
                  Include QR codes for quick access
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compactMode"
                  checked={options.compactMode}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, compactMode: !!checked }))
                  }
                />
                <Label htmlFor="compactMode" className="text-sm">
                  Compact mode (smaller files)
                </Label>
              </div>

              {selectedPreset === 'vendor' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passcodeProtect"
                    checked={options.passcodeProtect}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, passcodeProtect: !!checked }))
                    }
                  />
                  <Label htmlFor="passcodeProtect" className="text-sm">
                    Passcode protect share link
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <strong>Preview:</strong> {selectedFormatInfo?.name} export for {selectedPresetInfo?.name} audience
              {selectedPresetInfo?.redactionLevel !== 'none' && (
                <span className="text-orange-600 ml-1">
                  (with {selectedPresetInfo.redactionLevel} redaction)
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="secondary"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="flex items-center gap-2"
          >
            {previewMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Previewing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
          <Button 
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2"
          >
            {exportMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {selectedFormatInfo?.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Preview Modal */}
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogOverlay className="z-[80]" />
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto z-[80]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Preview
          </DialogTitle>
          <DialogDescription>
            Preview of your {selectedFormatInfo?.name} export for {selectedPresetInfo?.name} audience
          </DialogDescription>
        </DialogHeader>

        {previewData && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Export Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Format:</span> {previewData.format?.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Estimated Size:</span> {Math.round((previewData.estimatedSize || 0) / 1024)} KB
                </div>
                <div>
                  <span className="font-medium">Estimated Time:</span> {previewData.estimatedTime || '2-3 minutes'}
                </div>
                <div>
                  <span className="font-medium">Sections:</span> {previewData.sections?.length || 0} included
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Preview Content</h3>
              <div className="text-sm space-y-2">
                <div><strong>Title:</strong> {previewData.preview?.title}</div>
                <div><strong>Description:</strong> {previewData.preview?.description}</div>
                <div><strong>Sections:</strong> {previewData.preview?.sections?.join(', ')}</div>
                {previewData.preview?.redactions && previewData.preview.redactions.length > 0 && (
                  <div><strong>Redactions:</strong> {previewData.preview.redactions.join(', ')}</div>
                )}
              </div>
            </div>

            {previewData.preview?.redactions && previewData.preview.redactions.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-orange-800">Privacy Notice</h3>
                <p className="text-sm text-orange-700">
                  This export will have the following information redacted: {previewData.preview.redactions.join(', ')}. 
                  Sensitive information will be hidden or replaced with placeholders.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Close Preview
          </Button>
          <Button onClick={() => {
            setShowPreview(false);
            handleExport();
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;