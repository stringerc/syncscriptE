import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '../../../components/layout/DashboardLayout'
import {} from '@/components/ui/collapsible'
import { api } from '@/lib/railway-api'
import { useToast } from '@/hooks/use-app-toast'
import { cn } from '@/lib/utils'
import { useAuth } from '../../../contexts/AuthContext'
import { useNexusPrivateContext } from '../../../hooks/useNexusPrivateContext'
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
import { VoiceConversationEngine } from '../../../components/VoiceConversationEngine'
import { PRESET_AGENTS, getAgentPersona, getAgentColor, getAgentName, routeToAgents, type AgentPersona } from '../../../utils/agent-personas'
import { getStoredNexusPersonaMode } from '../../../utils/nexus-persona-preference'

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
  /** Voice = immersive orb UI; Call Nexus = classic waveform + metrics. */
  const [voiceImmersiveArt, setVoiceImmersiveArt] = useState(false)
  const [showAgentPicker, setShowAgentPicker] = useState(false)
  const [selectedGroupAgents, setSelectedGroupAgents] = useState<string[]>([])
  const [canvasDoc, setCanvasDoc] = useState<{ title: string; content: string; format?: 'document' | 'spreadsheet' | 'invoice' } | null>(null)
  const [canvasDocKey, setCanvasDocKey] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const activeChat = chats.find((c) => c.id === activeChatId)

  useEffect(() => {
    saveChats(chats)
  }, [chats])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeChat?.messages])

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
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

      const results: any[] = [];
      for (const agentId of targetAgentIds) {
        const persona = getAgentPersona(agentId);
        const res = await fetch('/api/ai/nexus-user', {
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
    onSuccess: (data: unknown, message) => {
      const responses = Array.isArray(data) ? data : [data];

      for (const payload of responses) {
      const reply =
        payload?.content ||
        payload?.reply ||
        payload?.data?.reply ||
        (typeof payload === 'string' ? payload : '')
      const { displayText, createEventData } = parseAIResponse(reply)

      let docAttachment: { title: string; content: string; format?: 'document' | 'spreadsheet' | 'invoice' } | undefined

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
          (t: { ok?: boolean; tool?: string; detail?: any }) => t?.ok && t.tool === 'create_document' && t.detail,
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
    chatMutation.mutate(msg)
  }, [input, chatMutation, activeChatId])

  const handleNewChat = () => {
    setActiveChatId(null)
    setInput('')
  }

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

  return (
    <DashboardLayout>
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat?.type === 'group' && activeChat.agents && (
          <div className="px-6 py-2 border-b border-gray-800 flex items-center gap-2 flex-wrap">
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
          className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4"
        >
          {!activeChat && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
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
              <p className="text-xs text-gray-500 max-w-md mt-6 text-center leading-snug">
                The <span className="text-gray-400">orb</span> appears after you tap <span className="text-cyan-300/90">Voice</span> (full screen). <span className="text-gray-400">Call Nexus</span> uses the classic console. Sign in for Nexus tools.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setVoiceImmersiveArt(false)
                    setShowVoiceEngine(true)
                  }}
                  aria-label="Call Nexus — full voice session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Call Nexus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceImmersiveArt(true)
                    setShowVoiceEngine(true)
                  }}
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
        <div className="px-3 md:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-800/90 bg-gradient-to-t from-[#0c0d12] to-transparent">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 leading-snug">
                <span className="text-gray-400">Voice</span> opens the <span className="text-cyan-300/90">immersive orb</span> (full-screen, artifact rail).{' '}
                <span className="text-gray-400">Call Nexus</span> opens the classic waveform console. Both need you{' '}
                <span className="text-gray-300">signed in</span> for Nexus tools (documents, tasks, maps). The{' '}
                <span className="text-gray-400">inline mic</span> only dictates into the text box. Phone calls: phone icon inside the panel; nothing auto-dials.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVoiceImmersiveArt(false)
                    setShowVoiceEngine(true)
                  }}
                  aria-label="Call Nexus — full voice session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/40"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  Call Nexus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceImmersiveArt(true)
                    setShowVoiceEngine(true)
                  }}
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
            <div className="flex gap-2 items-end">
              <div
                className={cn(
                  'flex-1 flex items-end min-w-0 rounded-2xl border bg-[#12131a] shadow-inner transition-all duration-200',
                  isListening
                    ? 'border-violet-400/35 ring-1 ring-violet-500/20'
                    : 'border-gray-700/90 focus-within:border-violet-500/45 focus-within:ring-1 focus-within:ring-violet-500/15'
                )}
              >
                <textarea
                  placeholder={isListening ? 'Listening… speak now' : 'Type a message…'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={chatMutation.isPending}
                  rows={1}
                  className="flex-1 min-w-0 resize-none bg-transparent text-white placeholder:text-gray-500 focus:outline-none text-sm leading-relaxed max-h-32 overflow-y-auto py-3 pl-4 pr-2"
                  style={{ height: 'auto', minHeight: '2.75rem' }}
                  onInput={(e) => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = Math.min(t.scrollHeight, 128) + 'px'
                  }}
                  aria-label="Message to Nexus"
                />
                <div className="shrink-0 flex items-center py-2 pr-2">
                  <button
                    type="button"
                    aria-pressed={isListening}
                    aria-label={isListening ? 'Stop dictation' : 'Dictate with microphone'}
                    title={isListening ? 'Stop dictation' : 'Dictate (speech to text)'}
                    onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                    className={cn(
                      'h-11 w-11 rounded-xl flex items-center justify-center transition-all',
                      isListening
                        ? 'bg-red-500/20 text-red-300 ring-1 ring-red-400/35 shadow-[0_0_20px_-4px_rgba(248,113,113,0.45)]'
                        : 'text-gray-400 hover:text-violet-200 hover:bg-violet-500/10 active:bg-violet-500/15'
                    )}
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSend}
                disabled={chatMutation.isPending || !input.trim()}
                className="h-[3.25rem] min-w-[3.25rem] px-4 bg-gradient-to-br from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white border-0 rounded-2xl shadow-lg shadow-violet-950/30 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
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
        <div className="hidden lg:flex flex-col w-64 border-l border-gray-800 shrink-0">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">Chats</h3>
            <button
              onClick={handleNewChat}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors',
                  activeChatId === chat.id
                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                )}
                onClick={() => setActiveChatId(chat.id)}
              >
                {chat.type === 'group' ? <Users className="w-3 h-3 shrink-0" /> : <MessageSquare className="w-3 h-3 shrink-0" />}
                <span className="truncate flex-1">{chat.title || 'New chat'}</span>
                <button
                  className="h-5 w-5 shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteChat(chat.id)
                  }}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {showVoiceEngine && (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          voiceImmersiveArt ? 'bg-[#030206]' : 'bg-black/60 backdrop-blur-sm'
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden shadow-2xl',
            voiceImmersiveArt
              ? 'h-full w-full'
              : 'h-[80vh] w-full max-w-4xl rounded-2xl border border-gray-800 bg-[#13141a]'
          )}
        >
          <button
            type="button"
            onClick={() => setShowVoiceEngine(false)}
            className={cn(
              'absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
              voiceImmersiveArt
                ? 'text-white/80 hover:bg-white/10 hover:text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
            aria-label="Close voice session"
          >
            <X className="h-4 w-4" />
          </button>
          <VoiceConversationEngine
            mode="fullscreen"
            embeddedInModal
            immersiveArt={voiceImmersiveArt}
            onClose={() => setShowVoiceEngine(false)}
            onMinimize={() => setShowVoiceEngine(false)}
          />
        </div>
      </div>
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
