import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Share2,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Link,
  Cloud,
  Calendar as CalendarIcon,
  File,
  Image,
  Code
} from 'lucide-react';

interface ExportJob {
  id: string;
  exportType: string;
  scope: string;
  audiencePreset: string;
  options: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  downloadUrl?: string;
  shareUrl?: string;
  sharePasscode?: string;
  expiresAt?: string;
  estimatedSize?: number;
  actualSize?: number;
  sections?: string;
  redactions?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface ExportTemplate {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  exportType: string;
  scope: string;
  audiencePreset: string;
  options: string;
  templateData: string;
  isPublic: boolean;
  isSystem: boolean;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function ExportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('export');
  const [selectedScope, setSelectedScope] = useState('project');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedAudience, setSelectedAudience] = useState('owner');
  const [exportOptions, setExportOptions] = useState({
    hidePII: false,
    hideBudget: false,
    hideInternalNotes: false,
    watermark: false,
    passcodeProtect: false,
    expireLink: false,
    removeAvatars: false
  });

  // Fetch recent export jobs
  const { data: recentExports, isLoading: exportsLoading } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: async () => {
      const response = await api.get('/export/jobs');
      return response.data.data || [];
    }
  });

  // Fetch export templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['export-templates'],
    queryFn: async () => {
      const response = await api.get('/export/templates');
      return response.data.data || [];
    }
  });

  // Create export job mutation
  const createExportMutation = useMutation({
    mutationFn: async (data: {
      exportType: string;
      scope: string;
      audiencePreset: string;
      options: string;
    }) => {
      const response = await api.post('/export/generate', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
      toast({
        title: "Export Started",
        description: "Your export has been queued and will be ready shortly",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.response?.data?.error || "Failed to start export",
        variant: "destructive"
      });
    }
  });

  const handleExport = () => {
    const scopeData = {
      type: selectedScope,
      id: 'current-project', // This would be dynamic in a real app
      range: 'all'
    };

    createExportMutation.mutate({
      exportType: selectedFormat,
      scope: JSON.stringify(scopeData),
      audiencePreset: selectedAudience,
      options: JSON.stringify(exportOptions)
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pptx':
        return <FileSpreadsheet className="h-5 w-5 text-orange-600" />;
      case 'csv':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'ics':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'html':
        return <Code className="h-5 w-5 text-blue-600" />;
      case 'json':
        return <Code className="h-5 w-5 text-gray-600" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'PDF Document';
      case 'docx':
        return 'Word Document';
      case 'pptx':
        return 'PowerPoint Presentation';
      case 'csv':
        return 'CSV Spreadsheet';
      case 'xlsx':
        return 'Excel Spreadsheet';
      case 'ics':
        return 'Calendar Feed';
      case 'html':
        return 'HTML Page';
      case 'json':
        return 'JSON Data';
      default:
        return format.toUpperCase();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Download className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Export & Share</h1>
          <p className="text-gray-600">
            Export your projects, events, and scripts in various formats
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6">
          {/* Export Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
              <CardDescription>
                Choose what to export and how to format it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scope Selection */}
              <div className="space-y-2">
                <Label>Export Scope</Label>
                <Select value={selectedScope} onValueChange={setSelectedScope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Entire Project</SelectItem>
                    <SelectItem value="event">Single Event</SelectItem>
                    <SelectItem value="script">Script Version</SelectItem>
                    <SelectItem value="tasks">Selected Tasks</SelectItem>
                    <SelectItem value="timeframe">Time Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['pdf', 'docx', 'pptx', 'csv', 'xlsx', 'ics', 'html', 'json'].map((format) => (
                    <Card
                      key={format}
                      className={`cursor-pointer transition-colors ${
                        selectedFormat === format ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFormat(format)}
                    >
                      <CardContent className="p-4 text-center">
                        {getFormatIcon(format)}
                        <p className="text-sm font-medium mt-2">{getFormatName(format)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Audience Preset */}
              <div className="space-y-2">
                <Label>Audience Preset</Label>
                <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner/Admin (Full Access)</SelectItem>
                    <SelectItem value="team">Team Members</SelectItem>
                    <SelectItem value="vendor">Vendors/Partners</SelectItem>
                    <SelectItem value="attendee">Event Attendees</SelectItem>
                    <SelectItem value="personal">Personal Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy Options */}
              <div className="space-y-4">
                <Label>Privacy & Security Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidePII"
                        checked={exportOptions.hidePII}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, hidePII: !!checked }))
                        }
                      />
                      <Label htmlFor="hidePII">Hide Personal Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideBudget"
                        checked={exportOptions.hideBudget}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, hideBudget: !!checked }))
                        }
                      />
                      <Label htmlFor="hideBudget">Hide Budget Numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideInternalNotes"
                        checked={exportOptions.hideInternalNotes}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, hideInternalNotes: !!checked }))
                        }
                      />
                      <Label htmlFor="hideInternalNotes">Hide Internal Notes</Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="watermark"
                        checked={exportOptions.watermark}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, watermark: !!checked }))
                        }
                      />
                      <Label htmlFor="watermark">Add Watermark</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="passcodeProtect"
                        checked={exportOptions.passcodeProtect}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, passcodeProtect: !!checked }))
                        }
                      />
                      <Label htmlFor="passcodeProtect">Passcode Protection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expireLink"
                        checked={exportOptions.expireLink}
                        onCheckedChange={(checked) =>
                          setExportOptions(prev => ({ ...prev, expireLink: !!checked }))
                        }
                      />
                      <Label htmlFor="expireLink">Expire Share Link</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleExport}
                  disabled={createExportMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createExportMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Export</CardTitle>
              <CardDescription>
                One-click exports for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-red-600" />
                  <span className="font-medium">Run of Show</span>
                  <span className="text-xs text-gray-600">PDF</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="font-medium">Briefing Pack</span>
                  <span className="text-xs text-gray-600">DOCX</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-6 w-6 text-orange-600" />
                  <span className="font-medium">Stakeholder Deck</span>
                  <span className="text-xs text-gray-600">PPTX</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  <span className="font-medium">Calendar Feed</span>
                  <span className="text-xs text-gray-600">ICS</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Templates</CardTitle>
              <CardDescription>
                Save and reuse export configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template: ExportTemplate) => (
                    <Card key={template.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFormatIcon(template.exportType)}
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{getFormatName(template.exportType)}</Badge>
                              <Badge variant="outline">{template.audiencePreset}</Badge>
                              {template.isSystem && (
                                <Badge variant="default">System</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first export template to save time on future exports
                  </p>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View and manage your previous exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </div>
              ) : recentExports && recentExports.length > 0 ? (
                <div className="space-y-4">
                  {recentExports.map((exportJob: ExportJob) => (
                    <Card key={exportJob.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFormatIcon(exportJob.exportType)}
                          <div>
                            <h4 className="font-medium">
                              {getFormatName(exportJob.exportType)} Export
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(exportJob.createdAt).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(exportJob.status)}>
                                {getStatusIcon(exportJob.status)}
                                <span className="ml-1 capitalize">{exportJob.status}</span>
                              </Badge>
                              {exportJob.actualSize && (
                                <span className="text-xs text-gray-500">
                                  {(exportJob.actualSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {exportJob.status === 'completed' && exportJob.downloadUrl && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                          {exportJob.shareUrl && (
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      {exportJob.status === 'processing' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{exportJob.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${exportJob.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {exportJob.errorMessage && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{exportJob.errorMessage}</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Exports Yet</h3>
                  <p className="text-gray-600">
                    Your export history will appear here once you create your first export
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}