import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, Lightbulb, MapPin, Sparkles, Wand2 } from 'lucide-react';
import type { UnifiedConflict } from '../utils/unified-conflict-detection';
import { useTasks } from '../hooks/useTasks';
import { toast } from 'sonner@2.0.3';

interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: UnifiedConflict | null;
}

type SuggestionPack = {
  templateName: string;
  artifactType: 'paper' | 'presentation' | 'photo_book' | 'outline' | 'study_guide';
  milestones: string[];
  steps: string[];
  draft: string;
};

type NearbyRestaurant = {
  name: string;
  vibe: string;
  image: string;
  cuisine: string;
  mapsQuery: string;
};

const OSTERIA_INSPIRED_RESTAURANTS: NearbyRestaurant[] = [
  {
    name: 'Refined Italian Tasting',
    vibe: 'Modern tasting menu, chef-led counter',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80&auto=format&fit=crop',
    cuisine: 'Italian',
    mapsQuery: 'Italian fine dining near me',
  },
  {
    name: 'Seasonal Pasta Atelier',
    vibe: 'Seasonal ingredients, handmade pasta focus',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400&q=80&auto=format&fit=crop',
    cuisine: 'Italian',
    mapsQuery: 'chef tasting italian restaurant near me',
  },
  {
    name: 'Contemporary Emilia Kitchen',
    vibe: 'Elevated classics with wine pairing',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80&auto=format&fit=crop',
    cuisine: 'Italian',
    mapsQuery: 'modern italian restaurant near me',
  },
];

function normalizeText(input: string) {
  return input.toLowerCase().trim();
}

function buildSuggestionPack(taskTitle: string): SuggestionPack {
  const normalized = normalizeText(taskTitle);

  if (/\b(paper|essay|music class|report|analysis)\b/.test(normalized)) {
    return {
      templateName: 'Academic paper starter',
      artifactType: 'paper',
      milestones: [
        'Define thesis and scope',
        'Collect sources and references',
        'Create section outline',
        'Draft complete first pass',
        'Revise and finalize citations',
      ],
      steps: [
        'Write a one-sentence thesis statement',
        'Gather 5 credible references',
        'Build intro, body, conclusion headers',
        'Draft 2 supporting arguments with evidence',
        'Run grammar + citation format check',
      ],
      draft: `# ${taskTitle}\n\n## Thesis\nMusic is a cultural archive and a social technology that shapes identity, memory, and community.\n\n## Introduction\nThis paper examines how musical form and performance context influence social meaning.\n\n## Key Points\n1. Historical context and genre evolution\n2. Harmonic/rhythmic structure and emotional effect\n3. Community impact and identity formation\n\n## Conclusion\nMusic functions as both artistic expression and social infrastructure, making it critical to study beyond entertainment framing.\n`,
    };
  }

  if (/\b(slides|presentation|pitch|deck)\b/.test(normalized)) {
    return {
      templateName: 'Presentation deck starter',
      artifactType: 'presentation',
      milestones: [
        'Clarify audience and goal',
        'Build story arc',
        'Draft slide structure',
        'Add visuals and examples',
        'Rehearse and tighten timing',
      ],
      steps: [
        'Write one-line objective for the deck',
        'Create a 7-slide narrative skeleton',
        'Add one chart or visual per core point',
        'Draft speaker notes for each slide',
        'Run a 10-minute rehearsal pass',
      ],
      draft: `# ${taskTitle} — Slide Plan\n\n1. Title + Objective\n2. Problem framing\n3. Insight / data\n4. Proposed approach\n5. Roadmap\n6. Risks + mitigation\n7. Call to action\n`,
    };
  }

  if (/\b(photo|photobook|album|portfolio)\b/.test(normalized)) {
    return {
      templateName: 'Photo book starter',
      artifactType: 'photo_book',
      milestones: [
        'Define narrative theme',
        'Collect and curate images',
        'Sequence pages by story arc',
        'Add captions and context',
        'Export and review print layout',
      ],
      steps: [
        'Pick a single theme and title',
        'Select top 30 images and rate them',
        'Organize into opening, body, closing pages',
        'Write concise captions for each spread',
        'Export draft and QA layout spacing',
      ],
      draft: `# ${taskTitle} — Photo Book Outline\n\n## Theme\nA visual narrative that moves from context to detail to reflection.\n\n## Sections\n- Opening (setting + mood)\n- Middle (people/process/highlights)\n- Closing (summary + emotional payoff)\n`,
    };
  }

  if (/\b(study|exam|quiz|notes|flashcard)\b/.test(normalized)) {
    return {
      templateName: 'Study guide starter',
      artifactType: 'study_guide',
      milestones: [
        'Collect source material',
        'Extract key concepts',
        'Create memory anchors',
        'Practice and self-test',
        'Finalize review packet',
      ],
      steps: [
        'List all chapters and topics',
        'Summarize each topic in 3 bullets',
        'Create 20 flashcards from key facts',
        'Run a timed practice quiz',
        'Review weak areas and update notes',
      ],
      draft: `# ${taskTitle} — Study Guide\n\n## Core Topics\n- Topic 1\n- Topic 2\n- Topic 3\n\n## Quick Recall Questions\n1. \n2. \n3. \n`,
    };
  }

  return {
    templateName: 'Task breakdown starter',
    artifactType: 'outline',
    milestones: [
      'Clarify deliverable',
      'Break into sub-problems',
      'Execute first concrete output',
      'Review quality against criteria',
      'Finalize and publish',
    ],
    steps: [
      'Write the exact done-definition in one sentence',
      'List dependencies and blockers',
      'Create the first shippable draft',
      'Collect feedback and revise',
      'Finalize and share',
    ],
    draft: `# ${taskTitle}\n\n## Outcome\nDefine a clear outcome and acceptance criteria.\n\n## Plan\n1. Scope\n2. Build\n3. Review\n4. Finalize\n`,
  };
}

