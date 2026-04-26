import { useState, useEffect, useRef, useCallback, useMemo, startTransition, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'motion/react'
import logoImage from 'figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png'
import { DashboardLayout } from '../../../components/layout/DashboardLayout'
import {} from '@/components/ui/collapsible'
import { api } from '@/lib/railway-api'
import { useToast } from '@/hooks/use-app-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '../../../contexts/AuthContext'
import { useNexusPrivateContext } from '../../../hooks/useNexusPrivateContext'
import { useSetAiPageMobileChatsToolbar } from '@/contexts/AiPageChromeContext'
import {
  Send,
  Plus,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  Mic,
  MicOff,
  MessageSquare,
  FileText,
  Phone,
  AudioWaveform,
  X,
  Users,
} from 'lucide-react'
import { DocumentCanvas } from '../../../components/DocumentCanvas'
// Lazy-loaded so the ~848KB voice chunk only ships when the user opens
// voice. See .cursor/rules/04-perf-seo-gate.mdc — keeps the AppAI route
// initial bundle under our perf budget. The Suspense wrapper around
// <VoiceConversationEngine /> below shows the "Opening voice…" fallback
// during the chunk fetch.
const VoiceConversationEngine = lazy(() =>
  import('../../../components/VoiceConversationEngine').then((m) => ({
    default: m.VoiceConversationEngine,
  }))
)
import { PRESET_AGENTS, getAgentPersona, getAgentName, routeToAgents, type AgentPersona } from '../../../utils/agent-personas'
import { getStoredNexusPersonaMode } from '../../../utils/nexus-persona-preference'
import { NEXUS_USER_CHAT_PATH } from '../../../config/nexus-vercel-ai-routes'
import { toolTraceToDelegationHints } from '../../../utils/nexus-delegation-visual'
import { useAppAiAttachments } from '../../../hooks/useAppAiAttachments'
import { AppAiDropzoneOverlay } from '../../../components/nexus/AppAiDropzoneOverlay'
import { AppAiAttachmentsBar } from '../../../components/nexus/AppAiAttachmentsBar'
import { AppAiSidebarPanel } from '../../../components/nexus/AppAiSidebarPanel'
import { AgentRunStream } from '../../../components/nexus/AgentRunStream'
import { useStartAgentRun } from '../../../hooks/useAgentRuns'
import { useActiveAgentRun } from '../../../hooks/useActiveAgentRun'
import { detectAgentIntent, userExplicitlyRequestsAgent } from '../../../utils/agent-intent-detector'
import { useSelectedProject } from '../../../hooks/useProjects'
import { VoiceDockedFrame } from '../../../components/nexus/VoiceDockedFrame'
import {
  attachmentsForServer,
  type AttachmentForServer,
  type AppAiAttachment,
} from '../../../utils/document-attachment'
const CHAT_STORAGE_KEY = 'syncscript-chats'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  feedback?: 'up' | 'down'
  document?: { title: string; content: string; format?: 'document' | 'spreadsheet' | 'invoice' }
  agentId?: string
  agentName?: string
  agentColor?: string
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  type?: 'direct' | 'group'
  agents?: string[]
}

function parseAIResponse(text: string): { displayText: string; createEventData?: { title: string; startTime?: string; endTime?: string } } {
  let displayText = text

  const userMsgMatch = text.match(/\[USER_MESSAGE\]([\s\S]*?)\[\/USER_MESSAGE\]/g)
  if (userMsgMatch) {
    userMsgMatch.forEach((match) => {
      const inner = match.replace(/\[USER_MESSAGE\]|\[\/USER_MESSAGE\]/g, '').trim()
      displayText = displayText.replace(match, inner)
    })
  }

  const createEventMatch = text.match(/ACTION:CREATE_EVENT\s+([\s\S]*?)(?=ACTION:|$)/i)
  let createEventData: { title: string; startTime?: string; endTime?: string } | undefined
  if (createEventMatch) {
    const block = createEventMatch[1]
    const titleMatch = block.match(/title[:\s]+([^\n]+)/i)
    const startMatch = block.match(/start[:\s]+([^\n]+)/i)
    const endMatch = block.match(/end[:\s]+([^\n]+)/i)
    createEventData = {
      title: titleMatch ? titleMatch[1].trim() : 'AI Event',
      startTime: startMatch ? startMatch[1].trim() : undefined,
      endTime: endMatch ? endMatch[1].trim() : undefined,
    }
  }

  return { displayText, createEventData }
}

function simpleMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm">{item}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }
  lines.forEach((line, i) => {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2))
      return
    }
    flushList()
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-semibold mt-3 mb-1">{line.slice(3)}</h2>)
      return
    }
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold mt-3 mb-1">{line.slice(2)}</h1>)
      return
    }
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    const code = bold.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
    elements.push(
      <p key={i} className="text-sm my-1" dangerouslySetInnerHTML={{ __html: code || '&nbsp;' }} />
    )
  })
  flushList()
  return <div className="space-y-1">{elements}</div>
}

function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Chat[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveChats(chats: Chat[]) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats))
}

