import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Book, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EveningJournalProps {
  onComplete?: () => void;
}

export function EveningJournal({ onComplete }: EveningJournalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [highlights, setHighlights] = useState<string[]>([]);
  const [lowlights, setLowlights] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [freeformNote, setFreeformNote] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [newLowlight, setNewLowlight] = useState('');
  const [newBlocker, setNewBlocker] = useState('');

  // Save journal mutation
  const saveJournalMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/brief/journal', {
        date: new Date().toISOString(),
        highlights,
        lowlights,
        blockers,
        freeformNote
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      toast({
        title: 'Journal Saved!',
        description: 'Your reflection has been recorded'
      });
      onComplete?.();
    }
  });

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const addLowlight = () => {
    if (newLowlight.trim()) {
      setLowlights([...lowlights, newLowlight.trim()]);
      setNewLowlight('');
    }
  };

  const addBlocker = () => {
    if (newBlocker.trim()) {
      setBlockers([...blockers, newBlocker.trim()]);
      setNewBlocker('');
    }
  };

  const removeItem = (type: 'highlights' | 'lowlights' | 'blockers', index: number) => {
    if (type === 'highlights') {
      setHighlights(highlights.filter((_, i) => i !== index));
    } else if (type === 'lowlights') {
      setLowlights(lowlights.filter((_, i) => i !== index));
    } else {
      setBlockers(blockers.filter((_, i) => i !== index));
    }
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Book className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Evening Reflection</CardTitle>
            <CardDescription>
              Take a moment to reflect on your day
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Highlights */}
        <div className="space-y-3">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            ✨ What went well today?
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a highlight..."
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm" onClick={addHighlight} disabled={!newHighlight.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, i) => (
              <Badge key={i} variant="default" className="bg-green-500 text-white">
                {highlight}
                <button
                  onClick={() => removeItem('highlights', i)}
                  className="ml-2 hover:text-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Lowlights */}
        <div className="space-y-3">
          <h4 className="font-medium text-orange-700 flex items-center gap-2">
            💭 What could be improved?
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add something to improve..."
              value={newLowlight}
              onChange={(e) => setNewLowlight(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLowlight()}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm" onClick={addLowlight} disabled={!newLowlight.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowlights.map((lowlight, i) => (
              <Badge key={i} variant="secondary" className="bg-orange-500 text-white">
                {lowlight}
                <button
                  onClick={() => removeItem('lowlights', i)}
                  className="ml-2 hover:text-red-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Blockers */}
        <div className="space-y-3">
          <h4 className="font-medium text-red-700 flex items-center gap-2">
            🚧 Any blockers?
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a blocker..."
              value={newBlocker}
              onChange={(e) => setNewBlocker(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBlocker()}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm" onClick={addBlocker} disabled={!newBlocker.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {blockers.map((blocker, i) => (
              <Badge key={i} variant="destructive">
                {blocker}
                <button
                  onClick={() => removeItem('blockers', i)}
                  className="ml-2 hover:text-white/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Freeform Note */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">📝 Additional thoughts (optional)</h4>
          <Textarea
            placeholder="Anything else on your mind..."
            value={freeformNote}
            onChange={(e) => setFreeformNote(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <Button
            onClick={() => saveJournalMutation.mutate()}
            disabled={saveJournalMutation.isPending || (highlights.length === 0 && lowlights.length === 0 && blockers.length === 0)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {saveJournalMutation.isPending ? 'Saving...' : 'Save Reflection'}
          </Button>
          {blockers.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                // Convert blockers to tasks
                toast({
                  title: 'Creating Tasks',
                  description: `Converting ${blockers.length} blocker${blockers.length > 1 ? 's' : ''} to tasks...`
                });
              }}
            >
              Convert Blockers to Tasks
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

