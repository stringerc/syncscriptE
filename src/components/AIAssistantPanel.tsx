/**
 * AI Assistant Panel - State-of-the-art Context-Aware AI Interface
 * 
 * Research-based on:
 * - Notion AI's contextual sidebar patterns
 * - Microsoft Copilot's split-view interaction model
 * - Intercom/Drift's conversational dashboard interfaces
 * - Google Assistant's ambient computing principles
 * - Progressive disclosure best practices (Nielsen Norman Group)
 * 
 * Features:
 * ✅ Fully context-aware - Adapts to current page
 * ✅ Page-specific quick actions
 * ✅ Chat conversation interface
 * ✅ Smart suggestions and insights
 * ✅ Persistent conversation history
 * ✅ Progressive disclosure UI
 * ✅ Real-time user data integration
 */

import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Brain, Send, Sparkles, Settings, RefreshCw, MessageSquare,
  UserPlus, Mail, Check, X, Ban, UserX
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useLocation } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { useAI } from '../contexts/AIContext';
import { useAuth } from '../contexts/AuthContext';
import { useOpenClaw } from '../contexts/OpenClawContext';
import { getPageContext, generateWelcomeMessage, hasContextualInsights } from '../utils/ai-context-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAIInsightsRouting } from '../contexts/AIInsightsRoutingContext';
import { buildAgentDeepLink, buildRoutePrefix, normalizeRouteContext, routeContextFromUrl } from '../utils/ai-route';
import { useContinuity } from '../contexts/ContinuityContext';
import { showLocalAgentNotification } from '../pwa/push';
import { routeAgentRequest, buildAgentRoutedPrompt } from '../utils/agent-router';
import { buildChatThreadEnvelope } from '../utils/ai-thread-model';
import { buildResponseContractCards, sanitizeAssistantContent } from '../utils/ai-response-contract';
import { shouldShowPromptWithCadence, markPromptShown } from '../utils/prompt-cadence';
import { NEXUS_TAB_AGENTS } from '../utils/nexus-tab-agents';
import { ENTERPRISE_CORE_AGENTS } from '../utils/enterprise-agents-catalog';
import {
  inviteByEmail,
  listMessages,
  listRelationships,
  relationshipAction,
  sendMessage,
  subscribeToSocialMessages,
  type SocialChatMessage,
  type SocialRelationshipRecord,
  type SocialType,
} from '../utils/social-chat';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onOpenAIInsights?: () => void; // Callback to open/focus the Chat panel
  quickTalkStarter?: string | null;
  onQuickTalkConsumed?: () => void;
}

