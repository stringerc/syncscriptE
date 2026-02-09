import { useState } from 'react';
import { 
  Plus, Github, Calendar as CalendarIcon, Mail, Heart, Facebook,
  Link as LinkIcon, CheckCircle2, RefreshCw, Search, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';

// Integration type definitions
type IntegrationType = 'push' | 'hybrid' | 'pull';

interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  icon: any;
  color: string;
  connected: boolean;
  hasUpdates?: boolean;
  updateCount?: number;
}

// Define integrations by type
const INTEGRATIONS: Integration[] = [
  // Push integrations
  { id: 'github', name: 'GitHub', type: 'push', icon: Github, color: 'from-gray-600 to-gray-700', connected: true, hasUpdates: true, updateCount: 3 },
  { id: 'trello', name: 'Trello', type: 'push', icon: LinkIcon, color: 'from-blue-600 to-blue-700', connected: true, hasUpdates: false },
  { id: 'slack', name: 'Slack', type: 'push', icon: LinkIcon, color: 'from-purple-600 to-purple-700', connected: false },
  { id: 'zoom', name: 'Zoom', type: 'push', icon: LinkIcon, color: 'from-blue-500 to-blue-600', connected: true, hasUpdates: true, updateCount: 2 },
  
  // Hybrid integrations
  { id: 'notion', name: 'Notion', type: 'hybrid', icon: LinkIcon, color: 'from-gray-700 to-gray-800', connected: true, hasUpdates: true, updateCount: 5 },
  { id: 'google-calendar', name: 'Google Calendar', type: 'hybrid', icon: CalendarIcon, color: 'from-blue-600 to-blue-700', connected: true, hasUpdates: false },
  { id: 'gmail', name: 'Gmail', type: 'hybrid', icon: Mail, color: 'from-red-600 to-red-700', connected: true, hasUpdates: true, updateCount: 12 },
  { id: 'health', name: 'Health', type: 'hybrid', icon: Heart, color: 'from-pink-600 to-pink-700', connected: false },
  
  // Pull integrations
  { id: 'facebook-events', name: 'Facebook Events', type: 'pull', icon: Facebook, color: 'from-blue-600 to-blue-700', connected: true },
  { id: 'ical', name: 'iCal', type: 'pull', icon: CalendarIcon, color: 'from-gray-600 to-gray-700', connected: false },
];

// Helper function to get type-specific colors
function getTypeColor(type: IntegrationType): string {
  switch (type) {
    case 'push':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'hybrid':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    case 'pull':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
}

interface IntegrationImportsProps {
  onImport?: (integrationId: string, data: any) => void;
}

export function IntegrationImports({ onImport }: IntegrationImportsProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  const connectedIntegrations = INTEGRATIONS.filter(i => i.connected);

  const handleOpenImport = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowImportDialog(true);
  };

  const handleAddIntegration = () => {
    // Navigate to settings page integrations tab
    navigate('/settings?tab=integrations');
  };

  const handlePullImport = () => {
    if (!selectedIntegration || !searchQuery.trim()) {
      toast.error('Search required', { description: 'Please enter a search term' });
      return;
    }

    setImporting(true);
    
    // Simulate search and import
    setTimeout(() => {
      const mockResults = [
        { id: '1', title: 'Team Standup', date: 'Tomorrow 9:00 AM' },
        { id: '2', title: 'Product Review', date: 'Thursday 2:00 PM' },
      ];

      toast.success('Events imported', {
        description: `Found ${mockResults.length} events from ${selectedIntegration.name}`,
      });

      if (onImport) {
        onImport(selectedIntegration.id, mockResults);
      }

      setImporting(false);
      setShowImportDialog(false);
    }, 1500);
  };

  const handlePushHybridSync = (integration: Integration) => {
    toast.success('Syncing...', {
      description: `Importing updates from ${integration.name}`,
    });

    // Simulate sync
    setTimeout(() => {
      toast.success('Sync complete', {
        description: `${integration.updateCount || 0} new items imported`,
      });

      if (onImport) {
        onImport(integration.id, { count: integration.updateCount || 0 });
      }
    }, 1000);
  };

  const getTypeDescription = (type: IntegrationType) => {
    switch (type) {
      case 'push':
        return 'Auto-syncs updates';
      case 'hybrid':
        return 'Two-way sync';
      case 'pull':
        return 'Manual import';
    }
  };

  return (
    <div className="space-y-2">
      {/* Connected Integrations - Small icons only */}
      {connectedIntegrations.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {connectedIntegrations.map((integration) => {
            const Icon = integration.icon;
            const isPushOrHybrid = integration.type === 'push' || integration.type === 'hybrid';
            const showNotification = isPushOrHybrid && integration.hasUpdates;

            return (
              <div
                key={integration.id}
                className="relative group"
              >
                <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${integration.color} flex items-center justify-center border border-gray-700/50`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Notification Dot - smaller */}
                {showNotification && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#1e2128]" />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 whitespace-nowrap text-xs">
                    <div className="text-white">{integration.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Add Integration Plus Icon */}
          <div className="relative group">
            <button
              onClick={handleAddIntegration}
              className="w-8 h-8 rounded-md bg-gradient-to-br from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 flex items-center justify-center border border-gray-700/50 transition-all hover:scale-105"
              data-nav="add-integration"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 whitespace-nowrap text-xs">
                <div className="text-white">Add Integration</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog - keep for potential future use but remove from main UI */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedIntegration && (
                <>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedIntegration.color} flex items-center justify-center`}>
                    <selectedIntegration.icon className="w-5 h-5 text-white" />
                  </div>
                  Import from {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Search and import events from {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePullImport()}
                  placeholder="Search for events..."
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <Button
                onClick={handlePullImport}
                disabled={importing}
                className="bg-teal-600 hover:bg-teal-500"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-sm text-gray-400">
              <p>Enter keywords to search for events in your {selectedIntegration?.name} calendar</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Integration Button Component
interface AddIntegrationButtonProps {
  onAddClick?: () => void;
}

export function AddIntegrationButton({ onAddClick }: AddIntegrationButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to settings page integrations tab
    navigate('/settings?tab=integrations');
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      className="gap-2 hover:bg-teal-600/10 hover:border-teal-600/50"
    >
      <Plus className="w-4 h-4" />
      Add Integration
    </Button>
  );
}