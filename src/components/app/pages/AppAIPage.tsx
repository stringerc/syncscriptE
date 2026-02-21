import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { api } from '@/lib/railway-api'
import { useToast } from '@/hooks/use-app-toast'
import { cn } from '@/lib/utils'
import {
  Send,
  Plus,
  Trash2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Mic,
  MicOff,
  MessageSquare,
  Sparkles,
} from 'lucide-react'

const CHAT_STORAGE_KEY = 'syncscript-chats'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  feedback?: 'up' | 'down'
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
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
  const [chats, setChats] = useState<Chat[]>(loadChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(chats[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [capabilitiesOpen, setCapabilitiesOpen] = useState(true)
  const [isListening, setIsListening] = useState(false)
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
      const res = await api.post('/ai/chat', { message })
      return res.data
    },
    onSuccess: (data: unknown, message) => {
      const payload = (data as { data?: { reply?: string } })?.data ?? data
      const reply = (payload as { reply?: string })?.reply ?? (typeof payload === 'string' ? payload : '')
      const { displayText, createEventData } = parseAIResponse(reply)

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
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['events'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          toast({ title: 'Event created', description: createEventData!.title })
        }).catch(() => {
          toast({ title: 'Failed to create event', variant: 'destructive' })
        })
      }
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
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className={cn('flex-1 flex flex-col min-w-0', sidebarOpen && 'lg:mr-80')}>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {!activeChat && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">AI Assistant</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Start a new chat or select one from the sidebar. Ask me to schedule events, manage tasks, or plan your day.
              </p>
              <Button onClick={handleNewChat}>
                <Plus className="w-4 h-4 mr-2" /> New Chat
              </Button>
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
                  'max-w-[85%] rounded-lg px-4 py-2',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 shrink-0" />
                  ) : (
                    <Bot className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-xs opacity-80">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
                <div className="text-sm">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    simpleMarkdown(msg.content)
                  )}
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(msg.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6', msg.feedback === 'up' && 'text-green-600')}
                      onClick={() => handleFeedback(msg.id, 'up')}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6', msg.feedback === 'down' && 'text-red-600')}
                      onClick={() => handleFeedback(msg.id, 'down')}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatMutation.isPending && activeChat && (
            <div className="flex gap-3 justify-start">
              <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs opacity-80">Thinking...</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={chatMutation.isPending}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button onClick={handleSend} disabled={chatMutation.isPending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'fixed lg:relative inset-y-0 right-0 z-40 w-80 border-l bg-background flex flex-col',
          sidebarOpen ? 'flex' : 'hidden lg:hidden'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Chats</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handleNewChat}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                'flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted',
                activeChatId === chat.id && 'bg-muted'
              )}
              onClick={() => setActiveChatId(chat.id)}
            >
              <span className="truncate flex-1 text-sm">{chat.title || 'New chat'}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChat(chat.id)
                }}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Collapsible open={capabilitiesOpen} onOpenChange={setCapabilitiesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Capabilities
                </span>
                {capabilitiesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">What I can do</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3 text-xs text-muted-foreground space-y-1">
                  <p>• Schedule events and add to calendar</p>
                  <p>• Create and manage tasks</p>
                  <p>• Suggest plans based on your energy</p>
                  <p>• Budget-aware recommendations</p>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
