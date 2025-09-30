import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'getting-started' | 'features' | 'calendar' | 'collaboration' | 'billing' | 'privacy'
}

const faqs: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-syncscript',
    question: 'What is SyncScript?',
    answer: 'SyncScript is an intelligent productivity platform that combines task management, calendar integration, AI-powered suggestions, and team collaboration. It helps you plan complex events with templates, track your energy levels, and stay organized with voice input and smart scheduling.',
    category: 'getting-started'
  },
  {
    id: 'how-to-get-started',
    question: 'How do I get started?',
    answer: 'Sign up with email or Google. Once logged in, create your first task or event. Connect your Google Calendar for automatic sync. Try the voice input feature by clicking the microphone icon in any notes field. Browse our template gallery for pre-made event plans!',
    category: 'getting-started'
  },
  {
    id: 'is-it-free',
    question: 'Is SyncScript free?',
    answer: 'Yes! SyncScript offers a generous free tier with all core features including tasks, events, calendar sync, templates, voice input, and team collaboration. Premium features like advanced analytics and cosmetic customization are coming soon.',
    category: 'getting-started'
  },

  // Features
  {
    id: 'voice-input',
    question: 'How does voice input work?',
    answer: 'Click and hold the microphone button in any notes or description field. Speak clearly, then release the button to see your transcript. You can edit the text after transcription. Voice input works in Chrome, Safari, and Edge on desktop and mobile.',
    category: 'features'
  },
  {
    id: 'templates',
    question: 'What are Templates and Scripts?',
    answer: 'Templates (Scripts) are reusable event plans. Create a complex event once (like "Wedding Planning" with all tasks), save it as a Script, then apply it to future events with one click. Browse our gallery for pre-made templates covering weddings, moves, launches, and more!',
    category: 'features'
  },
  {
    id: 'pinned-events',
    question: 'What are Pinned Events?',
    answer: 'Pin up to 5 events to your dashboard for quick access. Click the pin icon on any event to add it to your Pinned Events rail. Drag to reorder. Perfect for tracking your most important upcoming events!',
    category: 'features'
  },
  {
    id: 'energy-system',
    question: 'How does the Energy Engine work?',
    answer: 'The Energy Engine tracks your vitality based on completed tasks, daily challenges, and healthy behaviors. Complete challenges like "10-minute walk" or "meditation" to earn Energy Points (EP). Your energy level updates nightly and powers your achievement emblems!',
    category: 'features'
  },
  {
    id: 'resources',
    question: 'What are Resources?',
    answer: 'Every task can have Resources: links, files, images, and notes. Click the paperclip icon to add resources. Perfect for storing product links, inspiration images, booking confirmations, or research notes. Resources persist after task completion!',
    category: 'features'
  },

  // Calendar
  {
    id: 'calendar-sync',
    question: 'Which calendars can I connect?',
    answer: 'Currently, SyncScript supports Google Calendar with two-way sync. Your SyncScript events appear in Google Calendar, and Google events import to SyncScript. Outlook and Apple Calendar support are in development!',
    category: 'calendar'
  },
  {
    id: 'sync-direction',
    question: 'How does calendar sync work?',
    answer: 'Choose your sync direction: Import Only (Google → SyncScript), Export Only (SyncScript → Google), or Two-Way Sync (both directions). Changes sync automatically. You can manually sync anytime using the "Sync Now" button.',
    category: 'calendar'
  },
  {
    id: 'google-badge',
    question: 'What does the "G" badge mean?',
    answer: 'The "G" badge indicates an event was imported from Google Calendar. It appears on event cards in your dashboard and calendar view. These events stay synced with your Google Calendar.',
    category: 'calendar'
  },

  // Collaboration
  {
    id: 'projects',
    question: 'How do Projects work?',
    answer: 'Projects are shared workspaces for teams. Create a Project, invite members by email, assign tasks, and track progress together. Each Project has roles (Owner, Admin, Editor, Contributor, Viewer) with different permissions.',
    category: 'collaboration'
  },
  {
    id: 'friends',
    question: 'What is the Friends system?',
    answer: 'Add friends by email (they must accept). Friends are double-opt-in for privacy. View friend energy levels, send messages via daily challenges, and share your progress. Control visibility in Settings → Privacy.',
    category: 'collaboration'
  },
  {
    id: 'sharing',
    question: 'Can I share templates with others?',
    answer: 'Yes! You can share Scripts (templates) with friends or within Projects. When you share, others can apply your template to their own events. All shares respect privacy settings and require explicit consent.',
    category: 'collaboration'
  },

  // Billing
  {
    id: 'pricing',
    question: 'What will premium features cost?',
    answer: 'Premium features are coming soon! We\'re planning a cosmetic Season Pass system with themed emblems, animations, and sound packs. Core productivity features will remain free. Enterprise team plans will offer advanced analytics and admin controls.',
    category: 'billing'
  },

  // Privacy
  {
    id: 'data-privacy',
    question: 'How is my data protected?',
    answer: 'Your data is encrypted in transit (HTTPS) and at rest. We never sell your data. You can export or delete your data anytime from Settings → Privacy. Calendar tokens are stored securely. Read our full Privacy Policy for details.',
    category: 'privacy'
  },
  {
    id: 'data-export',
    question: 'Can I export my data?',
    answer: 'Yes! Go to Settings → Privacy → Export Data. You\'ll receive a JSON file with all your tasks, events, notes, and settings. Import this to another system or keep as a backup.',
    category: 'privacy'
  },
  {
    id: 'account-deletion',
    question: 'How do I delete my account?',
    answer: 'Go to Settings → Privacy → Delete Account. This permanently removes all your data including tasks, events, calendar links, and project memberships. This action cannot be undone. We\'ll send a confirmation email first.',
    category: 'privacy'
  }
]

const categories = [
  { id: 'all', name: 'All', icon: HelpCircle },
  { id: 'getting-started', name: 'Getting Started', icon: HelpCircle },
  { id: 'features', name: 'Features', icon: HelpCircle },
  { id: 'calendar', name: 'Calendar', icon: HelpCircle },
  { id: 'collaboration', name: 'Collaboration', icon: HelpCircle },
  { id: 'billing', name: 'Billing', icon: HelpCircle },
  { id: 'privacy', name: 'Privacy', icon: HelpCircle }
]

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-purple-200">
            Everything you need to know about SyncScript
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className={
                selectedCategory === category.id
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/20'
              }
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card className="bg-white/5 border-white/10 p-8 text-center">
              <p className="text-white/60">
                No FAQs found matching "{searchQuery}"
              </p>
            </Card>
          ) : (
            filteredFAQs.map(faq => {
              const isExpanded = expandedItems.has(faq.id)
              return (
                <Card
                  key={faq.id}
                  className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-colors"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-6 text-left flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {faq.question}
                      </h3>
                      {isExpanded && (
                        <p className="text-purple-200 mt-3 leading-relaxed">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                </Card>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Card className="bg-white/5 border-white/10 p-8">
            <h3 className="text-xl font-semibold text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-purple-200 mb-4">
              We're here to help! Use the feedback button to send us a message.
            </p>
            <Button
              onClick={() => {
                // This will trigger the global feedback button
                const feedbackBtn = document.querySelector('[aria-label="Leave feedback"]') as HTMLButtonElement
                if (feedbackBtn) feedbackBtn.click()
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Send Feedback
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