export function AppAIPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { accessToken } = useAuth()
  const privateContext = useNexusPrivateContext()
  const [chats, setChats] = useState<Chat[]>(loadChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id ?? null)
  const [input, setInput] = useState('')
  
  
  const [isListening, setIsListening] = useState(false)
  const [showVoiceEngine, setShowVoiceEngine] = useState(false)
  /** Voice = immersive orb; Call Nexus = classic waveform console. */
  const [voiceImmersiveArt, setVoiceImmersiveArt] = useState(true)
  /** Bump on each open so VoiceConversationEngine remounts (clears autoDial ref / session state). */
  const [voiceEngineMountKey, setVoiceEngineMountKey] = useState(0)
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [selectedGroupAgents, setSelectedGroupAgents] = useState<string[]>([])
  const [canvasDoc, setCanvasDoc] = useState<{ title: string; content: string; format?: 'document' | 'spreadsheet' | 'invoice' } | null>(null)
  const [canvasDocKey, setCanvasDocKey] = useState(0)
  /** Selected agent run id (Tasks tab → click a run → opens AgentRunStream as overlay). */
  const [selectedAgentRunId, setSelectedAgentRunId] = useState<string | null>(null)
  const startAgentRun = useStartAgentRun()
  const { selected: selectedProjectId } = useSelectedProject()
  /** Active agent run (queued/running/waiting/paused). When non-null while voice is open,
      the voice portal docks to the top-left so the agent screen has the rest of the viewport. */
  const activeAgentRun = useActiveAgentRun()
  const voiceDocked = Boolean(showVoiceEngine && activeAgentRun)
  const dockedAgentStatus = useMemo(() => {
    if (!activeAgentRun) return ''
    if (activeAgentRun.status === 'queued') return 'Queued…'
    if (activeAgentRun.status === 'waiting_user') return 'Needs your approval'
    if (activeAgentRun.status === 'paused') return 'Paused'
    // Truncate so it never blows the dock width.
    const goal = activeAgentRun.goal_text || 'Working…'
    return goal.length > 36 ? goal.slice(0, 33) + '…' : goal
  }, [activeAgentRun])

  /**
   * Drag-and-drop documents (Reference = read-only context, Modify = load into
   * canvas + Nexus revises in place via update_document). Implementation lives
   * in `useAppAiAttachments` — this page just wires it to the root + composer.
   */
  const handleAttachmentError = useCallback(
    (msg: string) => toast({ title: 'Attachment', description: msg, variant: 'destructive' }),
    [toast],
  )
  const handleAttachmentWarn = useCallback(
    (msg: string) => toast({ title: 'Attachment', description: msg }),
    [toast],
  )
  const openModifyCanvas = useCallback((a: AppAiAttachment) => {
    setCanvasDoc({ title: a.name, content: a.content, format: 'document' })
    setCanvasDocKey((k) => k + 1)
  }, [])
  const {
    attachments,
    dragMode,
    rootDragHandlers,
    setDragMode,
    onAttachClick,
    removeAttachment,
    clearAttachments,
    hiddenInput,
  } = useAppAiAttachments({
    onError: handleAttachmentError,
    onWarn: handleAttachmentWarn,
    onModifyOpen: openModifyCanvas,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false)

  const scrollMessagesToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  /**
   * INP: the handler must return immediately. Never call getUserMedia in this path (often 300–500ms+).
   * Defer state + lazy chunk to a macrotask; mic/STT starts inside VoiceConversationEngine after mount.
   */
  const openVoice = useCallback(() => {
    globalThis.setTimeout(() => {
      startTransition(() => {
        setVoiceImmersiveArt(true)
        setVoiceEngineMountKey((k) => k + 1)
        setShowVoiceEngine(true)
      })
    }, 0)
  }, [])

  const openClassicVoice = useCallback(() => {
    globalThis.setTimeout(() => {
      startTransition(() => {
        setVoiceImmersiveArt(false)
        setVoiceEngineMountKey((k) => k + 1)
        setShowVoiceEngine(true)
      })
    }, 0)
  }, [])

  const activeChat = chats.find((c) => c.id === activeChatId)
  const showMobileFooterVoice = Boolean(activeChat && activeChat.messages.length > 0)

  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeChat?.messages])

  useEffect(() => {
    if (!mobileChatsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileChatsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileChatsOpen])

  const chatMutation = useMutation({
    mutationFn: async (input: { message: string; attachments: AttachmentForServer[] }) => {
      const { message, attachments: turnAttachments } = input
      if (!accessToken) throw new Error('Please sign in to use Nexus.')

      const history = (activeChat?.messages || [])
        .slice(-10)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }))

      const isGroup = activeChat?.type === 'group' && activeChat.agents && activeChat.agents.length > 0;
      let targetAgentIds = ['nexus'];

      if (isGroup) {
        const invitedPersonas = (activeChat.agents || []).map(id => getAgentPersona(id)).filter(Boolean) as AgentPersona[];
        targetAgentIds = routeToAgents(message, invitedPersonas);
      }

      const results: Array<Record<string, unknown> & { agentId?: string; agentName?: string; agentColor?: string }> = []
      for (const agentId of targetAgentIds) {
        const persona = getAgentPersona(agentId);
        const res = await fetch(NEXUS_USER_CHAT_PATH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: [...history, { role: 'user', content: message }],
            privateContext,
            enableTools: true,
            voiceMode: false,
            personaMode: getStoredNexusPersonaMode(),
            agentId: agentId !== 'nexus' ? agentId : undefined,
            agentPersonaPrompt: persona?.systemPrompt || undefined,
            ...(turnAttachments.length > 0 ? { attachments: turnAttachments } : {}),
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Request failed')
        }

        const data = await res.json();
        results.push({ ...data, agentId, agentName: persona?.name || 'Nexus', agentColor: persona?.color || '#8b5cf6' });
      }

      return results.length === 1 ? results[0] : results;
    },
    onSuccess: (data: unknown, variables) => {
      const message = variables.message
      const responses = Array.isArray(data) ? data : [data];

      for (const payload of responses) {
      const reply =
        payload?.content ||
        payload?.reply ||
        payload?.data?.reply ||
        (typeof payload === 'string' ? payload : '')
      const { displayText, createEventData } = parseAIResponse(reply)

      let docAttachment: { title: string; content: string; format?: 'document' | 'spreadsheet' | 'invoice' } | undefined

      const delegationHintsFromTrace =
        Array.isArray(payload?.toolTrace) && (payload.toolTrace as Record<string, unknown>[]).length > 0
          ? toolTraceToDelegationHints(payload.toolTrace as Record<string, unknown>[], displayText)
          : undefined
      const delegationHints =
        delegationHintsFromTrace && delegationHintsFromTrace.length > 0 ? delegationHintsFromTrace : undefined

      if (Array.isArray(payload?.toolTrace) && payload.toolTrace.length > 0) {
        window.dispatchEvent(
          new CustomEvent('syncscript:nexus-tool-trace', { detail: { toolTrace: payload.toolTrace } }),
        )
        const okCreates = payload.toolTrace.filter(
          (t: { ok?: boolean; tool?: string }) =>
            t?.ok && (t.tool === 'create_task' || t.tool === 'add_note'),
        )
        if (okCreates.length > 0) {
          toast({
            title: 'Nexus updated your tasks',
            description:
              okCreates.length === 1 ? 'Open Tasks to see the new item.' : `${okCreates.length} items added.`,
          })
        }
        const holds = payload.toolTrace.filter(
          (t: { ok?: boolean; tool?: string }) => t?.ok && t.tool === 'propose_calendar_hold',
        )
        if (holds.length > 0) {
          toast({
            title: 'Calendar event saved',
            description: 'Check your Tasks and Calendar.',
          })
        }
        const docResults = payload.toolTrace.filter(
          (t: { ok?: boolean; tool?: string; detail?: unknown }) => t?.ok && t.tool === 'create_document' && t.detail,
        )
        if (docResults.length > 0) {
          const doc = docResults[0].detail as { title?: string; content?: string; format?: string }
          if (doc.title && doc.content) {
            docAttachment = {
              title: doc.title,
              content: doc.content,
              format: (doc.format as 'document' | 'spreadsheet' | 'invoice') || 'document',
            }
            setCanvasDoc(docAttachment)
            setCanvasDocKey((k) => k + 1)
          }
        }
        const updateResults = payload.toolTrace.filter(
          (t: { ok?: boolean; tool?: string; detail?: unknown }) =>
            t?.ok && t.tool === 'update_document' && t.detail && typeof (t.detail as { content?: string }).content === 'string',
        )
        if (updateResults.length > 0) {
          const doc = updateResults[updateResults.length - 1].detail as {
            title?: string
            content: string
            format?: string
          }
          docAttachment = {
            title: doc.title || docAttachment?.title || 'Document',
            content: doc.content,
            format: (doc.format as 'document' | 'spreadsheet' | 'invoice') || docAttachment?.format || 'document',
          }
          setCanvasDoc(docAttachment)
          setCanvasDocKey((k) => k + 1)
        }
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      }

      if (activeChatId) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: crypto.randomUUID(),
                      role: 'assistant' as const,
                      content: displayText,
                      timestamp: Date.now(),
                      document: docAttachment,
                      agentId: payload.agentId || undefined,
                      agentName: payload.agentName || undefined,
                      agentColor: payload.agentColor || undefined,
                      delegationHints,
                    },
                  ],
                }
              : c
          )
        )
      } else {
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
          messages: [
            { id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() },
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: displayText,
              timestamp: Date.now(),
              delegationHints,
            },
          ],
          createdAt: Date.now(),
        }
        setChats((prev) => [newChat, ...prev])
        setActiveChatId(newChat.id)
      }

      if (createEventData) {
        const now = new Date()
        const start = createEventData.startTime
          ? new Date(createEventData.startTime).toISOString()
          : now.toISOString()
        const end = createEventData.endTime
          ? new Date(createEventData.endTime).toISOString()
          : new Date(now.getTime() + 3600000).toISOString()
        api.post('/calendar', {
          title: createEventData.title,
          startTime: start,
          endTime: end,
          isAllDay: false,
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast({ title: 'Event created', description: createEventData.title })
          })
          .catch(() => {
            toast({ title: 'Failed to create event', variant: 'destructive' })
          })
      }
      } // end for-each response
    },
    onError: () => {
      toast({ title: 'AI request failed', variant: 'destructive' })
      if (activeChatId) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: 'Sorry, I encountered an error. Please try again.',
                      timestamp: Date.now(),
                    },
                  ],
                }
              : c
          )
        )
      }
    },
  })

  const handleSend = useCallback(() => {
    const msg = input.trim()
    if (!msg || chatMutation.isPending) return

    /**
     * Agent intent detection: if the user says "navigate to google and ..." or
     * uses an explicit @agent prefix, route to the agent runner instead of
     * regular chat. This lets the same composer drive both Nexus chat and
     * Nexus Agent Mode without a mode toggle UI.
     */
    const explicit = userExplicitlyRequestsAgent(msg)
    const intent = detectAgentIntent(msg)
    if (explicit || intent.isAgentIntent) {
      const goal = explicit ? msg.replace(/^\s*@(agent|browser|browse|nexus-agent)\s*:?\s*/i, '').trim() : msg
      if (goal.length >= 6) {
        setInput('')
        startAgentRun.mutate(
          { goal, projectId: selectedProjectId },
          {
            onSuccess: ({ runId, runnerHandoff, isByok, provider }) => {
              setSelectedAgentRunId(runId)
              toast({
                title: 'Nexus Agent started',
                description: `Using ${provider}${isByok ? ' (your key)' : ' (free)'}.${runnerHandoff === 'unreachable' ? ' Runner offline — queued.' : ''}`,
              })
            },
            onError: (e: unknown) => {
              toast({ title: 'Agent run failed', description: e instanceof Error ? e.message : 'unknown', variant: 'destructive' })
            },
          },
        )
        return
      }
    }

    /**
     * Build the attachment payload for this turn:
     *   - Any explicitly staged user attachments
     *   - Plus the currently-open canvas doc (auto-attached as modify-target so
     *     "make this more formal" / "shorten" / etc. picks up update_document
     *     without the user re-pasting).
     * Dedupe by (name, mode) so an explicit modify-mode upload of the same doc
     *   doesn't double-include.
     */
    const turnAttachments: AttachmentForServer[] = attachmentsForServer(attachments).slice()
    if (canvasDoc) {
      const alreadyHaveModifyTarget = turnAttachments.some(
        (a) => a.mode === 'modify' && a.name === canvasDoc.title,
      )
      if (!alreadyHaveModifyTarget) {
        turnAttachments.push({
          name: canvasDoc.title || 'Open canvas',
          mimeType: 'text/markdown',
          content: canvasDoc.content,
          mode: 'modify',
        })
      }
    }

    if (!activeChatId) {
      const newChat: Chat = {
        id: crypto.randomUUID(),
        title: msg.slice(0, 30) + (msg.length > 30 ? '...' : ''),
        messages: [
          { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: Date.now() },
        ],
        createdAt: Date.now(),
      }
      setChats((prev) => [newChat, ...prev])
      setActiveChatId(newChat.id)
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: Date.now() },
                ],
              }
            : c
        )
      )
    }
    setInput('')
    // Clear staged attachments only if this turn actually carried any —
    // the open canvas stays attached across turns (that's the whole point of "modify in place").
    if (attachments.length > 0) clearAttachments()
    chatMutation.mutate({ message: msg, attachments: turnAttachments })
  }, [input, chatMutation, activeChatId, attachments, canvasDoc, clearAttachments, selectedProjectId, startAgentRun, toast])

  const handleNewChat = useCallback(() => {
    setActiveChatId(null)
    setInput('')
  }, [])

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    if (activeChatId === id) {
      setActiveChatId(chats.find((c) => c.id !== id)?.id ?? null)
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({ title: 'Copied to clipboard' })
  }

  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    if (!activeChatId) return
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, feedback } : m
              ),
            }
          : c
      )
    )
  }

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast({ title: 'Speech recognition not supported', variant: 'destructive' })
      return
    }
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    rec.start()
    recognitionRef.current = rec
    setIsListening(true)
  }

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
  }

  const setMobileToolbar = useSetAiPageMobileChatsToolbar()

  const mobileChatsTopBar = useMemo(
    () => (
      <div className="flex w-full shrink-0 items-center gap-2 px-3 py-2.5 backdrop-blur-sm">
        <button
          type="button"
          className="shrink-0 rounded-lg border border-gray-700/90 bg-[#1a1d26] px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-800/80"
          onClick={() => setMobileChatsOpen(true)}
        >
          Chats
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {!activeChat ? 'Nexus AI' : activeChat.title?.trim() || 'New chat'}
          </p>
          <p className="text-[10px] text-gray-500">Nexus</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          onClick={handleNewChat}
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    ),
    [activeChat, handleNewChat]
  )

  useEffect(() => {
    if (!setMobileToolbar) return
    setMobileToolbar(mobileChatsTopBar)
    return () => setMobileToolbar(null)
  }, [setMobileToolbar, mobileChatsTopBar])

  return (
    <DashboardLayout>
    <div
      className="relative flex min-h-0 flex-1 flex-col gap-0 lg:h-full lg:flex-row lg:items-stretch"
      data-testid="appai-page-root"
      {...rootDragHandlers}
    >
      {hiddenInput}
      <AppAiDropzoneOverlay mode={dragMode} onModeHover={setDragMode} />
      <div className="flex min-h-0 flex-1 flex-col min-w-0">
        {setMobileToolbar === null ? (
          <div className="flex shrink-0 border-b border-gray-800/90 bg-[#101218]/95 lg:hidden">
            {mobileChatsTopBar}
          </div>
        ) : null}

        {activeChat?.type === 'group' && activeChat.agents && (
          <div className="px-3 md:px-6 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap">
            <Users className="w-3.5 h-3.5 text-gray-500" />
            {activeChat.agents.map((id) => {
              const a = getAgentPersona(id);
              return a ? (
                <span key={id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ backgroundColor: a.color + '15', borderColor: a.color + '30', color: a.color }}>
                  <span>{a.icon}</span> {a.name}
                </span>
              ) : null;
            })}
            <span className="text-xs text-gray-500 ml-auto">Use @name to direct a message</span>
          </div>
        )}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 md:px-6 py-4 pb-8 space-y-4"
        >
          {!activeChat && (
            <div className="flex flex-col items-center justify-center min-h-[42vh] text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Nexus AI</h2>
              <p className="text-gray-400 max-w-md mb-6">
                Create documents, manage tasks, schedule events, or ask me anything. I can generate letters, invoices, spreadsheets, and more.
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button onClick={handleNewChat} className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" /> New Chat
                </Button>
                <button
                  onClick={() => setShowAgentPicker(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1e2128] border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
                >
                  <Users className="w-4 h-4" /> Group Chat
                </button>
              </div>
              <p className="hidden md:block text-xs text-gray-500 max-w-md mt-6 text-center leading-snug">
                <span className="text-cyan-300/90">Voice</span> opens the animated orb and HUD.{' '}
                <span className="text-gray-400">Call Nexus</span> opens the classic waveform console. Sign in for Nexus tools.
              </p>
              <p className="md:hidden text-[11px] text-gray-500 max-w-md mt-4 text-center leading-snug">
                <span className="text-cyan-300/90">Voice</span> = orb · <span className="text-gray-400">Call</span> = console. Sign in for tools.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={openClassicVoice}
                  aria-label="Call Nexus — full voice session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Call Nexus
                </button>
                <button
                  type="button"
                  data-testid="nexus-app-ai-open-immersive-voice"
                  onClick={openVoice}
                  aria-label="Voice — conversational AI (live speech and replies)"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    'text-cyan-100 bg-gradient-to-r from-violet-600/35 to-cyan-600/35 border-cyan-500/25',
                    'hover:from-violet-500/45 hover:to-cyan-500/45 hover:border-cyan-400/35',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d12]'
                  )}
                >
                  <AudioWaveform className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Voice
                </button>
              </div>
            </div>
          )}
          {activeChat && activeChat.messages.length === 0 && !chatMutation.isPending && (
            <div className="flex min-h-[min(18rem,48dvh)] flex-1 flex-col items-center justify-center px-4 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border border-purple-500/25 flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-purple-300/90" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                {activeChat.title?.trim() ? activeChat.title : 'New chat'}
              </h2>
              <p className="text-gray-400 max-w-md mb-6 text-sm">
                This thread has no messages yet. Use the bar below to type, or open voice again.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={openClassicVoice}
                  aria-label="Call Nexus — full voice session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Call Nexus
                </button>
                <button
                  type="button"
                  data-testid="nexus-app-ai-open-immersive-voice"
                  onClick={openVoice}
                  aria-label="Voice — conversational AI (live speech and replies)"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    'text-cyan-100 bg-gradient-to-r from-violet-600/35 to-cyan-600/35 border-cyan-500/25',
                    'hover:from-violet-500/45 hover:to-cyan-500/45 hover:border-cyan-400/35',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d12]'
                  )}
                >
                  <AudioWaveform className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Voice
                </button>
              </div>
            </div>
          )}
          {activeChat?.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[92%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-3',
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600/90 to-purple-700/90 text-white'
                    : 'bg-[#1e2128] border border-gray-800 text-gray-200'
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 shrink-0 text-purple-200" />
                  ) : msg.agentColor ? (
                    <span className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: msg.agentColor }}>
                      {(msg.agentName || 'N')[0]}
                    </span>
                  ) : (
                    <Bot className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  )}
                  <span className="text-xs font-medium" style={msg.role === 'assistant' && msg.agentColor ? { color: msg.agentColor } : undefined}>
                    {msg.role === 'user' ? 'You' : (msg.agentName || 'Nexus')}
                  </span>
                </div>
                <div className="text-sm leading-relaxed">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    simpleMarkdown(msg.content)
                  )}
                </div>
                {msg.role === 'assistant' && msg.delegationHints && msg.delegationHints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Delegation">
                    {msg.delegationHints.map((h) => (
                      <span
                        key={h.id}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-medium text-gray-400"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: h.color }} aria-hidden />
                        via {h.label}
                      </span>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-2 pt-2 border-t border-gray-700/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-gray-300"
                      onClick={() => handleCopy(msg.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6 text-gray-500 hover:text-gray-300', msg.feedback === 'up' && 'text-green-500')}
                      onClick={() => handleFeedback(msg.id, 'up')}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6 text-gray-500 hover:text-gray-300', msg.feedback === 'down' && 'text-red-500')}
                      onClick={() => handleFeedback(msg.id, 'down')}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {msg.document && (
                  <button
                    className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/40 transition-all text-xs font-medium"
                    onClick={() => setCanvasDoc({
                      title: msg.document!.title,
                      content: msg.document!.content,
                      format: msg.document!.format,
                    })}
                  >
                    <FileText className="w-3 h-3" /> Open &ldquo;{msg.document.title}&rdquo;
                  </button>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && activeChat && (
            <div className="flex gap-3 justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#1e2128] border border-gray-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Nexus</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Composer: compact field (Slack/Teams-style density); touch targets ≥44px on narrow viewports (WCAG 2.5.5). */}
        <div className="shrink-0 border-t border-gray-800/90 bg-[#0a0b10]/95 px-3 py-1.5 md:px-4 md:py-1.5">
          <div className="mx-auto max-w-3xl space-y-1.5">
            <AppAiAttachmentsBar
              attachments={attachments}
              onRemove={removeAttachment}
              onAttachClick={() => onAttachClick('reference')}
            />
            <div className="hidden md:flex flex-wrap items-center justify-between gap-1.5">
              <details className="group min-w-0 flex-1">
                <summary className="cursor-pointer list-none text-[10px] leading-tight text-gray-500 [&::-webkit-details-marker]:hidden">
                  <span className="text-gray-400 underline decoration-gray-600 underline-offset-2 group-open:text-gray-300">
                    Voice, Call Nexus & mic
                  </span>
                  <span className="ml-1 text-gray-600">— how it works</span>
                </summary>
                <p className="mt-1.5 max-w-prose text-[11px] leading-relaxed text-gray-500">
                  <span className="text-gray-400">Voice</span> opens the immersive orb (rings + artifact rail).{' '}
                  <span className="text-gray-400">Call Nexus</span> is the classic waveform console. Sign in for Nexus tools (documents, tasks, maps). The inline mic only fills this box. Phone calls use the icon inside the voice panel; nothing auto-dials.
                </p>
              </details>
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={openClassicVoice}
                  aria-label="Call Nexus — full voice session"
                  className="inline-flex items-center gap-0.5 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 transition-all hover:border-green-400/35 hover:bg-green-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                >
                  <Phone className="h-3 w-3 shrink-0" aria-hidden />
                  Call
                </button>
                <button
                  type="button"
                  data-testid="nexus-app-ai-open-immersive-voice"
                  onClick={openVoice}
                  aria-label="Voice — conversational AI (live speech and replies)"
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all',
                    'border-cyan-500/25 bg-gradient-to-r from-violet-600/35 to-cyan-600/35 text-cyan-100',
                    'hover:border-cyan-400/35 hover:from-violet-500/45 hover:to-cyan-500/45',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d12]'
                  )}
                >
                  <AudioWaveform className="h-3 w-3 shrink-0" aria-hidden />
                  Voice
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 md:hidden">
              <p className="text-[10px] leading-tight text-gray-500">
                {showMobileFooterVoice
                  ? 'Mic adds text. Voice and Call open full sessions.'
                  : 'Mic adds text. Use Voice or Call in the area above.'}
              </p>
              <details className="rounded-md border border-gray-800/80 bg-[#12141f]/80">
                <summary className="cursor-pointer list-none px-2 py-1.5 text-[10px] font-medium text-gray-400 [&::-webkit-details-marker]:hidden">
                  Voice vs Call · sign-in · mic
                </summary>
                <div className="space-y-1 border-t border-gray-800/70 px-2 py-1.5 text-[10px] leading-relaxed text-gray-500">
                  <p>
                    <span className="text-gray-400">Voice</span> opens the immersive orb (rings + artifact rail).{' '}
                    <span className="text-gray-400">Call Nexus</span> opens the classic waveform console.
                  </p>
                  <p>
                    Sign in for Nexus tools (documents, tasks, maps). The inline mic only dictates into this box. Phone calls use the icon inside the voice panel; nothing auto-dials.
                  </p>
                </div>
              </details>
              {showMobileFooterVoice && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openClassicVoice}
                    aria-label="Call Nexus — full voice session"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    Call Nexus
                  </button>
                  <button
                    type="button"
                    data-testid="nexus-app-ai-open-immersive-voice-footer-mobile"
                    onClick={openVoice}
                    aria-label="Voice — conversational AI (live speech and replies)"
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      'text-cyan-100 bg-gradient-to-r from-violet-600/35 to-cyan-600/35 border-cyan-500/25',
                      'hover:from-violet-500/45 hover:to-cyan-500/45 hover:border-cyan-400/35',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d12]'
                    )}
                  >
                    <AudioWaveform className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    Voice
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-end gap-1.5">
              <div
                className={cn(
                  'flex min-h-0 flex-1 items-stretch rounded-lg border bg-[#12131a] shadow-inner transition-all duration-200',
                  isListening
                    ? 'border-violet-400/35 ring-1 ring-violet-500/20'
                    : 'border-gray-700/80 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/10'
                )}
              >
                <textarea
                  placeholder={isListening ? 'Listening…' : 'Message Nexus…'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={scrollMessagesToBottom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={chatMutation.isPending}
                  rows={1}
                  className="max-h-24 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13px] leading-snug text-white placeholder:text-gray-500 focus:outline-none sm:min-h-[2.25rem] sm:py-1.5"
                  style={{ height: 'auto', minHeight: '2.25rem' }}
                  onInput={(e) => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = `${Math.min(t.scrollHeight, 96)}px`
                  }}
                  aria-label="Message to Nexus"
                />
                <div className="flex shrink-0 items-stretch pr-1">
                  <button
                    type="button"
                    aria-pressed={isListening}
                    aria-label={isListening ? 'Stop dictation' : 'Dictate with microphone'}
                    title={isListening ? 'Stop dictation' : 'Dictate (speech to text)'}
                    onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                    className={cn(
                      'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-all sm:h-8 sm:min-h-0 sm:min-w-0 sm:w-8',
                      isListening
                        ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/35'
                        : 'text-gray-400 hover:bg-violet-500/10 hover:text-violet-200 active:bg-violet-500/15'
                    )}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <Mic className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSend}
                disabled={chatMutation.isPending || !input.trim()}
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border-0 bg-gradient-to-br from-violet-600 to-cyan-600 p-0 text-white shadow-sm shadow-violet-950/20 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 sm:h-8 sm:min-h-0 sm:min-w-0 sm:w-8"
                aria-label="Send message"
              >
                <Send className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {canvasDoc ? (
        <DocumentCanvas
          key={canvasDocKey}
          title={canvasDoc.title}
          content={canvasDoc.content}
          format={canvasDoc.format}
          onClose={() => setCanvasDoc(null)}
        />
      ) : (
        <AppAiSidebarPanel
          chats={chats.map((c) => ({ id: c.id, title: c.title, type: c.type, agents: c.agents }))}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          selectedAgentRunId={selectedAgentRunId}
          onSelectAgentRun={setSelectedAgentRunId}
          onNewAgentRun={() => {
            const goal = window.prompt('What should Nexus do? (e.g. "find me 3 articles about energy-aware scheduling")')
            if (!goal || goal.trim().length < 6) return
            startAgentRun.mutate(
              { goal: goal.trim(), projectId: selectedProjectId },
              {
                onSuccess: ({ runId, runnerHandoff }) => {
                  setSelectedAgentRunId(runId)
                  if (runnerHandoff === 'unreachable') {
                    toast({
                      title: 'Agent runtime not reachable',
                      description: 'Run is queued — bring up the agent runner per deploy/nexus-agent-runner/README.md to start it.',
                    })
                  }
                },
                onError: (e: unknown) => {
                  toast({
                    title: 'Agent run failed',
                    description: e instanceof Error ? e.message : 'unknown',
                    variant: 'destructive',
                  })
                },
              },
            )
          }}
        />
      )}
    </div>

    {/* Mobile Chats drawer — matches MobileNav “More” panel (backdrop + spring slide) */}
    <AnimatePresence>
      {mobileChatsOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileChatsOpen(false)}
            className="md:hidden fixed inset-0 z-[390] bg-black/72 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            data-testid="mobile-chat-sheet"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed left-0 top-0 bottom-0 z-[391] flex w-[min(88vw,300px)] flex-col overflow-hidden bg-[#0b0f16]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),8px_0_48px_rgba(0,0,0,0.65)] backdrop-blur-xl backdrop-saturate-150 border-r border-gray-700/75"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-800 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <img src={logoImage} alt="SyncScript" className="h-10 w-10 shrink-0 rounded-lg" width={40} height={40} />
                <div className="min-w-0">
                  <p className="font-semibold text-white">Chats</p>
                  <p className="truncate text-[11px] text-gray-500">Nexus threads</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  onClick={() => {
                    handleNewChat()
                    setMobileChatsOpen(false)
                  }}
                  aria-label="New chat"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileChatsOpen(false)}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  aria-label="Close chats"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="ambient-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {chats.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-500">No chats yet. Tap + to start.</p>
              ) : (
                <nav className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        'group flex items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm transition-all',
                        activeChatId === chat.id
                          ? 'border border-purple-500/35 bg-purple-500/10 text-purple-200 shadow-lg shadow-purple-900/20'
                          : 'cursor-pointer border border-transparent text-gray-200 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => {
                        setActiveChatId(chat.id)
                        setMobileChatsOpen(false)
                      }}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        {chat.type === 'group' ? (
                          <Users className="h-5 w-5 shrink-0 text-gray-400" />
                        ) : (
                          <MessageSquare className="h-5 w-5 shrink-0 text-gray-400" />
                        )}
                        <span className="truncate">{chat.title || 'New chat'}</span>
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-500 hover:bg-gray-800/50 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChat(chat.id)
                        }}
                        aria-label="Delete chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </nav>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Agent run stream — full overlay (z above sidebar+composer, below voice). Click X to close. */}
    {selectedAgentRunId && typeof document !== 'undefined' &&
      createPortal(
        <div
          className="fixed inset-0 z-[100015] bg-black/72 backdrop-blur-sm flex items-center justify-center p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Nexus Agent Run"
        >
          <div className="relative h-[min(90vh,860px)] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/12 shadow-[0_32px_120px_-24px_rgba(0,0,0,0.85)]">
            <AgentRunStream runId={selectedAgentRunId} onClose={() => setSelectedAgentRunId(null)} />
          </div>
        </div>,
        document.body,
      )}

    {showVoiceEngine &&
      typeof document !== 'undefined' &&
      createPortal(
        <VoiceDockedFrame
          docked={voiceDocked}
          agentStatus={dockedAgentStatus}
          onExpand={() => setSelectedAgentRunId(activeAgentRun?.id ?? null)}
        >
        <div
          data-testid={voiceImmersiveArt ? 'nexus-voice-immersive-overlay' : 'nexus-voice-classic-overlay'}
          data-voice-shell={voiceImmersiveArt ? 'immersive' : 'classic'}
          data-syncscript-build-sha={import.meta.env.VITE_BUILD_SHA ?? ''}
          className={cn(
            'h-full w-full overflow-hidden',
            voiceImmersiveArt
              ? 'bg-[#030206]'
              : 'bg-black/60 backdrop-blur-sm flex items-center justify-center p-3',
            voiceDocked && 'pointer-events-none' // dock click handled by frame; inner content is read-only while docked
          )}
        >
          <div
            className={cn(
              'relative min-h-0 overflow-hidden shadow-2xl',
              voiceImmersiveArt ? 'h-full w-full' : voiceDocked ? 'h-full w-full' : 'h-[80vh] w-full max-w-4xl rounded-2xl border border-gray-800 bg-[#13141a]'
            )}
          >
            <Suspense
              fallback={
                <div
                  className={cn(
                    'flex h-full min-h-[50dvh] w-full flex-col items-center justify-center gap-3 px-6',
                    voiceImmersiveArt ? 'bg-[#030206]' : 'bg-[#13141a]'
                  )}
                  role="status"
                  aria-live="polite"
                  data-testid="voice-engine-loading"
                >
                  <div className="h-14 w-14 animate-pulse rounded-full bg-gradient-to-br from-violet-500/40 to-cyan-500/30 ring-2 ring-cyan-400/20" />
                  <p className="text-sm text-slate-400">Opening voice…</p>
                </div>
              }
            >
              <VoiceConversationEngine
                key={voiceEngineMountKey}
                mode="fullscreen"
                embeddedInModal
                immersiveArt={voiceImmersiveArt}
                onClose={() => setShowVoiceEngine(false)}
                onMinimize={() => setShowVoiceEngine(false)}
              />
            </Suspense>
          </div>
        </div>
        </VoiceDockedFrame>,
        document.body
      )}

    {showAgentPicker && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#13141a] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h2 className="text-lg font-semibold text-white">Start Group Chat</h2>
              <p className="text-xs text-gray-400 mt-0.5">Select agents to invite to the conversation</p>
            </div>
            <button onClick={() => setShowAgentPicker(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh]">
            {PRESET_AGENTS.map((agent) => {
              const isSelected = (selectedGroupAgents || []).includes(agent.id);
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedGroupAgents((prev = []) =>
                      prev.includes(agent.id) ? prev.filter((id) => id !== agent.id) : [...prev, agent.id]
                    );
                  }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-[#1e2128] border-gray-800 hover:border-gray-700'
                  )}
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: agent.color + '20', border: `1px solid ${agent.color}40` }}>
                    {agent.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{agent.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{agent.specialty}</div>
                  </div>
                  {isSelected && (
                    <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {(selectedGroupAgents || []).length} agent{(selectedGroupAgents || []).length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => {
                const agents = selectedGroupAgents || [];
                if (agents.length === 0) return;
                if (!agents.includes('nexus')) agents.unshift('nexus');
                const newChat: Chat = {
                  id: crypto.randomUUID(),
                  title: `Group: ${agents.map((id) => getAgentName(id)).join(', ')}`,
                  messages: [],
                  createdAt: Date.now(),
                  type: 'group',
                  agents,
                };
                setChats((prev) => [newChat, ...prev]);
                setActiveChatId(newChat.id);
                setShowAgentPicker(false);
                setSelectedGroupAgents([]);
              }}
              disabled={(selectedGroupAgents || []).length === 0}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-colors disabled:opacity-40"
            >
              Start Group Chat
            </button>
          </div>
        </div>
      </div>
    )}

    </DashboardLayout>
  )
}
