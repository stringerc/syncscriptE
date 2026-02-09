/**
 * ImportSelector Component
 * 
 * Shows import options from connected integrations (Notion, Trello, GitHub).
 * Displays integration icons near plus button if connected.
 * 
 * Features:
 * - Plus icon for imports
 * - Shows connected integration icons
 * - Import selector modal
 * - Choose what to import (mock)
 */

import { useState } from 'react';
import { Plus, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { INTEGRATIONS_DATA } from '../utils/integrations-data';

interface ImportSource {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  items?: ImportItem[];
}

interface ImportItem {
  id: string;
  title: string;
  type: 'task' | 'project' | 'issue';
  dueDate?: string;
  status?: string;
  description?: string;
}

interface ImportSelectorProps {
  type: 'tasks' | 'goals';
  onImport: (items: any[]) => void;
}

export function ImportSelector({ type, onImport }: ImportSelectorProps) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Get connected integrations that support import
  const connectedIntegrations = INTEGRATIONS_DATA.filter(
    (integration) => 
      integration.connected && 
      ['notion', 'trello', 'github'].includes(integration.id.toLowerCase())
  );

  // Mock import items
  const getImportItems = (sourceId: string): ImportItem[] => {
    if (sourceId === 'notion') {
      return [
        { id: '1', title: 'Complete project documentation', type: 'task', dueDate: '2024-12-30', status: 'In Progress' },
        { id: '2', title: 'Review design mockups', type: 'task', dueDate: '2024-12-28', status: 'To Do' },
        { id: '3', title: 'Q1 Planning', type: 'project', status: 'Not Started' },
      ];
    }
    if (sourceId === 'trello') {
      return [
        { id: '4', title: 'Update website homepage', type: 'task', dueDate: '2024-12-29', status: 'Doing' },
        { id: '5', title: 'Client feedback review', type: 'task', status: 'To Do' },
      ];
    }
    if (sourceId === 'github') {
      return [
        { id: '6', title: 'Fix authentication bug', type: 'issue', status: 'Open' },
        { id: '7', title: 'Add dark mode support', type: 'issue', status: 'In Progress' },
        { id: '8', title: 'Implement search feature', type: 'issue', status: 'Open' },
      ];
    }
    return [];
  };

  const handleImportClick = (sourceId: string) => {
    setSelectedSource(sourceId);
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to import');
      return;
    }

    setIsImporting(true);

    // Mock import delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const source = INTEGRATIONS_DATA.find(i => i.id === selectedSource);
    const items = getImportItems(selectedSource || '').filter(item => 
      selectedItems.includes(item.id)
    );

    // Convert to task/goal format
    const importedItems = items.map(item => ({
      id: Date.now().toString() + Math.random(),
      title: item.title,
      description: item.description || `Imported from ${source?.name}`,
      priority: 'medium',
      energyLevel: 'medium',
      completed: false,
      progress: 0,
      tags: [source?.name || 'Imported'],
      dueDate: item.dueDate || 'No due date',
      importedFrom: source?.id,
    }));

    onImport(importedItems);

    toast.success(`Imported ${items.length} ${type}`, {
      description: `Successfully imported from ${source?.name}`,
    });

    setIsImporting(false);
    setShowImportModal(false);
    setSelectedSource(null);
    setSelectedItems([]);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    const allIds = getImportItems(selectedSource || '').map(item => item.id);
    setSelectedItems(allIds);
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  if (connectedIntegrations.length === 0) {
    return null;
  }

  return (
    <>
      {/* Import Button with Integration Icons */}
      <div className="flex items-center gap-2">
        {/* Connected Integration Icons */}
        <div className="flex items-center gap-1">
          {connectedIntegrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => handleImportClick(integration.id)}
              className="w-8 h-8 rounded-lg bg-[#252830] border border-gray-700 hover:border-teal-600 transition-colors flex items-center justify-center group"
              title={`Import from ${integration.name}`}
            >
              <img 
                src={integration.icon} 
                alt={integration.name}
                className="w-5 h-5 group-hover:scale-110 transition-transform"
              />
            </button>
          ))}
        </div>

        {/* Plus Button for General Import */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImportModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Import {type}
        </Button>
      </div>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-[#1e2128] border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Import {type}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose items to import from your connected integrations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source Selection */}
            {!selectedSource ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Select a source:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {connectedIntegrations.map((integration) => (
                    <button
                      key={integration.id}
                      onClick={() => handleImportClick(integration.id)}
                      className="flex items-center gap-4 p-4 bg-[#252830] border border-gray-700 rounded-lg hover:border-teal-600 transition-colors group"
                    >
                      <img 
                        src={integration.icon} 
                        alt={integration.name}
                        className="w-10 h-10 group-hover:scale-110 transition-transform"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{integration.name}</p>
                        <p className="text-xs text-gray-400">{integration.category}</p>
                      </div>
                      <Badge variant="outline" className="border-teal-600 text-teal-400">
                        Connected
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Back to source selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedSource(null);
                        setSelectedItems([]);
                      }}
                      className="text-teal-400 hover:text-teal-300 text-sm"
                    >
                      ← Back to sources
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Item List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getImportItems(selectedSource).map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-3 p-4 bg-[#252830] border rounded-lg transition-colors ${
                        selectedItems.includes(item.id)
                          ? 'border-teal-600 bg-teal-600/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          {item.status && (
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          )}
                          {item.dueDate && (
                            <span className="text-xs text-gray-400">{item.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Selection Summary */}
                <div className="flex items-center justify-between p-3 bg-[#252830] border border-gray-700 rounded-lg">
                  <span className="text-sm text-gray-400">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    onClick={handleImport}
                    disabled={selectedItems.length === 0 || isImporting}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
