import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Share2, 
  FileText, 
  FileSpreadsheet, 
  Calendar, 
  Eye, 
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultScope?: {
    type: 'project' | 'event' | 'script' | 'timeframe';
    id?: string;
    range?: string;
  };
}

interface ExportOptions {
  exportType: 'pdf' | 'docx' | 'pptx' | 'csv' | 'xlsx' | 'ics' | 'html' | 'json';
  scope: {
    type: 'project' | 'event' | 'script' | 'timeframe';
    id?: string;
    range?: string;
  };
  audiencePreset: 'owner' | 'team' | 'vendor' | 'attendee' | 'personal';
  redactionSettings: {
    hidePII: boolean;
    hideBudgetNumbers: boolean;
    hideInternalNotes: boolean;
    hideRestrictedItems: boolean;
    watermark: boolean;
    passcodeProtect: boolean;
    expireShareLink: boolean;
    removeAvatars: boolean;
  };
  sections: string[];
  deliveryOptions: {
    download: boolean;
    email: boolean;
    shareLink: boolean;
    pushToCloud: boolean;
    calendarSubscribe: boolean;
  };
}

const exportTypes = [
  { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Run-of-Show, Briefing Pack' },
  { value: 'docx', label: 'Word Document', icon: FileText, description: 'Playbook, Narrative Brief' },
  { value: 'pptx', label: 'PowerPoint', icon: FileText, description: 'Stakeholder Deck' },
  { value: 'csv', label: 'CSV Data', icon: FileSpreadsheet, description: 'Raw data export' },
  { value: 'xlsx', label: 'Excel Spreadsheet', icon: FileSpreadsheet, description: 'Formatted data export' },
  { value: 'ics', label: 'Calendar Feed', icon: Calendar, description: 'iCal calendar file' },
  { value: 'html', label: 'Web Page', icon: Eye, description: 'Shareable HTML page' },
  { value: 'json', label: 'JSON Data', icon: FileText, description: 'Raw data dump' }
];

const audiencePresets = [
  { 
    value: 'owner', 
    label: 'Owner/Admin', 
    description: 'Full access, no redactions',
    redactions: []
  },
  { 
    value: 'team', 
    label: 'Team Members', 
    description: 'Hide sensitive budget info',
    redactions: ['hideBudgetNumbers']
  },
  { 
    value: 'vendor', 
    label: 'Vendors', 
    description: 'Hide internal notes and PII',
    redactions: ['hideInternalNotes', 'hidePII']
  },
  { 
    value: 'attendee', 
    label: 'Attendees', 
    description: 'Public information only',
    redactions: ['hideBudgetNumbers', 'hideInternalNotes', 'hidePII']
  },
  { 
    value: 'personal', 
    label: 'Personal Checklist', 
    description: 'Your personal copy',
    redactions: []
  }
];

const availableSections = [
  'Overview',
  'Tasks',
  'Events',
  'Budget',
  'Timeline',
  'Resources',
  'Notes',
  'Attendees',
  'Vendors',
  'Checklist'
];

export function ExportModal({ isOpen, onClose, defaultScope }: ExportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportType: 'pdf',
    scope: defaultScope || { type: 'project' },
    audiencePreset: 'owner',
    redactionSettings: {
      hidePII: false,
      hideBudgetNumbers: false,
      hideInternalNotes: false,
      hideRestrictedItems: false,
      watermark: false,
      passcodeProtect: false,
      expireShareLink: false,
      removeAvatars: false
    },
    sections: ['Overview', 'Tasks', 'Events'],
    deliveryOptions: {
      download: true,
      email: false,
      shareLink: false,
      pushToCloud: false,
      calendarSubscribe: false
    }
  });

  // Fetch user's projects, events, and scripts for scope selection
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  const { data: scripts } = useQuery({
    queryKey: ['scripts'],
    queryFn: async () => {
      const response = await api.get('/scripts/my-scripts');
      return response.data.data || [];
    },
    enabled: isOpen
  });

  // Create export job mutation
  const createExportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await api.post('/export/create', options);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Export Started",
        description: "Your export is being generated. You'll be notified when it's ready.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.response?.data?.error || "Failed to start export",
        variant: "destructive"
      });
    }
  });

  // Preview export mutation
  const previewMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      const response = await api.post('/export/preview', options);
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.data.preview);
    }
  });

  const [previewData, setPreviewData] = useState<any>(null);

  const handleExportTypeChange = (exportType: string) => {
    setExportOptions(prev => ({ ...prev, exportType: exportType as any }));
  };

  const handleAudiencePresetChange = (audiencePreset: string) => {
    const preset = audiencePresets.find(p => p.value === audiencePreset);
    if (preset) {
      setExportOptions(prev => ({
        ...prev,
        audiencePreset: audiencePreset as any,
        redactionSettings: {
          ...prev.redactionSettings,
          hidePII: preset.redactions.includes('hidePII'),
          hideBudgetNumbers: preset.redactions.includes('hideBudgetNumbers'),
          hideInternalNotes: preset.redactions.includes('hideInternalNotes')
        }
      }));
    }
  };

  const handleSectionToggle = (section: string) => {
    setExportOptions(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleRedactionToggle = (setting: keyof ExportOptions['redactionSettings']) => {
    setExportOptions(prev => ({
      ...prev,
      redactionSettings: {
        ...prev.redactionSettings,
        [setting]: !prev.redactionSettings[setting]
      }
    }));
  };

  const handleDeliveryToggle = (option: keyof ExportOptions['deliveryOptions']) => {
    setExportOptions(prev => ({
      ...prev,
      deliveryOptions: {
        ...prev.deliveryOptions,
        [option]: !prev.deliveryOptions[option]
      }
    }));
  };

  const handleCreateExport = () => {
    createExportMutation.mutate(exportOptions);
  };

  const handlePreview = () => {
    previewMutation.mutate(exportOptions);
  };

  const getScopeOptions = () => {
    switch (exportOptions.scope.type) {
      case 'project':
        return projects?.map((project: any) => ({
          value: project.id,
          label: project.title
        })) || [];
      case 'event':
        return events?.map((event: any) => ({
          value: event.id,
          label: event.title
        })) || [];
      case 'script':
        return scripts?.map((script: any) => ({
          value: script.id,
          label: script.title
        })) || [];
      default:
        return [];
    }
  };

  const getSelectedExportType = () => {
    return exportTypes.find(t => t.value === exportOptions.exportType);
  };

  const getSelectedAudiencePreset = () => {
    return audiencePresets.find(p => p.value === exportOptions.audiencePreset);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Choose what to export and how to format it for your audience
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <Tabs value={currentStep.toString()} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="1" onClick={() => setCurrentStep(1)}>
                Format
              </TabsTrigger>
              <TabsTrigger value="2" onClick={() => setCurrentStep(2)}>
                Scope
              </TabsTrigger>
              <TabsTrigger value="3" onClick={() => setCurrentStep(3)}>
                Options
              </TabsTrigger>
              <TabsTrigger value="4" onClick={() => setCurrentStep(4)}>
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Export Format</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose the format that best suits your needs
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {exportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card 
                        key={type.value}
                        className={`cursor-pointer transition-all ${
                          exportOptions.exportType === type.value 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleExportTypeChange(type.value)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6 text-blue-600" />
                            <div>
                              <h3 className="font-medium">{type.label}</h3>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="2" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Export Scope</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  What data would you like to export?
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scope-type">Scope Type</Label>
                    <Select 
                      value={exportOptions.scope.type} 
                      onValueChange={(value) => setExportOptions(prev => ({ 
                        ...prev, 
                        scope: { ...prev.scope, type: value as any, id: undefined, range: undefined }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="script">Script</SelectItem>
                        <SelectItem value="timeframe">Time Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exportOptions.scope.type === 'timeframe' ? (
                    <div>
                      <Label htmlFor="timeframe">Date Range</Label>
                      <Input
                        id="timeframe"
                        type="text"
                        placeholder="e.g., 2024-01-01 to 2024-12-31"
                        value={exportOptions.scope.range || ''}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          scope: { ...prev.scope, range: e.target.value }
                        }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="scope-item">Select {exportOptions.scope.type}</Label>
                      <Select 
                        value={exportOptions.scope.id || ''} 
                        onValueChange={(value) => setExportOptions(prev => ({ 
                          ...prev, 
                          scope: { ...prev.scope, id: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${exportOptions.scope.type}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {getScopeOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="3" className="space-y-4">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Audience Preset</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose who will see this export
                  </p>
                  <div className="space-y-2">
                    {audiencePresets.map((preset) => (
                      <Card 
                        key={preset.value}
                        className={`cursor-pointer transition-all ${
                          exportOptions.audiencePreset === preset.value 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => handleAudiencePresetChange(preset.value)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{preset.label}</h3>
                              <p className="text-sm text-muted-foreground">{preset.description}</p>
                            </div>
                            <div className="flex gap-1">
                              {preset.redactions.map((redaction) => (
                                <Badge key={redaction} variant="secondary" className="text-xs">
                                  {redaction}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Sections to Include</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose which sections to include in your export
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSections.map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox
                          id={section}
                          checked={exportOptions.sections.includes(section)}
                          onCheckedChange={() => handleSectionToggle(section)}
                        />
                        <Label htmlFor={section} className="text-sm">
                          {section}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Privacy & Security</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Additional privacy and security options
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidePII"
                        checked={exportOptions.redactionSettings.hidePII}
                        onCheckedChange={() => handleRedactionToggle('hidePII')}
                      />
                      <Label htmlFor="hidePII" className="text-sm">
                        Hide personal information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideBudgetNumbers"
                        checked={exportOptions.redactionSettings.hideBudgetNumbers}
                        onCheckedChange={() => handleRedactionToggle('hideBudgetNumbers')}
                      />
                      <Label htmlFor="hideBudgetNumbers" className="text-sm">
                        Hide budget numbers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideInternalNotes"
                        checked={exportOptions.redactionSettings.hideInternalNotes}
                        onCheckedChange={() => handleRedactionToggle('hideInternalNotes')}
                      />
                      <Label htmlFor="hideInternalNotes" className="text-sm">
                        Hide internal notes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="watermark"
                        checked={exportOptions.redactionSettings.watermark}
                        onCheckedChange={() => handleRedactionToggle('watermark')}
                      />
                      <Label htmlFor="watermark" className="text-sm">
                        Add watermark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="passcodeProtect"
                        checked={exportOptions.redactionSettings.passcodeProtect}
                        onCheckedChange={() => handleRedactionToggle('passcodeProtect')}
                      />
                      <Label htmlFor="passcodeProtect" className="text-sm">
                        Passcode protect
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Delivery Options</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    How would you like to receive your export?
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="download"
                        checked={exportOptions.deliveryOptions.download}
                        onCheckedChange={() => handleDeliveryToggle('download')}
                      />
                      <Label htmlFor="download" className="text-sm">
                        Download file
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="shareLink"
                        checked={exportOptions.deliveryOptions.shareLink}
                        onCheckedChange={() => handleDeliveryToggle('shareLink')}
                      />
                      <Label htmlFor="shareLink" className="text-sm">
                        Generate share link
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={exportOptions.deliveryOptions.email}
                        onCheckedChange={() => handleDeliveryToggle('email')}
                      />
                      <Label htmlFor="email" className="text-sm">
                        Email to me
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="4" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Export Summary</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review your export settings before generating
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Format</Label>
                        <p className="text-sm">{getSelectedExportType()?.label}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Audience</Label>
                        <p className="text-sm">{getSelectedAudiencePreset()?.label}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Scope</Label>
                        <p className="text-sm capitalize">{exportOptions.scope.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Sections</Label>
                        <p className="text-sm">{exportOptions.sections.length} sections</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Sections Included</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exportOptions.sections.map((section) => (
                          <Badge key={section} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Privacy Settings</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(exportOptions.redactionSettings)
                          .filter(([_, enabled]) => enabled)
                          .map(([setting, _]) => (
                            <Badge key={setting} variant="outline" className="text-xs">
                              {setting}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Delivery</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(exportOptions.deliveryOptions)
                          .filter(([_, enabled]) => enabled)
                          .map(([option, _]) => (
                            <Badge key={option} variant="outline" className="text-xs">
                              {option}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {previewData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Title:</strong> {previewData.title}</p>
                        <p className="text-sm"><strong>Description:</strong> {previewData.description}</p>
                        <p className="text-sm"><strong>Format:</strong> {previewData.format}</p>
                        <p className="text-sm"><strong>Estimated Size:</strong> {previewData.estimatedSize} bytes</p>
                        <p className="text-sm"><strong>Estimated Time:</strong> {previewData.estimatedTime}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePreview} disabled={previewMutation.isPending}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateExport} disabled={createExportMutation.isPending}>
                      <Download className="h-4 w-4 mr-2" />
                      {createExportMutation.isPending ? 'Creating...' : 'Create Export'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
