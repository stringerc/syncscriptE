import { useEffect, useMemo, useState } from 'react';
import { Mail, RefreshCw, Inbox, Send, Settings2, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';

type ProviderKey = 'all' | 'gmail' | 'outlook';
type FolderKey = 'inbox' | 'sent';

interface EmailMessage {
  id: string;
  provider: 'gmail' | 'outlook';
  threadId?: string;
  folder: FolderKey;
  subject: string;
  from: string;
  to: string[];
  snippet: string;
  date: string;
  webLink?: string;
}

interface EmailMetrics {
  emailCompletedTasks: number;
  sentEventsProcessed: number;
}

export function EmailHubPage() {
  const [provider, setProvider] = useState<ProviderKey>('all');
  const [folder, setFolder] = useState<FolderKey>('inbox');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<EmailMetrics>({ emailCompletedTasks: 0, sentEventsProcessed: 0 });
  const [autoCompleteSentEmails, setAutoCompleteSentEmails] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return `Bearer ${session?.access_token || publicAnonKey}`;
  };

  const fetchSettings = async () => {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${baseUrl}/email/settings`, { headers: { Authorization: authHeader } });
      if (!res.ok) return;
      const data = await res.json();
      setAutoCompleteSentEmails(Boolean(data.autoCompleteSentEmails ?? true));
      setRetentionDays(Number(data.retentionDays ?? 30));
    } catch {
      // non-blocking
    }
  };

  const fetchMetrics = async () => {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${baseUrl}/email/automation/metrics`, { headers: { Authorization: authHeader } });
      if (!res.ok) return;
      const data = await res.json();
      setMetrics({
        emailCompletedTasks: Number(data.emailCompletedTasks || 0),
        sentEventsProcessed: Number(data.sentEventsProcessed || 0),
      });
    } catch {
      // non-blocking
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const params = new URLSearchParams({
        provider,
        folder,
        limit: '50',
      });
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`${baseUrl}/email/messages?${params.toString()}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelectedMessage(null);
      setSelectedDetail(null);
    } catch (error) {
      toast.error(`Could not load email feed: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageDetail = async (msg: EmailMessage) => {
    setSelectedMessage(msg);
    setSelectedDetail(null);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${baseUrl}/email/messages/${msg.provider}/${msg.id}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch message detail');
      }
      const data = await res.json();
      setSelectedDetail(data.message || data);
    } catch (error) {
      toast.error(`Could not load message detail: ${String(error)}`);
    }
  };

  const saveSettings = async (next: { autoCompleteSentEmails?: boolean; retentionDays?: number }) => {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`${baseUrl}/email/settings`, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAutoCompleteSentEmails(Boolean(data.autoCompleteSentEmails ?? true));
      setRetentionDays(Number(data.retentionDays ?? 30));
      toast.success('Email automation settings saved');
    } catch (error) {
      toast.error(`Could not save settings: ${String(error)}`);
    }
  };

  useEffect(() => {
    void fetchSettings();
    void fetchMetrics();
  }, []);

  useEffect(() => {
    void fetchMessages();
  }, [provider, folder]);

  const selectedBody = useMemo(() => {
    if (!selectedDetail) return '';
    if (selectedMessage?.provider === 'outlook') {
      return selectedDetail.body?.content || selectedDetail.bodyPreview || '';
    }
    return selectedDetail.snippet || selectedDetail.payload?.body?.data || '';
  }, [selectedDetail, selectedMessage?.provider]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Mail className="w-6 h-6 text-teal-400" />
              Unified Email Hub
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Gmail + Outlook inbox with sent-email task automation
            </p>
          </div>
          <Button onClick={() => void fetchMessages()} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Email-completed tasks</p>
            <p className="text-2xl font-semibold text-teal-300 mt-1">{metrics.emailCompletedTasks}</p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400">Sent events processed</p>
            <p className="text-2xl font-semibold text-blue-300 mt-1">{metrics.sentEventsProcessed}</p>
          </div>
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400">Auto-complete on send</p>
              <p className="text-sm text-white mt-1">Every sent email becomes a completed task</p>
            </div>
            <Switch
              checked={autoCompleteSentEmails}
              onCheckedChange={(value) => {
                setAutoCompleteSentEmails(value);
                void saveSettings({ autoCompleteSentEmails: value });
              }}
            />
          </div>
        </div>

        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={provider} onValueChange={(v) => setProvider(v as ProviderKey)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="gmail">Gmail</TabsTrigger>
                <TabsTrigger value="outlook">Outlook</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={folder} onValueChange={(v) => setFolder(v as FolderKey)}>
              <TabsList>
                <TabsTrigger value="inbox" className="gap-1.5"><Inbox className="w-3.5 h-3.5" />Inbox</TabsTrigger>
                <TabsTrigger value="sent" className="gap-1.5"><Send className="w-3.5 h-3.5" />Sent</TabsTrigger>
              </TabsList>
            </Tabs>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void fetchMessages()}
              placeholder="Search subject/from/snippet"
              className="ml-auto bg-[#12151b] border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white min-w-[220px]"
            />
            <Button variant="outline" size="sm" onClick={() => void fetchMessages()}>
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[520px]">
            <div className="border border-gray-800 rounded-lg overflow-y-auto max-h-[520px]">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-500 p-6 text-center">No messages found for current filters.</div>
              ) : (
                messages.map((msg) => (
                  <button
                    key={`${msg.provider}-${msg.id}`}
                    onClick={() => void fetchMessageDetail(msg)}
                    className={`w-full text-left p-3 border-b border-gray-800 hover:bg-[#252a33] transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-[#252a33]' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{msg.subject || '(no subject)'}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {folder === 'sent' ? `To: ${msg.to.join(', ')}` : `From: ${msg.from}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">{msg.snippet}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-300">
                          {msg.provider}
                        </Badge>
                        <p className="text-[11px] text-gray-500 mt-1">{new Date(msg.date).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border border-gray-800 rounded-lg bg-[#12151b] p-4 overflow-y-auto max-h-[520px]">
              {!selectedMessage ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Select a message to view details
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-medium">{selectedMessage.subject}</h3>
                    {selectedMessage.webLink && (
                      <a
                        href={selectedMessage.webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-300 hover:text-teal-200"
                      >
                        Open in provider
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><span className="text-gray-500">From:</span> {selectedMessage.from || '-'}</p>
                    <p><span className="text-gray-500">To:</span> {selectedMessage.to.join(', ') || '-'}</p>
                    <p><span className="text-gray-500">Date:</span> {new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1a1d24] border border-gray-800 rounded-md p-3 text-sm text-gray-200 whitespace-pre-wrap">
                    {selectedBody || selectedMessage.snippet || 'No body preview available.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-purple-300" />
              Storage policy
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Metadata-only cache with rolling retention window. Full bodies stay provider-side.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Retention days</label>
            <input
              type="number"
              min={1}
              max={365}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-20 bg-[#12151b] border border-gray-700 rounded-md px-2 py-1 text-sm text-white"
            />
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => void saveSettings({ retentionDays })}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
