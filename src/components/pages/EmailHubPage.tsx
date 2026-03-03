import { useEffect, useMemo, useRef, useState } from 'react';
import { Mail, RefreshCw, Inbox, Send, Settings2, CheckCircle2, Sparkles, ListTodo, Flame, Clock3, BrainCircuit, ArrowUpRight, Wand2, SendHorizontal, Users, PauseCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import { useOpenClaw } from '../../contexts/OpenClawContext';
import { useTasks } from '../../hooks/useTasks';

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

interface EmailPreviewContent {
  text: string;
  html: string;
}

function decodeBase64Url(input?: string): string {
  if (!input) return '';
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return atob(normalized + pad);
  } catch {
    return '';
  }
}

function htmlToText(html: string): string {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return (doc.body?.textContent || '').trim();
  } catch {
    return html;
  }
}

function decodeEntities(text: string): string {
  if (!text) return '';
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  } catch {
    return text;
  }
}

function buildLocalEmailBrief(subject: string, from: string, body: string): string {
  const normalized = body.replace(/\s+/g, ' ').trim();
  const short = normalized.slice(0, 360);
  return [
    `- Subject: ${subject || 'No subject'}`,
    `- Sender: ${from || 'Unknown sender'}`,
    `- Core signal: ${short || 'No readable body content available.'}`,
    '- Suggested next step: confirm owner, due date, and desired outcome.',
  ].join('\n');
}

function scoreEmailPriority(msg: EmailMessage): number {
  const text = `${msg.subject} ${msg.snippet}`.toLowerCase();
  const urgentRegex = /\b(urgent|asap|immediately|today|deadline|overdue|blocked|critical)\b/;
  const actionRegex = /\b(reply|review|approve|confirm|send|submit|schedule|follow up|payment|invoice)\b/;
  const hoursSince = Math.max(0, (Date.now() - new Date(msg.date).getTime()) / (1000 * 60 * 60));
  const recencyScore = Math.max(0, 30 - Math.min(30, hoursSince));
  const urgentScore = urgentRegex.test(text) ? 55 : 0;
  const actionScore = actionRegex.test(text) ? 25 : 0;
  return recencyScore + urgentScore + actionScore;
}

function classifyPriority(score: number): 'critical' | 'high' | 'normal' {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  return 'normal';
}

function extractActionSignals(text: string): string[] {
  if (!text.trim()) return [];
  const chunks = text
    .split(/[\n.!?]+/g)
    .map((c) => c.trim())
    .filter(Boolean);
  const actionRegex = /\b(reply|respond|review|approve|confirm|send|submit|schedule|follow up|pay|payment|invoice|share|update)\b/i;
  return chunks.filter((c) => actionRegex.test(c)).slice(0, 5);
}

function extractPrimaryEmailAddress(value: string): string {
  if (!value) return '';
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch?.[1]) return angleMatch[1].trim();
  const bare = value.trim();
  return /\S+@\S+\.\S+/.test(bare) ? bare : '';
}

function ensureReplySubject(subject: string): string {
  const s = (subject || '').trim();
  if (!s) return 'Re: (no subject)';
  return /^re:/i.test(s) ? s : `Re: ${s}`;
}

function estimateBestSendTime(priority: 'critical' | 'high' | 'normal') {
  const now = new Date();
  const out = new Date(now);
  if (priority === 'critical') {
    out.setMinutes(out.getMinutes() + 2);
    return out;
  }

  // Heuristic: for non-critical replies, target next business-focused slot.
  const hour = now.getHours();
  if (hour < 9) {
    out.setHours(9, 0, 0, 0);
  } else if (hour >= 17) {
    out.setDate(out.getDate() + 1);
    out.setHours(9, 0, 0, 0);
  } else {
    out.setMinutes(Math.ceil((now.getMinutes() + 1) / 15) * 15, 0, 0);
  }
  return out;
}

function collectGmailParts(payload: any, mimeType: string, acc: string[] = []): string[] {
  if (!payload) return acc;
  if (payload.mimeType === mimeType && payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (decoded) acc.push(decoded);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      collectGmailParts(part, mimeType, acc);
    }
  }
  return acc;
}

