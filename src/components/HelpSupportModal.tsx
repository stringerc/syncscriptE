import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Book, MessageCircle, Mail, ExternalLink, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { navigationLinks } from '../utils/navigation';

interface HelpSupportModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpSupportModal({ open, onClose }: HelpSupportModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!subject.trim() || !message.trim() || !email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Mock submit
    toast.success('Support request submitted', {
      description: 'Our team will get back to you within 24 hours'
    });
    
    // Reset form
    setSubject('');
    setCategory('general');
    setMessage('');
    setEmail('');
    
    // Close modal after short delay
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1e2128] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-6 border-b border-gray-800 bg-gradient-to-br from-teal-600/10 to-cyan-600/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl text-white">Help & Support</h2>
                <p className="text-sm text-gray-400">We're here to help you succeed</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg text-white mb-3">Quick Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <a
                  href={navigationLinks.external.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#252830] border border-gray-700 rounded-lg hover:border-teal-600/50 transition-colors group"
                >
                  <Book className="w-5 h-5 text-teal-400" />
                  <div className="flex-1">
                    <p className="text-sm text-white group-hover:text-teal-400 transition-colors">Documentation</p>
                    <p className="text-xs text-gray-400">Guides & tutorials</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-teal-400 transition-colors" />
                </a>

                <a
                  href={navigationLinks.external.support}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#252830] border border-gray-700 rounded-lg hover:border-purple-600/50 transition-colors group"
                >
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm text-white group-hover:text-purple-400 transition-colors">Community</p>
                    <p className="text-xs text-gray-400">Ask the community</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </a>

                <button
                  onClick={() => window.open('mailto:support@syncscript.com', '_blank')}
                  className="flex items-center gap-3 p-4 bg-[#252830] border border-gray-700 rounded-lg hover:border-blue-600/50 transition-colors group text-left"
                >
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div className="flex-1">
                    <p className="text-sm text-white group-hover:text-blue-400 transition-colors">Email Us</p>
                    <p className="text-xs text-gray-400">Direct support</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-lg text-white mb-3">Contact Support</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-white">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-[#1a1c20] border-gray-800 mt-1"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category" className="text-white">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#1a1c20] border-gray-800 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Question</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing & Plans</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="bg-[#1a1c20] border-gray-800 mt-1"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message" className="text-white">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please provide details about your question or issue..."
                    rows={5}
                    className="bg-[#1a1c20] border-gray-800 mt-1 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/1000 characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </form>
            </div>

            {/* Response Time Notice */}
            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Response Time:</strong> We typically respond within 24 hours during business days. 
                For urgent issues, please mark your request as "Technical Issue" or reach out via live chat.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
