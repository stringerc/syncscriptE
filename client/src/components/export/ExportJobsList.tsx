import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Share2, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  FileSpreadsheet,
  Calendar,
  Eye,
  RefreshCw
} from 'lucide-react';

interface ExportJob {
  id: string;
  exportType: string;
  scope: string;
  audiencePreset: string;
  status: string;
  progress: number;
  errorMessage?: string;
  downloadUrl?: string;
  shareUrl?: string;
  sharePasscode?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
}

const exportTypeIcons = {
  pdf: FileText,
  docx: FileText,
  pptx: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ics: Calendar,
  html: Eye,
  json: FileText
};

const statusColors = {
  queued: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
};

const statusIcons = {
  queued: Clock,
  processing: RefreshCw,
  completed: CheckCircle,
  failed: AlertCircle
};

export function ExportJobsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch export jobs
  const { data: exportJobs, isLoading } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: async () => {
      const response = await api.get('/export/jobs');
      return response.data.data.exportJobs || [];
    }
  });

  // Delete export job mutation
  const deleteExportMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.delete(`/export/job/${jobId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Export Deleted",
        description: "Export job has been deleted successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Failed to delete export job",
        variant: "destructive"
      });
    }
  });

  // Revoke share link mutation
  const revokeShareMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.delete(`/export/share/${jobId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Share Link Revoked",
        description: "Share link has been revoked successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Revoke Failed",
        description: error.response?.data?.error || "Failed to revoke share link",
        variant: "destructive"
      });
    }
  });

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      window.open(job.downloadUrl, '_blank');
    }
  };

  const handleShare = (job: ExportJob) => {
    if (job.shareUrl) {
      const shareUrl = job.sharePasscode 
        ? `${job.shareUrl}?passcode=${job.sharePasscode}`
        : job.shareUrl;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Share Link Copied",
          description: "Share link has been copied to clipboard",
          variant: "default"
        });
      });
    }
  };

  const handleDelete = (jobId: string) => {
    if (confirm('Are you sure you want to delete this export job?')) {
      deleteExportMutation.mutate(jobId);
    }
  };

  const handleRevokeShare = (jobId: string) => {
    if (confirm('Are you sure you want to revoke the share link?')) {
      revokeShareMutation.mutate(jobId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScopeDisplay = (scope: string) => {
    try {
      const parsed = JSON.parse(scope);
      return `${parsed.type}${parsed.id ? ` (${parsed.id})` : ''}${parsed.range ? ` - ${parsed.range}` : ''}`;
    } catch {
      return scope;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!exportJobs || exportJobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Export Jobs</h3>
          <p className="text-gray-500">
            You haven't created any exports yet. Create your first export to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Export Jobs</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['export-jobs'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {exportJobs.map((job: ExportJob) => {
          const ExportIcon = exportTypeIcons[job.exportType as keyof typeof exportTypeIcons] || FileText;
          const StatusIcon = statusIcons[job.status as keyof typeof statusIcons] || Clock;
          const statusColor = statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';

          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ExportIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {job.exportType.toUpperCase()} Export
                        </h3>
                        <Badge className={statusColor}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Scope: {getScopeDisplay(job.scope)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Audience: {job.audiencePreset}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(job.createdAt)}
                      </p>
                      {job.completedAt && (
                        <p className="text-sm text-gray-500">
                          Completed: {formatDate(job.completedAt)}
                        </p>
                      )}
                      {job.expiresAt && (
                        <p className="text-sm text-gray-500">
                          Expires: {formatDate(job.expiresAt)}
                        </p>
                      )}
                      {job.errorMessage && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {job.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {job.status === 'processing' && (
                      <div className="w-24">
                        <Progress value={job.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {job.progress}%
                        </p>
                      </div>
                    )}
                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        {job.downloadUrl && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(job)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                        {job.shareUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShare(job)}
                            className="flex items-center gap-1"
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