function buildEmailIframeDoc(html: string, zoomPercent: number): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #111827;
        background: #ffffff;
        line-height: 1.45;
        zoom: ${Math.max(0.75, Math.min(2, zoomPercent / 100))};
      }
      a { color: #5eead4; text-decoration: underline; }
      img { max-width: 100%; height: auto; display: block; }
      table { max-width: 100% !important; width: 100% !important; }
      td, th, div { max-width: 100% !important; }
      body > table, #bodyTable, #backgroundTable, .container { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
      pre { white-space: pre-wrap; word-break: break-word; }
      blockquote { border-left: 3px solid #374151; margin-left: 0; padding-left: 10px; color: #9ca3af; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

export function EmailHubPage() {
  const navigate = useNavigate();
  const { sendMessage, getTaskSuggestions, isInitialized: openClawReady } = useOpenClaw();
  const { createTask } = useTasks();
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
  const [providerErrors, setProviderErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'rich' | 'text'>('rich');
  const [previewZoom, setPreviewZoom] = useState(110);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState(900);
  const [nexusSummary, setNexusSummary] = useState('');
  const [nexusSuggestions, setNexusSuggestions] = useState<any[]>([]);
  const [nexusLoading, setNexusLoading] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [bestSendAt, setBestSendAt] = useState<string>('');
  const [triageState, setTriageState] = useState<'none' | 'do' | 'delegate' | 'defer'>('none');

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
      setProviderErrors(typeof data.providerErrors === 'object' && data.providerErrors ? data.providerErrors : {});
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
    setPreviewMode('rich');
    setPreviewZoom(110);
    setIframeHeight(900);
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

  const runNexusAnalysis = async () => {
    if (!selectedMessage) return;
    const body = selectedBody.text || selectedMessage.snippet || '';
    if (!body.trim()) {
      toast.info('No message content available to analyze yet');
      return;
    }

    setNexusLoading(true);
    try {
      const context = {
        source: 'email-hub',
        provider: selectedMessage.provider,
        folder: selectedMessage.folder,
        subject: selectedMessage.subject,
        from: selectedMessage.from,
        to: selectedMessage.to,
        bodyPreview: body.slice(0, 6000),
      };

      let summaryText = buildLocalEmailBrief(selectedMessage.subject, selectedMessage.from, body);
      if (openClawReady) {
        const summary = await sendMessage({
          message: `Summarize this email in concise bullets and include action items:\nSubject: ${selectedMessage.subject}\nFrom: ${selectedMessage.from}\nTo: ${selectedMessage.to.join(', ')}\nBody:\n${body.slice(0, 6000)}`,
          context: {
            currentPage: 'email-hub',
            recentActions: ['email-analysis'],
            userPreferences: { style: 'concise-actionable' },
          },
        });
        summaryText = summary?.message?.content || summaryText;
      }

      const aiSuggestions = await getTaskSuggestions(context);
      setNexusSummary(summaryText || 'No summary returned. Use "Open in provider" for full thread details.');
      setNexusSuggestions(Array.isArray(aiSuggestions) ? aiSuggestions.slice(0, 4) : []);
    } catch (error) {
      console.error('[EmailHub][Nexus] analysis failed:', error);
      toast.error('Nexus analysis failed for this email');
    } finally {
      setNexusLoading(false);
    }
  };

  const createTaskFromSuggestion = async (suggestion: any) => {
    try {
      const taskInput = {
        title: suggestion.title || 'Follow up from email',
        description: suggestion.description || `Created from email: ${selectedMessage?.subject || ''}`,
        priority: (suggestion.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
        energyLevel: ((suggestion.energyRequired || 'medium') as 'low' | 'medium' | 'high'),
        estimatedTime: suggestion.estimatedTime || '30 min',
        tags: Array.isArray(suggestion.tags) ? suggestion.tags : ['email'],
        dueDate: suggestion.suggestedTime || new Date().toISOString(),
      };
      await createTask(taskInput as any);
      toast.success('Task created from Nexus suggestion');
    } catch (error) {
      console.error('[EmailHub][Nexus] create task failed:', error);
      toast.error('Could not create task from suggestion');
    }
  };

  const generateReplyDraft = async () => {
    if (!selectedMessage) return;
    const sourceBody = selectedBody.text || selectedMessage.snippet || '';
    const fallback = [
      `Hi,`,
      '',
      `Thanks for the update on "${selectedMessage.subject || 'your message'}".`,
      'I reviewed this and will follow up with the next step shortly.',
      '',
      'Best,',
      'Sent from SyncScript',
    ].join('\n');

    try {
      if (!openClawReady) {
        setReplyBody(fallback);
        toast.info('Using smart local draft (OpenClaw unavailable)');
        return;
      }

      const draft = await sendMessage({
        message: `Draft a concise professional email reply.\nOriginal subject: ${selectedMessage.subject}\nSender: ${selectedMessage.from}\nOriginal body/snippet:\n${sourceBody.slice(0, 5000)}\n\nReply tone: confident, friendly, clear. Include explicit next step.`,
        context: {
          currentPage: 'email-hub',
          recentActions: ['reply-draft'],
          userPreferences: { responseStyle: 'concise-professional' },
        },
      });
      const generated = draft?.message?.content?.trim();
      setReplyBody(generated || fallback);
      toast.success('AI draft generated');
    } catch (error) {
      console.error('[EmailHub][Reply] draft generation failed:', error);
      setReplyBody(fallback);
      toast.error('Draft generation failed, using fallback draft');
    }
  };

  const optimizeReplySendTime = async () => {
    const priority = classifyPriority(scoreEmailPriority(selectedMessage as EmailMessage));
    const local = estimateBestSendTime(priority);
    let recommendation = local;

    try {
      if (openClawReady && selectedMessage) {
        const ai = await sendMessage({
          message: `Given this email context, suggest the best send timestamp (ISO) and reasoning.\nSubject: ${selectedMessage.subject}\nPriority: ${priority}\nCurrent local time: ${new Date().toISOString()}\n`,
          context: {
            currentPage: 'email-hub',
            recentActions: ['send-time-optimization'],
          },
        });
        const content = ai?.message?.content || '';
        const isoMatch = content.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/);
        if (isoMatch?.[0]) {
          const parsed = new Date(isoMatch[0]);
          if (!Number.isNaN(parsed.getTime())) recommendation = parsed;
        }
      }
    } catch {
      // keep local recommendation
    }

    setBestSendAt(recommendation.toISOString());
    toast.success(`Best send time: ${recommendation.toLocaleString()}`);
  };

  const sendReplyInSyncScript = async () => {
    if (!selectedMessage) return;
    if (!replyTo.trim()) {
      toast.error('Reply recipient is required');
      return;
    }
    if (!replyBody.trim()) {
      toast.error('Reply body is required');
      return;
    }

    setReplySending(true);
    try {
      const authHeader = await getAuthHeader();
      const headers = selectedDetail?.payload?.headers || [];
      const gmailMessageIdHeader = headers.find((h: any) => String(h?.name || '').toLowerCase() === 'message-id')?.value || '';
      const outlookMessageIdHeader = selectedDetail?.internetMessageId || '';
      const inReplyTo = gmailMessageIdHeader || outlookMessageIdHeader || '';
      const references = inReplyTo;

      const res = await fetch(`${baseUrl}/email/reply`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedMessage.provider,
          messageId: selectedMessage.id,
          threadId: selectedMessage.threadId || '',
          to: replyTo.trim(),
          subject: ensureReplySubject(replySubject || selectedMessage.subject || ''),
          bodyText: replyBody,
          inReplyTo,
          references,
          sendAt: bestSendAt || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to send reply');
      }

      await fetch(`${baseUrl}/email/events/sent`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedMessage.provider,
          messageId: `reply_${selectedMessage.provider}_${selectedMessage.id}_${Date.now()}`,
          subject: ensureReplySubject(replySubject || selectedMessage.subject || ''),
          to: [replyTo.trim()],
          snippet: replyBody.slice(0, 180),
          occurredAt: new Date().toISOString(),
          webLink: selectedMessage.webLink || undefined,
        }),
      });

      toast.success('Reply sent inside SyncScript');
      setReplyOpen(false);
      setReplyBody('');
      setBestSendAt('');
      void fetchMetrics();
      if (folder === 'sent') void fetchMessages();
    } catch (error) {
      console.error('[EmailHub][Reply] send failed:', error);
      toast.error(`Could not send reply: ${String(error)}`);
    } finally {
      setReplySending(false);
    }
  };

  const applyTriageAction = async (action: 'do' | 'delegate' | 'defer') => {
    if (!selectedMessage) return;
    try {
      const now = new Date();
      const due = new Date(now);
      if (action === 'do') due.setHours(now.getHours() + 1);
      if (action === 'delegate') due.setDate(now.getDate() + 1);
      if (action === 'defer') due.setDate(now.getDate() + 2);

      const titlePrefix = action === 'do' ? 'Do now' : action === 'delegate' ? 'Delegate' : 'Defer';
      await createTask({
        title: `${titlePrefix}: ${selectedMessage.subject || 'Email follow-up'}`,
        description: `Email action from ${selectedMessage.provider}.\nFrom: ${selectedMessage.from}\nSnippet: ${selectedMessage.snippet}`,
        priority: action === 'do' ? 'high' : 'medium',
        energyLevel: action === 'do' ? 'high' : 'medium',
        estimatedTime: action === 'do' ? '20 min' : '10 min',
        tags: ['email', `triage:${action}`, `provider:${selectedMessage.provider}`],
        dueDate: due.toISOString(),
      } as any);
      setTriageState(action);
      toast.success(`Triage applied: ${action.toUpperCase()}`);
    } catch (error) {
      console.error('[EmailHub][Triage] failed:', error);
      toast.error('Could not apply triage action');
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

  const selectedBody = useMemo<EmailPreviewContent>(() => {
    if (!selectedDetail) return { text: '', html: '' };
    if (selectedMessage?.provider === 'outlook') {
      const raw = selectedDetail.body?.content || selectedDetail.bodyPreview || '';
      const isLikelyHtml = /<[^>]+>/.test(raw);
      return {
        text: decodeEntities(htmlToText(raw)),
        html: isLikelyHtml ? raw : '',
      };
    }

    if (selectedDetail.resolved?.plain || selectedDetail.resolved?.html) {
      return {
        text: decodeEntities(selectedDetail.resolved.plain || htmlToText(selectedDetail.resolved.html || '')),
        html: selectedDetail.resolved.html || '',
      };
    }

    const plainCandidates = collectGmailParts(selectedDetail.payload, 'text/plain');
    const htmlCandidates = collectGmailParts(selectedDetail.payload, 'text/html');
    const plain = plainCandidates.sort((a, b) => b.length - a.length)[0] || '';
    const html = htmlCandidates.sort((a, b) => b.length - a.length)[0] || '';
    const bodyData = selectedDetail.payload?.body?.data ? decodeBase64Url(selectedDetail.payload.body.data) : '';

    if (plain || html) {
      return {
        text: decodeEntities(plain || htmlToText(html)),
        html: html || '',
      };
    }

    if (bodyData) {
      return {
        text: decodeEntities(htmlToText(bodyData)),
        html: /<[^>]+>/.test(bodyData) ? bodyData : '',
      };
    }

    return { text: decodeEntities(selectedDetail.snippet || ''), html: '' };
  }, [selectedDetail, selectedMessage?.provider]);

  const prioritizedMessages = useMemo(() => {
    return [...messages]
      .map((msg) => ({ msg, score: scoreEmailPriority(msg) }))
      .sort((a, b) => b.score - a.score || new Date(b.msg.date).getTime() - new Date(a.msg.date).getTime());
  }, [messages]);

  const selectedActionSignals = useMemo(() => {
    const source = selectedBody.text || selectedMessage?.snippet || '';
    return extractActionSignals(source);
  }, [selectedBody.text, selectedMessage?.snippet]);

  useEffect(() => {
    setNexusSummary('');
    setNexusSuggestions([]);
  }, [selectedMessage?.id]);

  useEffect(() => {
    if (!selectedMessage) return;
    setReplyTo(extractPrimaryEmailAddress(selectedMessage.from));
    setReplySubject(ensureReplySubject(selectedMessage.subject || ''));
    setReplyBody('');
    setReplyOpen(false);
    setBestSendAt('');
    setTriageState('none');
  }, [selectedMessage?.id]);

  const resizeIframeToContent = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const bodyHeight = doc?.body?.scrollHeight || 0;
      const htmlHeight = doc?.documentElement?.scrollHeight || 0;
      const next = Math.max(700, bodyHeight, htmlHeight) + 20;
      setIframeHeight(next);
    } catch {
      // If access is blocked by browser sandbox behavior, keep fallback height.
      setIframeHeight((prev) => Math.max(prev, 900));
    }
  };

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

          <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)_300px] gap-4 min-h-[640px]">
            <div className="border border-gray-800 rounded-lg overflow-y-auto max-h-[520px]">
              {prioritizedMessages.length === 0 ? (
                <div className="text-sm text-gray-500 p-6 text-center space-y-3">
                  <p>No messages found for current filters.</p>
                  {(providerErrors.gmail || providerErrors.outlook) && (
                    <div className="text-left bg-[#1a1d24] border border-gray-800 rounded-md p-3 space-y-2 text-xs">
                      <p className="text-gray-300">Provider status:</p>
                      {providerErrors.gmail && (
                        <p className="text-yellow-300">Gmail: connect Gmail Mail in Integrations (mail scopes required).</p>
                      )}
                      {providerErrors.outlook && (
                        <p className="text-yellow-300">Outlook: connect Outlook Mail in Integrations.</p>
                      )}
                      <div>
                        <Button size="sm" variant="outline" onClick={() => navigate('/integrations')}>
                          Open Integrations
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                prioritizedMessages.map(({ msg, score }) => (
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
                        <div className="flex items-center justify-end gap-1.5">
                          <Badge variant="outline" className="text-[10px] border-gray-700 text-gray-300">
                            {msg.provider}
                          </Badge>
                          {classifyPriority(score) !== 'normal' && (
                            <Badge variant="outline" className={`text-[10px] ${classifyPriority(score) === 'critical' ? 'border-rose-500/50 text-rose-300' : 'border-amber-500/50 text-amber-300'}`}>
                              {classifyPriority(score)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">{new Date(msg.date).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="border border-gray-800 rounded-lg bg-[#12151b] p-4 overflow-y-auto min-h-[640px]">
              {!selectedMessage ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Select a message to view details
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-medium">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-3">
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
                      <button
                        onClick={() => setReplyOpen((prev) => !prev)}
                        className="text-xs text-blue-300 hover:text-blue-200"
                      >
                        {replyOpen ? 'Close reply' : 'Reply in SyncScript'}
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><span className="text-gray-500">From:</span> {selectedMessage.from || '-'}</p>
                    <p><span className="text-gray-500">To:</span> {selectedMessage.to.join(', ') || '-'}</p>
                    <p><span className="text-gray-500">Date:</span> {new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1a1d24] border border-gray-800 rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        Nexus Brief (OpenClaw)
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void runNexusAnalysis()}
                        disabled={nexusLoading}
                        className="h-7 text-xs"
                      >
                        {nexusLoading ? 'Analyzing...' : 'Analyze Email'}
                      </Button>
                    </div>
                    {nexusSummary ? (
                      <p className="text-xs text-gray-200 whitespace-pre-wrap">{nexusSummary}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Generate an AI summary and task extraction for this email.</p>
                    )}
                    {nexusSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-300 flex items-center gap-1.5">
                          <ListTodo className="w-3.5 h-3.5 text-teal-300" />
                          Suggested tasks
                        </p>
                        {nexusSuggestions.map((s, idx) => (
                          <div key={`${s.id || s.title || 'suggestion'}-${idx}`} className="flex items-center justify-between gap-2 bg-[#12151b] border border-gray-800 rounded px-2 py-1.5">
                            <p className="text-xs text-gray-200 truncate">{s.title || 'Suggested action'}</p>
                            <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => void createTaskFromSuggestion(s)}>
                              Add Task
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {replyOpen && (
                    <div className="bg-[#1a1d24] border border-teal-800/40 rounded-md p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-teal-300">Compose reply in SyncScript</p>
                        {bestSendAt && (
                          <p className="text-[11px] text-gray-400">
                            Suggested send: {new Date(bestSendAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          value={replyTo}
                          onChange={(e) => setReplyTo(e.target.value)}
                          placeholder="Recipient email"
                          className="bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-xs text-white"
                        />
                        <input
                          value={replySubject}
                          onChange={(e) => setReplySubject(e.target.value)}
                          placeholder="Subject"
                          className="bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        rows={8}
                        placeholder="Write your reply..."
                        className="w-full bg-[#12151b] border border-gray-700 rounded-md px-3 py-2 text-sm text-white"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void generateReplyDraft()}>
                          <Wand2 className="w-3.5 h-3.5" />
                          AI Draft
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void optimizeReplySendTime()}>
                          <Clock3 className="w-3.5 h-3.5" />
                          Optimize Send Time
                        </Button>
                        <Button size="sm" className="gap-1.5 ml-auto" onClick={() => void sendReplyInSyncScript()} disabled={replySending}>
                          <SendHorizontal className="w-3.5 h-3.5" />
                          {replySending ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  )}
                  {selectedBody.html && (
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setPreviewMode('rich')}
                        className={`px-2 py-1 rounded border ${previewMode === 'rich' ? 'border-teal-500/50 text-teal-300 bg-teal-500/10' : 'border-gray-700 text-gray-400'}`}
                      >
                        Rich Preview
                      </button>
                      <button
                        onClick={() => setPreviewMode('text')}
                        className={`px-2 py-1 rounded border ${previewMode === 'text' ? 'border-teal-500/50 text-teal-300 bg-teal-500/10' : 'border-gray-700 text-gray-400'}`}
                      >
                        Plain Text
                      </button>
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          onClick={() => setPreviewZoom((z) => Math.max(80, z - 10))}
                          className="px-2 py-1 rounded border border-gray-700 text-gray-300"
                        >
                          -
                        </button>
                        <span className="text-gray-400 min-w-[44px] text-center">{previewZoom}%</span>
                        <button
                          onClick={() => setPreviewZoom((z) => Math.min(170, z + 10))}
                          className="px-2 py-1 rounded border border-gray-700 text-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedBody.html && previewMode === 'rich' ? (
                    <iframe
                      ref={iframeRef}
                      onLoad={resizeIframeToContent}
                      key={`${selectedMessage?.id || 'email'}-${previewZoom}`}
                      title="Email rich preview"
                      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                      srcDoc={buildEmailIframeDoc(selectedBody.html, previewZoom)}
                      style={{ height: `${iframeHeight}px` }}
                      className="w-full min-h-[700px] bg-[#ffffff] border border-gray-800 rounded-md"
                    />
                  ) : (
                    <div className="bg-[#1a1d24] border border-gray-800 rounded-md p-3 text-sm text-gray-200 whitespace-pre-wrap">
                      {selectedBody.text || selectedMessage.snippet || 'No body preview available.'}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="border border-gray-800 rounded-lg bg-[#12151b] p-4 min-h-[640px] space-y-4">
              <div>
                <p className="text-sm text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-purple-300" />
                  Action Cockpit
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Decision layer for what to do next, powered by OpenClaw + urgency heuristics.
                </p>
              </div>

              {!selectedMessage ? (
                <div className="text-xs text-gray-500 bg-[#1a1d24] border border-gray-800 rounded-md p-3">
                  Select an email to unlock triage, action extraction, and one-click tasking.
                </div>
              ) : (
                <>
                  <div className="bg-[#1a1d24] border border-gray-800 rounded-md p-3 space-y-2">
                    <p className="text-xs text-gray-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-300" />
                      Priority signal
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${classifyPriority(scoreEmailPriority(selectedMessage)) === 'critical' ? 'border-rose-500/50 text-rose-300' : classifyPriority(scoreEmailPriority(selectedMessage)) === 'high' ? 'border-amber-500/50 text-amber-300' : 'border-gray-700 text-gray-300'}`}>
                        {classifyPriority(scoreEmailPriority(selectedMessage)).toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-gray-400">Score {Math.round(scoreEmailPriority(selectedMessage))}</span>
                    </div>
                  </div>

                  <div className="bg-[#1a1d24] border border-gray-800 rounded-md p-3 space-y-2">
                    <p className="text-xs text-gray-300 flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5 text-teal-300" />
                      Actionable lines
                    </p>
                    {selectedActionSignals.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedActionSignals.map((line, idx) => (
                          <p key={`${line}-${idx}`} className="text-xs text-gray-200">
                            - {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No clear action language detected yet.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant={triageState === 'do' ? 'default' : 'outline'}
                        className="gap-1.5"
                        onClick={() => void applyTriageAction('do')}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Do
                      </Button>
                      <Button
                        size="sm"
                        variant={triageState === 'delegate' ? 'default' : 'outline'}
                        className="gap-1.5"
                        onClick={() => void applyTriageAction('delegate')}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Delegate
                      </Button>
                      <Button
                        size="sm"
                        variant={triageState === 'defer' ? 'default' : 'outline'}
                        className="gap-1.5"
                        onClick={() => void applyTriageAction('defer')}
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        Defer
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={() => void runNexusAnalysis()}
                      disabled={nexusLoading}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {nexusLoading ? 'Analyzing with Nexus...' : 'Run Nexus Analysis'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      disabled={!selectedMessage?.webLink}
                      onClick={() => {
                        if (selectedMessage?.webLink) {
                          window.open(selectedMessage.webLink, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Open in Provider
                    </Button>
                  </div>
                </>
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