export function AIAssistantPanel({
  isOpen,
  onOpenAIInsights,
  quickTalkStarter,
  onQuickTalkConsumed,
}: AIAssistantPanelProps) {
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [hubTab, setHubTab] = useState<'social' | 'nexus' | 'enterprise'>('nexus');
  const [socialTab, setSocialTab] = useState<'friends' | 'teammates' | 'collaboratives'>('friends');
  const [selectedNexusAgentId, setSelectedNexusAgentId] = useState<string | null>(null);
  const [selectedEnterpriseAgentId, setSelectedEnterpriseAgentId] = useState<string | null>(null);
  const [enterpriseWorkspaceId, setEnterpriseWorkspaceId] = useState<string>('default');
  const [enterpriseWorkspaces, setEnterpriseWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [workspaceEnterpriseAgents, setWorkspaceEnterpriseAgents] = useState<Array<{ id: string; name: string; role: string; team: string }>>([]);
  const [enterpriseScope, setEnterpriseScope] = useState<'core' | 'workspace'>('core');
  const [enterpriseSearch, setEnterpriseSearch] = useState('');
  const [enterpriseLoading, setEnterpriseLoading] = useState(false);
  const [showSocialInviteDialog, setShowSocialInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [socialRelationships, setSocialRelationships] = useState<SocialRelationshipRecord[]>([]);
  const [selectedSocialPartnerId, setSelectedSocialPartnerId] = useState<string | null>(null);
  const [socialMessages, setSocialMessages] = useState<SocialChatMessage[]>([]);
  const [socialMessageInput, setSocialMessageInput] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialSending, setSocialSending] = useState(false);
  const { routeContext } = useAIInsightsRouting();
  const { queueAgentAction } = useContinuity();
  const { user, accessToken } = useAuth();
  const { getEnterpriseWorkspaces, getEnterpriseOrg } = useOpenClaw();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    currentPage,
    processCommand,
    getContextualSuggestions,
    energyData,
  } = useAI();
  const actorId = String(user?.id || 'guest-user');

  const socialTypeByTab: Record<typeof socialTab, SocialType> = {
    friends: 'friend',
    teammates: 'teammate',
    collaboratives: 'collaborative',
  };

  const activeSocialType = socialTypeByTab[socialTab];
  const tabAgentName = hubTab === 'social'
    ? 'Social Concierge'
    : hubTab === 'enterprise'
      ? 'Enterprise Command'
      : 'Nexus Orchestrator';

  const isAuthenticatedSocial = Boolean(accessToken && !accessToken.startsWith('gst_') && !user?.isGuest);
  const selectedNexusAgent = useMemo(
    () => NEXUS_TAB_AGENTS.find((agent) => agent.id === selectedNexusAgentId) || null,
    [selectedNexusAgentId],
  );
  const selectedWorkspaceLabel = useMemo(
    () => enterpriseWorkspaces.find((item) => item.id === enterpriseWorkspaceId)?.name || 'Enterprise',
    [enterpriseWorkspaces, enterpriseWorkspaceId],
  );
  const enterpriseRoster = useMemo(() => {
    const source = enterpriseScope === 'workspace' && workspaceEnterpriseAgents.length > 0
      ? workspaceEnterpriseAgents
      : ENTERPRISE_CORE_AGENTS;
    const q = enterpriseSearch.trim().toLowerCase();
    if (!q) return source;
    return source.filter((agent) =>
      String(agent.name).toLowerCase().includes(q)
      || String(agent.role).toLowerCase().includes(q)
      || String(agent.team).toLowerCase().includes(q)
      || String(agent.id).toLowerCase().includes(q),
    );
  }, [enterpriseScope, workspaceEnterpriseAgents, enterpriseSearch]);
  const selectedEnterpriseAgent = useMemo(
    () => enterpriseRoster.find((agent) => agent.id === selectedEnterpriseAgentId)
      || (selectedEnterpriseAgentId ? ENTERPRISE_CORE_AGENTS.find((agent) => agent.id === selectedEnterpriseAgentId) || null : null),
    [enterpriseRoster, selectedEnterpriseAgentId],
  );

  const refreshSocialRelationships = async () => {
    if (!isAuthenticatedSocial) {
      setSocialRelationships([]);
      setSelectedSocialPartnerId(null);
      return;
    }
    const data = await listRelationships(activeSocialType);
    setSocialRelationships(data);
    if (selectedSocialPartnerId && !data.some((item) => item.partnerUserId === selectedSocialPartnerId && item.status === 'accepted')) {
      setSelectedSocialPartnerId(null);
      setSocialMessages([]);
    }
  };

  // Get context-aware configuration
  const pageContext = getPageContext(location.pathname);
  const hasInsights = hasContextualInsights(location.pathname);
  const welcomeCadenceKey = `ai-panel:welcome:${location.pathname}`;
  const shouldShowFullWelcome = shouldShowPromptWithCadence(welcomeCadenceKey, 10 * 60 * 1000);

  const buildPanelWelcome = () => {
    const base = generateWelcomeMessage(location.pathname);
    if (hubTab === 'social') {
      return 'Social mode active. I can help with friends, teammates, collaboratives, and handoff-ready updates.';
    }
    if (hubTab === 'enterprise') {
      return 'Enterprise mode active. Choose an enterprise specialist and I will route execution with workspace context.';
    }
    if (shouldShowFullWelcome) {
      markPromptShown(welcomeCadenceKey);
      return base;
    }
    return `Welcome back. Continuing ${pageContext.displayName.toLowerCase()} context.`;
  };

  const enrichAiResponse = (raw: any, routingDecision: any, threadEnvelope: any) => {
    const content = sanitizeAssistantContent(String(raw?.content || ''));
    return {
      ...raw,
      content,
      contractCards: buildResponseContractCards(content),
      routing: {
        agentId: routingDecision.agent.id,
        agentName: routingDecision.agent.name,
        confidence: routingDecision.confidence,
        reason: routingDecision.reason,
        threadId: threadEnvelope.threadId,
        threadType: threadEnvelope.threadType,
      },
    };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message when panel opens or page changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = buildPanelWelcome();
      setMessages([{
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date(),
        quickReplies: pageContext.conversationStarters.slice(0, 3),
      }]);
    }
  }, [isOpen, location.pathname, hubTab]);

  // Reset conversation when page changes
  useEffect(() => {
    setMessages([]);
    const welcomeMessage = buildPanelWelcome();
    setMessages([{
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
      quickReplies: pageContext.conversationStarters.slice(0, 3),
    }]);
  }, [location.pathname, hubTab]);

  useEffect(() => {
    if (hubTab !== 'social') return;
    void refreshSocialRelationships();
  }, [hubTab, socialTab, actorId, isAuthenticatedSocial]);

  useEffect(() => {
    if (hubTab === 'nexus') {
      setSelectedNexusAgentId(null);
      return;
    }
    if (hubTab === 'enterprise') {
      setSelectedEnterpriseAgentId(null);
    }
  }, [hubTab]);

  useEffect(() => {
    if (hubTab !== 'enterprise' || !user?.id) return;
    let cancelled = false;
    const loadWorkspaces = async () => {
      setEnterpriseLoading(true);
      try {
        const res = await getEnterpriseWorkspaces(user.id, enterpriseWorkspaceId);
        const workspacesRaw = Array.isArray(res?.workspaces) ? res.workspaces : [];
        const parsed = workspacesRaw
          .map((w: any) => ({
            id: String(w?.id || '').trim(),
            name: String(w?.name || w?.id || 'Enterprise').trim(),
          }))
          .filter((w: { id: string }) => Boolean(w.id))
          .slice(0, 50);
        const fallback = [{ id: 'default', name: 'Enterprise Mission Control' }];
        const merged = parsed.length > 0 ? parsed : fallback;
        if (!cancelled) {
          setEnterpriseWorkspaces(merged);
          if (!merged.some((w) => w.id === enterpriseWorkspaceId)) {
            setEnterpriseWorkspaceId(merged[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setEnterpriseWorkspaces([{ id: 'default', name: 'Enterprise Mission Control' }]);
          setEnterpriseWorkspaceId('default');
        }
      } finally {
        if (!cancelled) setEnterpriseLoading(false);
      }
    };
    void loadWorkspaces();
    return () => {
      cancelled = true;
    };
  }, [hubTab, getEnterpriseWorkspaces, enterpriseWorkspaceId, user?.id]);

  useEffect(() => {
    if (hubTab !== 'enterprise' || !user?.id) return;
    let cancelled = false;
    const loadOrg = async () => {
      try {
        const res = await getEnterpriseOrg(user.id, enterpriseWorkspaceId);
        const list = Array.isArray(res?.agents) ? res.agents : [];
        const mapped = list
          .map((agent: any) => ({
            id: String(agent?.id || '').toLowerCase().trim(),
            name: String(agent?.name || agent?.id || 'Agent'),
            role: String(agent?.role || 'Enterprise specialist'),
            team: String(agent?.team || 'Enterprise'),
          }))
          .filter((agent: { id: string }) => Boolean(agent.id))
          .slice(0, 200);
        if (!cancelled) {
          setWorkspaceEnterpriseAgents(mapped);
          if (mapped.length > 0) setEnterpriseScope('workspace');
        }
      } catch {
        if (!cancelled) setWorkspaceEnterpriseAgents([]);
      }
    };
    void loadOrg();
    return () => {
      cancelled = true;
    };
  }, [hubTab, enterpriseWorkspaceId, getEnterpriseOrg, user?.id]);

  const tabContextHint = (tab: 'social' | 'nexus' | 'enterprise') => {
    if (tab === 'social') return 'Agent: Social Concierge. Mode: Social. Focus collaboration, friends, teammates, and handoffs.';
    if (tab === 'enterprise') return 'Agent: Enterprise Command. Mode: Enterprise. Focus specialist routing, delegation, governance, and execution status.';
    return 'Agent: Nexus Orchestrator. Mode: Nexus. Focus orchestration, planning, and contextual guidance.';
  };


  const sendMessageText = async (content: string) => {
    if (!content.trim()) return;
    const baseRoute = normalizeRouteContext(
      routeContext || routeContextFromUrl(location.pathname, location.search)
    );
    const canonicalRoute = hubTab === 'nexus' && selectedNexusAgent
      ? normalizeRouteContext({
          ...(baseRoute || {}),
          domainTab: selectedNexusAgent.domainTab,
          agentId: selectedNexusAgent.id,
          agentName: selectedNexusAgent.name,
        })
      : hubTab === 'enterprise' && selectedEnterpriseAgent
        ? normalizeRouteContext({
            ...(baseRoute || {}),
            domainTab: 'enterprise',
            workspaceId: enterpriseWorkspaceId,
            agentId: selectedEnterpriseAgent.id,
            agentName: selectedEnterpriseAgent.name,
          })
      : baseRoute;
    const routingDecision = routeAgentRequest(content, canonicalRoute);
    const threadEnvelope = buildChatThreadEnvelope(content, routingDecision.route);
    const routedPrefix = buildRoutePrefix(routingDecision.route);
    const userMessage = {
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      await queueAgentAction({
        routeKey: routedPrefix,
        prompt: userMessage.content,
      });
      const aiResponse = await processCommand(
        `${tabContextHint(hubTab)}\n${buildAgentRoutedPrompt(userMessage.content, routingDecision)}`
      );
      const enriched = enrichAiResponse(aiResponse, routingDecision, threadEnvelope);
      setMessages(prev => [...prev, enriched]);
      showLocalAgentNotification(
        'Agent replied',
        String(enriched?.content || '').slice(0, 140),
        buildAgentDeepLink(canonicalRoute),
      );
    } catch (error) {
      toast.error('Failed to process message');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;
    const content = message;
    setMessage('');
    await sendMessageText(content);
  };

  const socialBuckets = useMemo(() => {
    return {
      pendingInbound: socialRelationships.filter((item) => item.status === 'pending' && item.direction === 'inbound'),
      pendingOutbound: socialRelationships.filter((item) => item.status === 'pending' && item.direction === 'outbound'),
      connected: socialRelationships.filter((item) => item.status === 'accepted'),
      blocked: socialRelationships.filter((item) => item.status === 'blocked'),
    };
  }, [socialRelationships]);

  const socialTypeLabel = activeSocialType === 'friend'
    ? 'friend'
    : activeSocialType === 'teammate'
      ? 'teammate'
      : 'collaborative';

  const socialTabLabel = socialTab === 'friends'
    ? 'Friends'
    : socialTab === 'teammates'
      ? 'Teammates'
      : 'Collaboratives';

  const selectedSocialPartner = useMemo(
    () => socialBuckets.connected.find((item) => item.partnerUserId === selectedSocialPartnerId) || null,
    [socialBuckets.connected, selectedSocialPartnerId],
  );

  const resetInviteDialog = () => {
    setInviteEmail('');
    setShowSocialInviteDialog(false);
  };

  const handleSocialInvite = async () => {
    if (!isAuthenticatedSocial) {
      toast.error('Sign in is required for real social invites.');
      return;
    }
    const email = inviteEmail.trim();
    if (!email) {
      toast.error('Email is required to send an invite.');
      return;
    }
    try {
      const rel = await inviteByEmail(activeSocialType, email);
      toast.success(`${socialTabLabel} invite sent to ${rel.partnerName}`);
      resetInviteDialog();
      await refreshSocialRelationships();
    } catch (error: any) {
      toast.error(error?.message || 'Could not send invite.');
    }
  };

  const handleSocialTransition = async (
    relationshipId: string,
    action: 'accept' | 'decline' | 'cancel' | 'block' | 'unblock' | 'revoke',
    successMessage: string,
  ) => {
    try {
      await relationshipAction(relationshipId, action);
      toast.success(successMessage);
      await refreshSocialRelationships();
    } catch (error: any) {
      toast.error(error?.message || 'Action failed.');
    }
  };

  const loadSocialMessagesForPartner = async (partnerUserId: string) => {
    if (!isAuthenticatedSocial) return;
    setSocialLoading(true);
    try {
      const items = await listMessages(activeSocialType, partnerUserId);
      setSocialMessages(items);
      setSelectedSocialPartnerId(partnerUserId);
    } catch (error: any) {
      toast.error(error?.message || 'Could not load messages.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSendSocialMessage = async () => {
    if (!selectedSocialPartner || !socialMessageInput.trim() || socialSending) return;
    setSocialSending(true);
    const body = socialMessageInput;
    setSocialMessageInput('');
    try {
      const sent = await sendMessage(activeSocialType, selectedSocialPartner.partnerUserId, body);
      setSocialMessages((prev) => [...prev, sent]);
    } catch (error: any) {
      toast.error(error?.message || 'Could not send message.');
      setSocialMessageInput(body);
    } finally {
      setSocialSending(false);
    }
  };

  useEffect(() => {
    if (hubTab !== 'social' || !isAuthenticatedSocial || !actorId) return;
    const unsubscribe = subscribeToSocialMessages(actorId, (incoming) => {
      if (incoming.relationshipType !== activeSocialType) return;
      const partnerId = incoming.senderId === actorId ? incoming.recipientId : incoming.senderId;
      if (selectedSocialPartnerId && partnerId === selectedSocialPartnerId) {
        setSocialMessages((prev) => {
          if (prev.some((item) => item.messageId === incoming.messageId)) return prev;
          return [...prev, incoming];
        });
      }
      void refreshSocialRelationships();
    });
    return unsubscribe;
  }, [hubTab, activeSocialType, actorId, isAuthenticatedSocial, selectedSocialPartnerId]);

  useEffect(() => {
    if (!selectedSocialPartnerId || hubTab !== 'social') return;
    void loadSocialMessagesForPartner(selectedSocialPartnerId);
  }, [selectedSocialPartnerId, activeSocialType, hubTab]);

  const getAvatarUrl = (record: SocialRelationshipRecord) => {
    if (record.partnerAvatar) return record.partnerAvatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(record.partnerEmail || record.partnerUserId)}`;
  };

  const getLastMessagePreview = (partnerUserId: string) => {
    const partnerMessages = socialMessages.filter((item) => {
      const other = item.senderId === actorId ? item.recipientId : item.senderId;
      return other === partnerUserId;
    });
    if (partnerMessages.length === 0) return 'No messages yet';
    const last = partnerMessages[partnerMessages.length - 1];
    return last.body.length > 48 ? `${last.body.slice(0, 48)}...` : last.body;
  };

  const getRelationshipStatusRing = (record: SocialRelationshipRecord) => {
    if (record.status === 'accepted') return 'bg-emerald-400';
    if (record.status === 'pending') return 'bg-amber-400';
    return 'bg-red-400';
  };

  const formatSocialTimestamp = (iso: string) => {
    const date = new Date(iso);
    const now = Date.now();
    const deltaMinutes = Math.floor((now - date.getTime()) / 60000);
    if (deltaMinutes < 1) return 'now';
    if (deltaMinutes < 60) return `${deltaMinutes}m`;
    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) return `${deltaHours}h`;
    return `${Math.floor(deltaHours / 24)}d`;
  };

  const socialEmptyMessage = !isAuthenticatedSocial
    ? 'Sign in to send real invites and chat with connected users.'
    : `No connected ${socialTypeLabel}s yet. Add one to start chatting.`;

  const handleSocialMessageKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendSocialMessage();
    }
  };

  const selectedProfileSubtitle = selectedSocialPartner
    ? `${socialTabLabel.slice(0, -1)} • ${selectedSocialPartner.partnerEmail}`
    : `${socialTabLabel} chat`;

  const selectedPartnerMessages = selectedSocialPartner
    ? socialMessages.filter((item) => {
        const other = item.senderId === actorId ? item.recipientId : item.senderId;
        return other === selectedSocialPartner.partnerUserId;
      })
    : [];

  const socialHeaderHint = selectedSocialPartner
    ? `Chatting with ${selectedSocialPartner.partnerName}`
    : socialEmptyMessage;

  const socialPaneRatio = 'grid grid-cols-[30%_70%] gap-3';

  const socialThreadPlaceholder = selectedSocialPartner
    ? 'Type a message...'
    : 'Select a connected user to chat';

  const canSendToSelected = Boolean(selectedSocialPartner && isAuthenticatedSocial);

  const relationshipStatsLabel = `${socialBuckets.connected.length} connected • ${socialBuckets.pendingInbound.length} inbound • ${socialBuckets.pendingOutbound.length} outbound`;

  const relationshipCardClass = 'rounded-md border border-gray-700/70 bg-black/20 p-2.5';

  const leftRailRecords = socialBuckets.connected;

  const rightPaneHasChat = Boolean(selectedSocialPartner && canSendToSelected);

  const showRelationshipManagement = !rightPaneHasChat;

  const relationStatusBadge = (record: SocialRelationshipRecord) => {
    if (record.status === 'accepted') {
      return <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">Connected</Badge>;
    }
    if (record.status === 'pending') {
      return <Badge variant="outline" className="border-amber-500/40 text-amber-300">Pending</Badge>;
    }
    return <Badge variant="outline" className="border-red-500/40 text-red-300">Blocked</Badge>;
  };

  const relationshipTitleForRow = (item: SocialRelationshipRecord) => item.partnerName || item.partnerEmail || item.partnerUserId;

  const relationshipSubtitleForRow = (item: SocialRelationshipRecord) => item.partnerEmail || item.partnerUserId;

  const clearSelectionIfDisconnected = () => {
    if (!selectedSocialPartnerId) return;
    const stillConnected = socialBuckets.connected.some((entry) => entry.partnerUserId === selectedSocialPartnerId);
    if (!stillConnected) {
      setSelectedSocialPartnerId(null);
      setSocialMessages([]);
    }
  };

  useEffect(() => {
    clearSelectionIfDisconnected();
  }, [socialBuckets.connected.length]);

  const buildSocialRelationshipRow = (
    item: SocialRelationshipRecord,
    actions: ReactNode,
  ) => (
    <div key={item.relationshipId} className={relationshipCardClass}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-white">{relationshipTitleForRow(item)}</p>
          <p className="truncate text-[11px] text-gray-400">{relationshipSubtitleForRow(item)}</p>
        </div>
        {relationStatusBadge(item)}
      </div>
      <div className="mt-2 flex gap-2">{actions}</div>
    </div>
  );

  const renderRelationshipManagement = () => (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-700 bg-[#252830] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-300">
            Pending Invites ({socialBuckets.pendingOutbound.length})
          </h4>
        </div>
        {socialBuckets.pendingOutbound.length === 0 ? (
          <p className="text-xs text-gray-500">No pending outbound invites.</p>
        ) : (
          <div className="space-y-2">
            {socialBuckets.pendingOutbound.map((item) =>
              buildSocialRelationshipRow(
                item,
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => void handleSocialTransition(item.relationshipId, 'cancel', 'Invite cancelled')}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={() => void handleSocialTransition(item.relationshipId, 'block', 'Connection blocked')}
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Block
                  </Button>
                </>,
              ),
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-[#252830] p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">
          Incoming Requests ({socialBuckets.pendingInbound.length})
        </h4>
        {socialBuckets.pendingInbound.length === 0 ? (
          <p className="text-xs text-gray-500">No inbound requests yet.</p>
        ) : (
          <div className="space-y-2">
            {socialBuckets.pendingInbound.map((item) =>
              buildSocialRelationshipRow(
                item,
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => void handleSocialTransition(item.relationshipId, 'accept', 'Request accepted')}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => void handleSocialTransition(item.relationshipId, 'decline', 'Request declined')}
                  >
                    <UserX className="mr-1 h-3 w-3" />
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-red-500/40 text-red-300 hover:bg-red-500/10"
                    onClick={() => void handleSocialTransition(item.relationshipId, 'block', 'Connection blocked')}
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Block
                  </Button>
                </>,
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (!isOpen || !quickTalkStarter || isProcessing) return;
    onQuickTalkConsumed?.();
    // Keep dashboard interactions responsive: prefill quick-talk text
    // instead of auto-sending a potentially long-running AI command.
    setMessage(quickTalkStarter);
    queueMicrotask(() => {
      inputRef.current?.focus();
    });
  }, [isOpen, quickTalkStarter, isProcessing, onQuickTalkConsumed]);

  const handleQuickReply = async (reply: string) => {
    setMessage('');
    
    // Special handling for "Open the panel" quick reply
    if (reply.toLowerCase() === 'open the panel' && onOpenAIInsights) {
      onOpenAIInsights();
      const userMsg = { type: 'user', content: reply, timestamp: new Date() };
      const aiMsg = {
        type: 'ai',
        content: 'Chat panel is now open! Check out your personalized task and goal suggestions on the right side.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg, aiMsg]);
      toast.success('Chat panel opened', { description: 'View your personalized suggestions' });
      return;
    }
    
    const userMsg = { type: 'user', content: reply, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      const baseRoute = normalizeRouteContext(
        routeContext || routeContextFromUrl(location.pathname, location.search)
      );
      const canonicalRoute = hubTab === 'nexus' && selectedNexusAgent
        ? normalizeRouteContext({
            ...(baseRoute || {}),
            domainTab: selectedNexusAgent.domainTab,
            agentId: selectedNexusAgent.id,
            agentName: selectedNexusAgent.name,
          })
        : hubTab === 'enterprise' && selectedEnterpriseAgent
          ? normalizeRouteContext({
              ...(baseRoute || {}),
              domainTab: 'enterprise',
              workspaceId: enterpriseWorkspaceId,
              agentId: selectedEnterpriseAgent.id,
              agentName: selectedEnterpriseAgent.name,
            })
        : baseRoute;
      const routingDecision = routeAgentRequest(reply, canonicalRoute);
      const threadEnvelope = buildChatThreadEnvelope(reply, routingDecision.route);
      const aiResponse = await processCommand(
        `${tabContextHint(hubTab)}\n${buildAgentRoutedPrompt(reply, routingDecision)}`
      );
      setMessages(prev => [...prev, enrichAiResponse(aiResponse, routingDecision, threadEnvelope)]);
    } catch (error) {
      toast.error('Failed to process message');
      setMessages(prev => [...prev, {
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const requiresSpecialistSelection = hubTab === 'nexus' || hubTab === 'enterprise';
  const activeSpecialist = hubTab === 'nexus' ? selectedNexusAgent : selectedEnterpriseAgent;
  const leftRailAgents = hubTab === 'nexus' ? NEXUS_TAB_AGENTS : enterpriseRoster;
  const showSelectionGrid = requiresSpecialistSelection && !activeSpecialist;
  const inputLocked = requiresSpecialistSelection && !activeSpecialist;
  const handleAgentAvatarDragStart = (event: React.DragEvent, agent: { id: string; name: string }) => {
    const payload = JSON.stringify({
      type: 'agent',
      id: agent.id,
      name: agent.name,
      sourceTab: hubTab,
      workspaceId: hubTab === 'enterprise' ? enterpriseWorkspaceId : undefined,
    });
    event.dataTransfer.setData('application/x-syncscript-agent', payload);
    event.dataTransfer.setData('text/plain', `@${agent.id}`);
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-[#1a1c20] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative">
              <Brain className="w-4 h-4 text-white" />
              {hasInsights && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[#1a1c20] animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Chat Hub</h3>
              <p className="text-[10px] text-gray-400">
                {pageContext.displayName} • {energyData.current}% energy
                {` • Agent: ${tabAgentName}`}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md p-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 hover:border-purple-600/40 transition-colors"
                aria-label="AI Assistant settings"
              >
                <Settings className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-pointer hover:rotate-90 transition-all duration-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1e2128] border-gray-800">
              <DropdownMenuLabel className="text-white">Chat Hub Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <DropdownMenuCheckboxItem
                checked={autoRefresh}
                onCheckedChange={(checked) => {
                  setAutoRefresh(checked);
                  toast.success(checked ? 'Auto-refresh enabled' : 'Auto-refresh disabled');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Auto-refresh Insights
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={notifications}
                onCheckedChange={(checked) => {
                  setNotifications(checked);
                  toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Proactive Suggestions
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <DropdownMenuItem
                onClick={() => {
                  setMessages([]);
                  const welcomeMessage = generateWelcomeMessage(location.pathname);
                  setMessages([{
                    type: 'ai',
                    content: welcomeMessage,
                    timestamp: new Date(),
                    quickReplies: pageContext.conversationStarters.slice(0, 3),
                  }]);
                  toast.success('Conversation cleared');
                }}
                className="text-gray-300 focus:bg-purple-600/10 focus:text-white cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Clear Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 grid w-full grid-cols-3 rounded-xl border border-gray-700 bg-[#252830] p-[3px]">
          {([
            { key: 'social', label: 'Social', activeClass: 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30' },
            { key: 'nexus', label: 'Nexus', activeClass: 'bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/30' },
            { key: 'enterprise', label: 'Enterprise', activeClass: 'bg-teal-600/20 text-teal-300 ring-1 ring-teal-500/30' },
          ] as const).map((tab) => {
            const isActive = hubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setHubTab(tab.key)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? tab.activeClass : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Context Insights Banner */}
        {pageContext.smartInsights.length > 0 && (
          <div className="mt-2 p-2 bg-purple-600/10 border border-purple-600/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-purple-300 space-y-0.5">
                {pageContext.smartInsights.slice(0, 2).map((insight, i) => (
                  <p key={i}>• {insight}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {hubTab === 'social' && (
        <div className="flex-shrink-0 border-b border-gray-800 px-4 py-3">
          <div className="grid w-full grid-cols-3 rounded-xl border border-gray-700 bg-[#252830] p-[3px]">
            {([
              { key: 'friends', label: 'Friends' },
              { key: 'teammates', label: 'Teammates' },
              { key: 'collaboratives', label: 'Collaboratives' },
            ] as const).map((tab) => {
              const isActive = socialTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSocialTab(tab.key)}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hubTab === 'social' ? (
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className={`${socialPaneRatio} h-full min-h-0`}>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#252830]">
              <div className="border-b border-gray-700 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">Recents</p>
                <p className="mt-1 text-[11px] text-gray-500">{relationshipStatsLabel}</p>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-1 p-2">
                  {leftRailRecords.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-gray-500">{socialEmptyMessage}</p>
                  ) : (
                    leftRailRecords.map((record) => {
                      const isActive = selectedSocialPartnerId === record.partnerUserId;
                      return (
                        <button
                          key={record.relationshipId}
                          type="button"
                          onClick={() => void loadSocialMessagesForPartner(record.partnerUserId)}
                          className={`w-full rounded-md border px-2 py-2 text-left transition-colors ${
                            isActive
                              ? 'border-blue-500/40 bg-blue-500/10'
                              : 'border-transparent hover:border-gray-600 hover:bg-black/20'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <img
                                src={getAvatarUrl(record)}
                                alt={record.partnerName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#252830] ${getRelationshipStatusRing(record)}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-medium text-white">{record.partnerName}</p>
                                <span className="text-[10px] text-gray-500">{formatSocialTimestamp(record.updatedAt)}</span>
                              </div>
                              <p className="truncate text-[11px] text-gray-400">{getLastMessagePreview(record.partnerUserId)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#252830]">
              <div className="border-b border-gray-700 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {selectedSocialPartner ? selectedSocialPartner.partnerName : socialTabLabel}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">{selectedProfileSubtitle}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowSocialInviteDialog(true)}
                    className="rounded-xl border border-blue-200/40 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-3 py-1.5 text-[11px] text-white shadow-[0_10px_30px_rgba(30,64,175,0.45)] ring-1 ring-inset ring-white/10 transition-all hover:from-slate-800 hover:via-blue-800 hover:to-indigo-800 hover:shadow-[0_12px_34px_rgba(37,99,235,0.55)]"
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5 text-blue-100" />
                    Add {socialTypeLabel.charAt(0).toUpperCase() + socialTypeLabel.slice(1)}
                  </Button>
                </div>
                <p className="text-[11px] text-gray-500">{socialHeaderHint}</p>
              </div>

              <div className="h-[25%] border-b border-gray-700/70 p-3">
                {selectedSocialPartner ? (
                  <div className="flex h-full items-center gap-3">
                    <img
                      src={getAvatarUrl(selectedSocialPartner)}
                      alt={selectedSocialPartner.partnerName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{selectedSocialPartner.partnerName}</p>
                      <p className="truncate text-xs text-gray-400">{selectedSocialPartner.partnerEmail}</p>
                      <p className="mt-1 text-[11px] text-emerald-300">Connected {formatSocialTimestamp(selectedSocialPartner.updatedAt)} ago</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">
                    Select a connected user from Recents to open chat.
                  </div>
                )}
              </div>

              <div className="h-[75%] min-h-0">
                {showRelationshipManagement ? (
                  <div className="h-full overflow-hidden">
                    <ScrollArea className="h-full p-3">
                      {renderRelationshipManagement()}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <ScrollArea className="flex-1 px-3 py-2">
                      {socialLoading ? (
                        <p className="text-xs text-gray-500">Loading messages...</p>
                      ) : selectedPartnerMessages.length === 0 ? (
                        <p className="text-xs text-gray-500">No messages yet. Start the conversation.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedPartnerMessages.map((msg) => {
                            const mine = msg.senderId === actorId;
                            return (
                              <div key={msg.messageId} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                                  mine
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                    : 'bg-black/30 text-gray-200 border border-gray-700'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.body}</p>
                                  <p className={`mt-1 text-[10px] ${mine ? 'text-blue-100/80' : 'text-gray-500'}`}>
                                    {formatSocialTimestamp(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    <div className="border-t border-gray-700 px-3 py-2">
                      <div className="flex gap-2">
                        <Input
                          value={socialMessageInput}
                          onChange={(event) => setSocialMessageInput(event.target.value)}
                          onKeyDown={handleSocialMessageKeyDown}
                          placeholder={socialThreadPlaceholder}
                          className="h-8 bg-[#1e2128] border-gray-700 text-xs"
                          disabled={!canSendToSelected || socialSending}
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2.5"
                          onClick={() => void handleSendSocialMessage()}
                          disabled={!canSendToSelected || !socialMessageInput.trim() || socialSending}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Dialog open={showSocialInviteDialog} onOpenChange={setShowSocialInviteDialog}>
            <DialogContent className="border-gray-700 bg-[#1e2128] text-white">
              <DialogHeader>
                <DialogTitle>Add {socialTypeLabel.charAt(0).toUpperCase() + socialTypeLabel.slice(1)}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Enter the exact email of an existing user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Email</label>
                  <Input
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="bg-[#252830] border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={resetInviteDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleSocialInvite()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
                    disabled={!inviteEmail.trim()}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-hidden p-3">
            {showSelectionGrid ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#252830]">
                <div className="border-b border-gray-700 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                    {hubTab === 'nexus' ? 'Tab Agents' : 'Enterprise Agents'}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {hubTab === 'nexus'
                      ? 'Pick an agent to open chat. After selection, avatars stay on the right for fast switching.'
                      : 'Pick an enterprise specialist to open chat, then switch quickly from right-side avatar heads.'}
                  </p>
                </div>
                {hubTab === 'enterprise' && (
                  <div className="grid grid-cols-1 gap-2 border-b border-gray-700 px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEnterpriseScope('core')}
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          enterpriseScope === 'core' ? 'bg-teal-500/20 text-teal-200' : 'bg-black/20 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Core Agents
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnterpriseScope('workspace')}
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          enterpriseScope === 'workspace' ? 'bg-teal-500/20 text-teal-200' : 'bg-black/20 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Workspace Agents
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={enterpriseWorkspaceId}
                        onChange={(event) => setEnterpriseWorkspaceId(event.target.value)}
                        className="h-8 w-full rounded-md border border-gray-700 bg-[#1e2128] px-2 text-xs text-gray-200"
                      >
                        {enterpriseWorkspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={enterpriseSearch}
                        onChange={(event) => setEnterpriseSearch(event.target.value)}
                        placeholder="Search"
                        className="h-8 w-32 bg-[#1e2128] border-gray-700 text-xs"
                      />
                    </div>
                  </div>
                )}
                <ScrollArea className="min-h-0 flex-1">
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {leftRailAgents.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => hubTab === 'nexus' ? setSelectedNexusAgentId(agent.id) : setSelectedEnterpriseAgentId(agent.id)}
                        className="w-full rounded-md border border-transparent bg-black/20 px-2 py-2 text-left transition-colors hover:border-gray-600 hover:bg-black/30"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.id)}`}
                            alt={agent.name}
                            className="h-8 w-8 rounded-full border border-gray-700 bg-black/30"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-medium text-white">{agent.name}</p>
                              <span className="text-[10px] text-gray-500">
                                {'tabLabel' in agent ? agent.tabLabel : agent.team}
                              </span>
                            </div>
                            <p className="truncate text-[11px] text-gray-400">{agent.role}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {leftRailAgents.length === 0 && (
                      <p className="px-1 py-2 text-xs text-gray-500">
                        {enterpriseLoading ? 'Loading enterprise agents...' : 'No agents found for this filter.'}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="grid h-full min-h-0 grid-cols-[68px_minmax(0,1fr)] gap-3">
                <div className="flex min-h-0 w-[68px] flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#252830]">
                  <div className="border-b border-gray-700 p-1.5">
                    <button
                      type="button"
                      title="Back to full list"
                      onClick={() => hubTab === 'nexus' ? setSelectedNexusAgentId(null) : setSelectedEnterpriseAgentId(null)}
                      className="flex h-9 w-full items-center justify-center rounded-md bg-black/20 text-[10px] text-gray-300 hover:bg-black/30"
                    >
                      All
                    </button>
                  </div>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-1.5 p-1.5">
                      {leftRailAgents.map((agent) => {
                        const isActive = activeSpecialist?.id === agent.id;
                        return (
                          <button
                            key={agent.id}
                            type="button"
                            title={`Drag ${agent.name} onto task/goal/event`}
                            draggable
                            onDragStart={(event) => handleAgentAvatarDragStart(event, agent)}
                            onClick={() => hubTab === 'nexus' ? setSelectedNexusAgentId(agent.id) : setSelectedEnterpriseAgentId(agent.id)}
                            className={`flex w-full items-center justify-center rounded-md border p-1 transition-colors ${
                              isActive ? 'border-purple-500/40 bg-purple-500/20' : 'border-transparent hover:border-gray-600 hover:bg-black/20'
                            }`}
                          >
                            <img
                              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.id)}`}
                              alt={agent.name}
                              className="h-8 w-8 rounded-full border border-gray-700 bg-black/30"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#252830]">
                  <div className="border-b border-gray-700 px-3 py-2">
                    <p className="text-xs font-medium text-white">{activeSpecialist?.name || 'Agent'}</p>
                    <p className="text-[11px] text-gray-400">
                      {hubTab === 'nexus'
                        ? `${(activeSpecialist as any)?.tabLabel || 'Nexus'} specialist`
                        : `${selectedWorkspaceLabel} • ${(activeSpecialist as any)?.team || 'Enterprise'}`}
                    </p>
                  </div>
                  <ScrollArea className="min-h-0 flex-1 px-4 py-3">
                    <div className="space-y-3">
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          {msg.type === 'ai' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className={`flex-1 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                            <div className={`rounded-lg p-3 max-w-[85%] ${
                              msg.type === 'user' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-[#252830] border border-gray-700 text-gray-200'
                            }`}>
                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {isProcessing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                          </div>
                          <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-3 border-t border-gray-800 bg-[#1a1d24] space-y-2">
            {/* Command hint */}
            {message.startsWith('/') && (
              <div className="text-[10px] text-purple-400 flex items-center gap-1.5 px-2">
                <Sparkles className="w-3 h-3" />
                <span>Smart command detected. Type /help for all commands</span>
              </div>
            )}
            
            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={hubTab === 'nexus'
                  ? (selectedNexusAgent ? `Message ${selectedNexusAgent.name}...` : 'Select a Nexus agent to start')
                  : hubTab === 'enterprise'
                    ? (selectedEnterpriseAgent ? `Message ${selectedEnterpriseAgent.name}...` : 'Select an Enterprise agent to start')
                    : `Ask about ${pageContext.displayName.toLowerCase()}...`}
                className="flex-1 bg-[#252830] border-gray-700 focus:border-purple-600 text-sm h-9"
                disabled={isProcessing || inputLocked}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isProcessing || inputLocked}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-9 px-3"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-500 text-center px-2">
              Try: {hubTab === 'nexus'
                ? (selectedNexusAgent ? `@${selectedNexusAgent.id} ${pageContext.conversationStarters[0]}` : 'Select an agent above')
                : hubTab === 'enterprise'
                  ? (selectedEnterpriseAgent ? `@${selectedEnterpriseAgent.id} ${pageContext.conversationStarters[0]}` : 'Select an enterprise agent above')
                : pageContext.conversationStarters[0]}
            </p>
          </div>
        </>
      )}
    </div>
  );
}