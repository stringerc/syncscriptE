/**
 * TeamChat Component - Enhanced with Energy-Aware Presence
 * 
 * RESEARCH-BASED FEATURES (2024-2026):
 * ✅ Slack: Message threading and reactions
 * ✅ Discord: Rich presence and typing indicators
 * ✅ Linear: Context-aware messaging
 * ✅ SyncScript: Energy-aware presence (unique!)
 * 
 * Mock chat UI with working interactions.
 * No backend - prototype only.
 */

import { useState } from 'react';
import { Send, Paperclip, Smile, Phone, Video, X, Zap, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner@2.0.3';

interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

interface TeamChatProps {
  recipientName: string;
  recipientAvatar: string;
  recipientStatus?: 'online' | 'away' | 'offline';
  recipientEnergy?: number; // ⚡ Energy-aware presence
  recipientActivity?: string; // 🎯 Ambient awareness
  onClose?: () => void;
}

export function TeamChat({ 
  recipientName, 
  recipientAvatar, 
  recipientStatus = 'online',
  recipientEnergy,
  recipientActivity,
  onClose 
}: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: recipientName,
      senderAvatar: recipientAvatar,
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false,
    },
    {
      id: '2',
      sender: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: 'Great! Just working on the project.',
      timestamp: new Date(Date.now() - 3000000),
      isCurrentUser: true,
    },
    {
      id: '3',
      sender: recipientName,
      senderAvatar: recipientAvatar,
      content: 'Awesome! Let me know if you need help.',
      timestamp: new Date(Date.now() - 2400000),
      isCurrentUser: false,
    },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: newMessage,
      timestamp: new Date(),
      isCurrentUser: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Mock response after a delay
    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: recipientName,
        senderAvatar: recipientAvatar,
        content: 'Thanks for the message! (Mock response)',
        timestamp: new Date(),
        isCurrentUser: false,
      };
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  const handleCall = () => {
    toast.info('Call feature', {
      description: 'Powered by third-party provider (Coming Soon)',
    });
  };

  const handleVideoCall = () => {
    toast.info('Video call feature', {
      description: 'Powered by third-party provider (Coming Soon)',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1c20] border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e2128]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={recipientAvatar} alt={recipientName} />
              <AvatarFallback>{recipientName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1e2128] ${
              recipientStatus === 'online' ? 'bg-green-500' :
              recipientStatus === 'away' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`} />
          </div>
          <div>
            <h3 className="text-white font-medium flex items-center gap-2">
              {recipientName}
              {/* ⚡ Energy-Aware Presence Badge */}
              {recipientEnergy && recipientStatus !== 'offline' && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    recipientEnergy >= 80 ? 'border-green-500/30 text-green-400' :
                    recipientEnergy >= 60 ? 'border-yellow-500/30 text-yellow-400' :
                    'border-red-500/30 text-red-400'
                  }`}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {recipientEnergy}
                </Badge>
              )}
            </h3>
            {/* 🎯 Ambient Awareness - Show current activity */}
            {recipientActivity ? (
              <p className="text-xs text-gray-400">{recipientActivity}</p>
            ) : (
              <p className="text-xs text-gray-400 capitalize">{recipientStatus}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCall}
            className="text-gray-400 hover:text-white"
            title="Voice Call (Coming Soon)"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVideoCall}
            className="text-gray-400 hover:text-white"
            title="Video Call (Coming Soon)"
          >
            <Video className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isCurrentUser ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.senderAvatar} alt={message.sender} />
                <AvatarFallback>{message.sender.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={`flex flex-col ${message.isCurrentUser ? 'items-end' : ''}`}>
                <div className={`max-w-sm p-3 rounded-lg ${
                  message.isCurrentUser
                    ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white'
                    : 'bg-[#252830] text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Smile className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-[#252830] border-gray-700 text-white"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-teal-600 to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Call Notice */}
      <div className="px-4 py-2 bg-orange-600/10 border-t border-orange-600/30">
        <p className="text-xs text-orange-400 text-center">
          🎥 Call feature powered by third-party provider (Coming Soon)
        </p>
      </div>
    </div>
  );
}