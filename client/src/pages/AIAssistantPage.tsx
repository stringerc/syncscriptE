import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, User, Sparkles, Calendar, Copy, ThumbsUp, ThumbsDown, Volume2, Check, Mic, MicOff, X, ChevronDown, ChevronUp, Plus, Trash2, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function AIAssistantPage() {
  // Load chats from localStorage
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('syncscript-chats')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })

  // Current active chat
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    const saved = localStorage.getItem('syncscript-current-chat-id')
    return saved || ''
  })

  // Get current chat messages
  const currentChat = chats.find(chat => chat.id === currentChatId)
  const messages = currentChat?.messages || []

  // Initialize with default chat if none exist
  useEffect(() => {
    if (chats.length === 0) {
      const defaultChat: Chat = {
        id: 'default',
        title: 'New Chat',
        messages: [{
          id: '1',
          role: 'assistant',
          content: "Hello! I'm your SyncScript AI assistant. I can help you with task prioritization, scheduling suggestions, productivity tips, and more. What would you like to know?",
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setChats([defaultChat])
      setCurrentChatId('default')
    }
  }, [chats.length])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessages, setCopiedMessages] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({})
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [showAICapabilities, setShowAICapabilities] = useState(true)
  const [isAICapabilitiesCollapsed, setIsAICapabilitiesCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    localStorage.setItem('syncscript-chats', JSON.stringify(chats))
  }, [chats])

  // Save current chat ID to localStorage
  useEffect(() => {
    localStorage.setItem('syncscript-current-chat-id', currentChatId)
  }, [currentChatId])

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await api.post('/ai/chat', { message })
      return response.data
    },
    onSuccess: (data) => {
      // Extract the user-friendly message from the response
      const userMessageMatch = data.data.response.match(/\[USER_MESSAGE\](.*?)\[\/USER_MESSAGE\]/s)
      const displayMessage = userMessageMatch ? userMessageMatch[1].trim() : data.data.response
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: displayMessage,
        timestamp: data.data.timestamp
      }
      
      // Update the current chat with the new message
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              updatedAt: new Date().toISOString()
            }
          : chat
      ))
      setIsLoading(false)
      
      // Check if the response contains event creation instructions
      if (data.data.response.includes('ACTION:CREATE_EVENT')) {
        handleEventCreation(data.data.response)
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send message",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  })

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await api.post('/ai/create-event', eventData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({
        title: "Event Created!",
        description: "I've successfully added the event to your calendar."
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create event",
        variant: "destructive"
      })
    }
  })

  const handleEventCreation = (response: string) => {
    try {
        // Parse the new format with USER_MESSAGE and ACTION_DATA tags
        const userMessageMatch = response.match(/\[USER_MESSAGE\](.*?)\[\/USER_MESSAGE\]/s)
        const actionDataMatch = response.match(/\[ACTION_DATA\](.*?)\[\/ACTION_DATA\]/s)
        
        if (actionDataMatch) {
          // Extract the action data
          const actionData = actionDataMatch[1].trim()
          const parts = actionData.split('|')
          const eventData: any = {}
          
          console.log('Raw action data:', actionData)
          console.log('Parts after split:', parts)
        
        parts.forEach((part, index) => {
          console.log(`Processing part ${index}: "${part}"`)
          const colonIndex = part.indexOf(':')
          if (colonIndex > 0) {
            const key = part.substring(0, colonIndex)
            const value = part.substring(colonIndex + 1)
            console.log(`Parsing part: "${part}" -> key: "${key}", value: "${value}"`)
            
            if (key === 'TITLE') eventData.title = value
            if (key === 'DESCRIPTION') eventData.description = value
            if (key === 'START_TIME') eventData.startTime = value
            if (key === 'END_TIME') eventData.endTime = value
            if (key === 'LOCATION') {
              // Clean up the location value - remove any extra characters
              const cleanLocation = value.trim()
              console.log(`Setting location: "${value}" -> cleaned: "${cleanLocation}"`)
              eventData.location = cleanLocation
            }
          } else {
            console.log(`Skipping part (no colon): "${part}"`)
          }
        })
        
        if (eventData.title && eventData.startTime && eventData.endTime) {
          console.log('Raw AI response:', response)
          console.log('Parsed event data:', eventData)
          
          // Try to fix common date format issues
          let startTime = eventData.startTime
          let endTime = eventData.endTime
          
          // If the date doesn't have timezone info, treat as local time (don't add Z)
          // The AI should now generate local times without Z
          console.log('Processing times:', { startTime, endTime })
          
          // Validate and fix the date format
          const startDate = new Date(startTime)
          const endDate = new Date(endTime)
          
          console.log('Date parsing attempt:', {
            originalStartTime: eventData.startTime,
            originalEndTime: eventData.endTime,
            fixedStartTime: startTime,
            fixedEndTime: endTime,
            parsedStartDate: startDate,
            parsedEndDate: endDate,
            isValidStart: !isNaN(startDate.getTime()),
            isValidEnd: !isNaN(endDate.getTime()),
            startDateString: startDate.toString(),
            endDateString: endDate.toString(),
            startTimestamp: startDate.getTime(),
            endTimestamp: endDate.getTime()
          })
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            // Try alternative parsing methods
            const altStartDate = new Date(eventData.startTime.replace('T', ' '))
            const altEndDate = new Date(eventData.endTime.replace('T', ' '))
            
            console.log('Alternative parsing:', {
              altStartDate,
              altEndDate,
              isValidAltStart: !isNaN(altStartDate.getTime()),
              isValidAltEnd: !isNaN(altEndDate.getTime())
            })
            
            if (isNaN(altStartDate.getTime()) || isNaN(altEndDate.getTime())) {
              // Last resort: create a simple test event with current time + 1 hour
              console.log('All date parsing failed, creating fallback event')
              const now = new Date()
              const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
              
              eventData.startTime = now.toISOString()
              eventData.endTime = oneHourLater.toISOString()
              
              toast({
                title: "Warning",
                description: "Date parsing failed, created event for current time instead",
                variant: "destructive"
              })
            } else {
              // Use the alternative parsing
              eventData.startTime = altStartDate.toISOString()
              eventData.endTime = altEndDate.toISOString()
            }
          } else {
            // Convert to ISO string format
            eventData.startTime = startDate.toISOString()
            eventData.endTime = endDate.toISOString()
          }
          
          console.log('Creating event with final data:', eventData)
          createEventMutation.mutate(eventData)
        }
      }
    } catch (error) {
      console.error('Failed to parse event creation:', error)
      toast({
        title: "Error",
        description: "Failed to parse event creation request",
        variant: "destructive"
      })
    }
  }

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    // Update the current chat with the user message
    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            updatedAt: new Date().toISOString()
          }
        : chat
    ))
    
    setInputMessage('')
    setIsLoading(true)
    chatMutation.mutate(inputMessage)
  }

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessages(prev => new Set([...prev, messageId]))
      toast({
        title: "Copied!",
        description: "Message copied to clipboard"
      })
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newSet = new Set(prev)
          newSet.delete(messageId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive"
      })
    }
  }

  const handleAudioPlay = (content: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    } else {
      toast({
        title: "Not Supported",
        description: "Audio playback is not supported in this browser",
        variant: "destructive"
      })
    }
  }

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }))
    
    toast({
      title: type === 'up' ? "Thanks!" : "Feedback received",
      description: type === 'up' ? "We're glad this was helpful!" : "We'll use this feedback to improve"
    })
  }

  const handleSpeechToText = () => {
    if (!speechSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive"
      })
      return
    }

    if (isListening) {
      // Stop listening
      setIsListening(false)
      if (window.speechRecognition) {
        window.speechRecognition.stop()
      }
      return
    }

    // Start listening
    setIsListening(true)
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setIsListening(true)
      toast({
        title: "Listening...",
        description: "Speak your message"
      })
    }
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(prev => prev + transcript)
      setIsListening(false)
      
      toast({
        title: "Speech captured!",
        description: "Your speech has been converted to text"
      })
    }
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      let errorMessage = "Speech recognition failed"
      if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Please try again."
      } else if (event.error === 'not-allowed') {
        errorMessage = "Microphone access denied. Please allow microphone access."
      }
      
      toast({
        title: "Speech Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognition.start()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your SyncScript AI assistant. I can help you with task prioritization, scheduling suggestions, productivity tips, and more. What would you like to know?",
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setChats(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
    toast({
      title: "New Chat Created",
      description: "You can now start a new conversation."
    })
  }

  const deleteChat = (chatId: string) => {
    if (chats.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one chat.",
        variant: "destructive"
      })
      return
    }

    setChats(prev => {
      const newChats = prev.filter(chat => chat.id !== chatId)
      // If we're deleting the current chat, switch to the first remaining chat
      if (chatId === currentChatId) {
        setCurrentChatId(newChats[0].id)
      }
      return newChats
    })
    
    toast({
      title: "Chat Deleted",
      description: "The chat has been removed."
    })
  }

  const switchChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const updateChatTitle = (chatId: string, newTitle: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() }
        : chat
    ))
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSpeechSupported(!!SpeechRecognition)
  }, [])

  const quickPrompts = [
    "Help me prioritize my tasks",
    "Schedule an interview for tomorrow at 2pm",
    "How can I improve my productivity?",
    "Add a meeting with the team next Friday",
    "What should I focus on first?"
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Your intelligent productivity companion
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Chat Area */}
        <div className="flex-1">
        {/* Chat Interface */}
        <div>
          <Card className="min-h-[600px] max-h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Chat with AI</span>
                  </CardTitle>
                  <CardDescription>
                    Ask me anything about your tasks, schedule, or productivity
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewChat}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Chat</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                          
                          {/* Interaction buttons for all messages */}
                          <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border/50">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessages.has(message.id) ? (
                                <Check className="w-3 h-3 mr-1" />
                              ) : (
                                <Copy className="w-3 h-3 mr-1" />
                              )}
                              {copiedMessages.has(message.id) ? 'Copied' : 'Copy'}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleAudioPlay(message.content)}
                            >
                              <Volume2 className="w-3 h-3 mr-1" />
                              Audio
                            </Button>
                            
                            {/* Feedback buttons only for assistant messages */}
                            {message.role === 'assistant' && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-8 px-2 text-xs ${
                                    feedback[message.id] === 'up' ? 'text-green-600' : ''
                                  }`}
                                  onClick={() => handleFeedback(message.id, 'up')}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className={`h-8 px-2 text-xs ${
                                    feedback[message.id] === 'down' ? 'text-red-600' : ''
                                  }`}
                                  onClick={() => handleFeedback(message.id, 'down')}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-primary" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts - moved inside chat area */}
              {messages.length === 0 && (
                <div className="p-4 border-t">
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-foreground">Quick Prompts</h3>
                      <p className="text-sm text-muted-foreground">Click to start a conversation</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.map((prompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto p-3"
                          onClick={() => setInputMessage(prompt)}
                          disabled={isLoading}
                        >
                          <span className="text-sm">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your productivity..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  
                  {/* Speech-to-text button */}
                  {speechSupported && (
                    <Button
                      onClick={handleSpeechToText}
                      disabled={isLoading}
                      size="icon"
                      variant={isListening ? "destructive" : "outline"}
                      className={isListening ? "animate-pulse" : ""}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Speech status indicator */}
                {isListening && (
                  <div className="mt-2 text-center">
                    <div className="inline-flex items-center space-x-2 text-sm text-primary">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>Listening... Speak now</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        </div>

        {/* Sidebar */}
        <div className="w-72 lg:w-80 flex-shrink-0 hidden md:block space-y-4">
          {/* Chat Management */}
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chats
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewChat}
                  className="h-8 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    chat.id === currentChatId 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => switchChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {chat.messages.length > 1 
                        ? `${chat.messages.length - 1} messages`
                        : 'New chat'
                      }
                    </div>
                  </div>
                  {chats.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this chat?')) {
                          deleteChat(chat.id)
                        }
                      }}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          {showAICapabilities && (
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">AI Capabilities</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAICapabilitiesCollapsed(!isAICapabilitiesCollapsed)}
                      className="h-8 w-8 p-0"
                    >
                      {isAICapabilitiesCollapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAICapabilities(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!isAICapabilitiesCollapsed && (
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Task prioritization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Calendar event creation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Schedule optimization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Energy level analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Productivity tips</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Budget planning (coming soon)</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Show AI Capabilities Button */}
          {!showAICapabilities && (
            <div className="sticky top-6">
              <Button
                variant="outline"
                onClick={() => setShowAICapabilities(true)}
                className="w-full flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Show AI Capabilities</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat Management and AI Capabilities - appears below chat on small screens */}
      <div className="md:hidden mt-6 space-y-4">
        {/* Mobile Chat Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chats
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={createNewChat}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    chat.id === currentChatId 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => switchChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {chat.title}
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      {chat.messages.length > 1 
                        ? `${chat.messages.length - 1} messages`
                        : 'New chat'
                      }
                    </div>
                  </div>
                  {chats.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this chat?')) {
                          deleteChat(chat.id)
                        }
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobile AI Capabilities */}
        {showAICapabilities ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">AI Capabilities</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAICapabilitiesCollapsed(!isAICapabilitiesCollapsed)}
                    className="h-8 w-8 p-0"
                  >
                    {isAICapabilitiesCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAICapabilities(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {!isAICapabilitiesCollapsed && (
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Task prioritization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Calendar event creation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Schedule optimization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Energy level analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Productivity tips</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Budget planning (coming soon)</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAICapabilities(true)}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Show AI Capabilities</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
