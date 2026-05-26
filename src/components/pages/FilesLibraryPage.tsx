import { useEffect, useState, useCallback } from 'react';
import { FolderOpen, FileText, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardLayout } from '../layout/DashboardLayout';
import { useUserFiles, type UserFileRow } from '../../hooks/useUserFiles';
import { toast } from 'sonner';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function FilesLibraryPage() {
  const { listFiles, getSignedUrl, deleteFile, loading } = useUserFiles();
  const [files, setFiles] = useState<UserFileRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 30;

  const load = useCallback(async () => {
    const res = await listFiles(offset, limit);
    if (!res.ok) {
      toast.error('Could not load files');
      return;
    }
    setFiles(res.files);
    setTotal(res.total);
  }, [listFiles, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  const openFile = async (id: string) => {
    const url = await getSignedUrl(id);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast.error('Could not open file');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file? Links from tasks and events will be removed.')) return;
    const ok = await deleteFile(id);
    if (ok) {
      toast.success('File removed');
      void load();
    } else toast.error('Delete failed');
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-[#0a0f14] text-[#e6edf4] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-teal-400/90 text-sm font-medium">
              <FolderOpen className="h-5 w-5" />
              Library
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">Your files</h1>
            <p className="mt-2 text-[#9fb2c8] max-w-xl">
              Everything you upload lives here. The same file can be linked to tasks, calendar events, and invoices
              without duplicating storage.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/15 text-[#e6edf4] hover:bg-white/5"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {files.length === 0 && !loading ? (
            <div className="p-12 text-center text-[#9fb2c8]">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No files yet. Attach documents from a task or event, or upload from workflows that support files.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {files.map((f) => (
                <li key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{f.original_filename || f.id}</p>
                    <p className="text-xs text-[#9fb2c8]">
                      {formatBytes(f.size_bytes)}
                      {f.mime_type ? ` · ${f.mime_type}` : ''}
                      {f.created_at ? ` · ${new Date(f.created_at).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-teal-400 hover:text-teal-300"
                      onClick={() => void openFile(f.id)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => void handleDelete(f.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {total > limit && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={offset === 0}
              className="border-white/15"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={offset + limit >= total}
              className="border-white/15"
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