function downloadDraft(taskTitle: string, pack: SuggestionPack) {
  const safe = taskTitle.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'task';
  const filename = `${safe}-${pack.artifactType}.md`;
  const blob = new Blob([pack.draft], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function ConflictResolutionModal({ open, onOpenChange, conflict }: ConflictResolutionModalProps) {
  const { updateTask } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionPack | null>(null);

  const taskCandidates = useMemo(() => {
    const raw = conflict?.metadata?.tasks;
    return Array.isArray(raw) ? raw : [];
  }, [conflict]);

  const selectedTask = useMemo(
    () => taskCandidates.find((task: any) => task.id === selectedTaskId) || taskCandidates[0] || null,
    [taskCandidates, selectedTaskId],
  );

  const isFinancial = conflict?.source === 'financial';
  const isTaskConflict = conflict?.source === 'tasks';

  const handleDoIt = async () => {
    if (!selectedTask || !suggestion) return;
    downloadDraft(selectedTask.title || 'task', suggestion);
    try {
      const existing = Array.isArray((selectedTask as any).resources) ? (selectedTask as any).resources : [];
      const nextResource = {
        id: `generated-${Date.now()}`,
        name: `${suggestion.artifactType} starter for ${selectedTask.title}`,
        type: 'document',
        url: `generated://${suggestion.artifactType}/${encodeURIComponent(selectedTask.title || 'task')}`,
        addedBy: 'Nexus',
        addedAt: new Date().toISOString(),
      };
      await updateTask((selectedTask as any).id, { resources: [...existing, nextResource] } as any);
      toast.success('Starter artifact created and saved to task resources.');
    } catch {
      toast.error('Artifact downloaded, but failed to attach resource to task.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-gray-700 bg-[#11131a] text-white">
        <DialogHeader>
          <DialogTitle>
            {isFinancial ? 'Nearby Osteria-Inspired Picks' : 'Resolve Task Conflict'}
          </DialogTitle>
          <DialogDescription>
            {isFinancial
              ? 'Use these discovery shortcuts to quickly find elevated Italian options nearby.'
              : 'Select a task, generate milestone/step suggestions, then create a starter artifact.'}
          </DialogDescription>
        </DialogHeader>

        {isFinancial && (
          <div className="grid gap-3 md:grid-cols-3">
            {OSTERIA_INSPIRED_RESTAURANTS.map((restaurant) => (
              <div key={restaurant.name} className="overflow-hidden rounded-xl border border-gray-800 bg-[#1a1d24]">
                <img src={restaurant.image} alt={restaurant.name} className="h-28 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <p className="text-sm font-semibold text-white">{restaurant.name}</p>
                  <p className="text-xs text-gray-300">{restaurant.vibe}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{restaurant.cuisine}</Badge>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(restaurant.mapsQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-teal-200"
                    >
                      <MapPin className="h-3 w-3" />
                      Explore Nearby
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isTaskConflict && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-400">Tasks in this conflict</p>
              <div className="grid gap-2">
                {taskCandidates.map((task: any) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setSuggestion(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                      (selectedTask?.id || '') === task.id
                        ? 'border-teal-500/70 bg-teal-500/10'
                        : 'border-gray-700 bg-[#171a20] hover:border-gray-600'
                    }`}
                  >
                    <p className="text-sm text-white">{task.title}</p>
                    <p className="text-xs text-gray-400">
                      Priority: {task.priority || 'n/a'}{task.dueDate ? ` • Due ${task.dueDate}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {selectedTask && (
              <div className="space-y-3 rounded-xl border border-gray-800 bg-[#171a20] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">{selectedTask.title}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-200"
                    onClick={() => setSuggestion(buildSuggestionPack(selectedTask.title || 'Task'))}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Suggest
                  </Button>
                </div>

                {suggestion && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-300" />
                      <p className="text-sm text-teal-200">{suggestion.templateName}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs uppercase text-gray-400">Suggested Milestones (5)</p>
                        <ul className="space-y-1 text-sm text-gray-200">
                          {suggestion.milestones.map((milestone) => (
                            <li key={milestone}>- {milestone}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 text-xs uppercase text-gray-400">Suggested Steps</p>
                        <ul className="space-y-1 text-sm text-gray-200">
                          {suggestion.steps.map((step) => (
                            <li key={step}>- {step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-200"
                        onClick={() => setSuggestion(buildSuggestionPack(selectedTask.title || 'Task'))}
                      >
                        Suggest Next
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-500 text-white"
                        onClick={() => void handleDoIt()}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Do It
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
