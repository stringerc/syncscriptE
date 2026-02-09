import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Target, Zap, X, Sparkles, Users, UserPlus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AttachmentManager, Attachment } from './AttachmentManager';
import { VoiceInputButton } from './VoiceInputButton';
import { MilestoneManager, Milestone } from './MilestoneManager';

interface EnhancedTaskGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'task' | 'goal';
  onSubmit?: (data: any) => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export function EnhancedTaskGoalDialog({ 
  open, 
  onOpenChange, 
  type,
  onSubmit,
  initialData,
  mode = 'create'
}: EnhancedTaskGoalDialogProps) {
  const [creationMode, setCreationMode] = useState<'standard' | 'smart'>('standard');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialData?.priority || 'medium');
  const [energyCost, setEnergyCost] = useState<'low' | 'medium' | 'high'>(initialData?.energyLevel || initialData?.energyCost || 'medium');
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimatedTime || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [owner, setOwner] = useState(initialData?.owner || 'me');
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [milestones, setMilestones] = useState<Milestone[]>(initialData?.milestones || []);
  
  // Collaborators state - mock friend data
  const [collaborators, setCollaborators] = useState<string[]>(initialData?.collaborators || []);
  const [showCollaboratorDropdown, setShowCollaboratorDropdown] = useState(false);
  
  // Mock friends list
  const availableFriends = [
    { id: 'sarah', name: 'Sarah Chen', avatar: '👩‍💼', status: 'online' },
    { id: 'marcus', name: 'Marcus Johnson', avatar: '👨‍💻', status: 'away' },
    { id: 'elena', name: 'Elena Rodriguez', avatar: '👩‍🔬', status: 'online' },
    { id: 'james', name: 'James Park', avatar: '👨‍🎨', status: 'offline' },
    { id: 'olivia', name: 'Olivia Martinez', avatar: '👩‍🚀', status: 'online' },
  ];

  // Update form when initialData changes or dialog opens
  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'medium');
      setEnergyCost(initialData.energyLevel || initialData.energyCost || 'medium');
      setEstimatedTime(initialData.estimatedTime || '');
      setDueDate(initialData.dueDate || '');
      setTags(initialData.tags || []);
      setOwner(initialData.owner || 'me');
      setAttachments(initialData.attachments || []);
      setMilestones(initialData.milestones || []);
      setCollaborators(initialData.collaborators || []);
    } else if (open && !initialData) {
      // Reset form for create mode
      resetForm();
    }
  }, [open, initialData]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleVoiceTranscript = (transcript: string) => {
    setTitle(transcript);
  };

  const handleSmartGenerate = () => {
    // Simulate AI generation
    const smartData = {
      task: {
        title: 'Review quarterly financial reports and prepare executive summary',
        description: 'Analyze Q4 performance metrics, identify trends, and create presentation for board meeting',
        priority: 'high',
        energyCost: 'high',
        estimatedTime: '2.5h',
        tags: ['Finance', 'Executive', 'Analysis'],
        milestones: [
          { id: '1', title: 'Gather all financial data', completed: false },
          { id: '2', title: 'Analyze key metrics', completed: false },
          { id: '3', title: 'Create summary document', completed: false },
          { id: '4', title: 'Review with CFO', completed: false },
        ],
      },
      goal: {
        title: 'Complete Product Management Certification',
        description: 'Achieve certification in product management to enhance career skills and team leadership capabilities',
        priority: 'medium',
        energyCost: 'medium',
        estimatedTime: '40h total',
        tags: ['Career', 'Learning', 'Professional Development'],
        milestones: [
          { id: '1', title: 'Complete all course modules', completed: false },
          { id: '2', title: 'Pass practice assessments', completed: false },
          { id: '3', title: 'Submit capstone project', completed: false },
          { id: '4', title: 'Pass final certification exam', completed: false },
        ],
      },
    };

    const data = type === 'task' ? smartData.task : smartData.goal;
    setTitle(data.title);
    setDescription(data.description);
    setPriority(data.priority as any);
    setEnergyCost(data.energyCost as any);
    setEstimatedTime(data.estimatedTime);
    setTags(data.tags);
    setMilestones(data.milestones);

    toast.success('Smart generation complete', {
      description: `AI has generated a ${type} with milestones and recommendations`,
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(`${type === 'task' ? 'Task' : 'Goal'} title is required`);
      return;
    }

    const data = {
      title,
      description,
      priority,
      energyCost,
      estimatedTime,
      dueDate,
      tags,
      owner,
      attachments,
      milestones,
      creationMode,
      collaborators,
    };

    if (onSubmit) {
      onSubmit(data);
    }

    toast.success(`${type === 'task' ? 'Task' : 'Goal'} created!`, {
      description: `"${title}" has been added to your list`,
    });

    // Reset form
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEnergyCost('medium');
    setEstimatedTime('');
    setDueDate('');
    setTags([]);
    setTagInput('');
    setOwner('me');
    setAttachments([]);
    setMilestones([]);
    setCreationMode('standard');
    setCollaborators([]);
    setShowCollaboratorDropdown(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            {type === 'task' ? <Target className="w-6 h-6 text-teal-400" /> : <Calendar className="w-6 h-6 text-purple-400" />}
            {mode === 'edit' ? 'Edit' : 'Create New'} {type === 'task' ? 'Task' : 'Goal'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {mode === 'edit' 
              ? `Update your ${type} details below`
              : type === 'task' 
                ? 'Add a new task with AI-powered scheduling and energy optimization'
                : 'Set a new goal with milestones and progress tracking'}
          </DialogDescription>
        </DialogHeader>

        {/* Creation Mode Toggle */}
        <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="smart" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Smart AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-6 py-4">
            {/* Standard Creation Form */}
            
            {/* Title with Voice Input */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                {type === 'task' ? 'Task' : 'Goal'} Title *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'task' ? 'e.g., Complete budget analysis' : 'e.g., Launch new product feature'}
                  className="flex-1 bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
                />
                <VoiceInputButton onTranscript={handleVoiceTranscript} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Describe your ${type} in detail...`}
                className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
              />
            </div>

            {/* Priority and Energy Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-white">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2128] border-gray-800">
                    <SelectItem value="low" className="text-gray-300">Low</SelectItem>
                    <SelectItem value="medium" className="text-gray-300">Medium</SelectItem>
                    <SelectItem value="high" className="text-gray-300">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="energy" className="text-white flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Energy Cost
                </Label>
                <Select value={energyCost} onValueChange={(v) => setEnergyCost(v as any)}>
                  <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2128] border-gray-800">
                    <SelectItem value="low" className="text-gray-300">Low</SelectItem>
                    <SelectItem value="medium" className="text-gray-300">Medium</SelectItem>
                    <SelectItem value="high" className="text-gray-300">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time" className="text-white">Estimated Time</Label>
                <Input
                  id="time"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="e.g., 2h 30m"
                  className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due-date" className="text-white">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-[#2a2d35] border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-white">Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2128] border-gray-800">
                  <SelectItem value="me" className="text-gray-300">Me</SelectItem>
                  <SelectItem value="sarah" className="text-gray-300">Sarah Chen</SelectItem>
                  <SelectItem value="marcus" className="text-gray-300">Marcus Johnson</SelectItem>
                  <SelectItem value="elena" className="text-gray-300">Elena Rodriguez</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Collaborators */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invite Friends to Collaborate
              </Label>
              <div className="space-y-3">
                {/* Add Collaborator Button */}
                <div className="relative">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full justify-start gap-2 bg-[#2a2d35] border-gray-700 hover:bg-gray-700"
                    onClick={() => setShowCollaboratorDropdown(!showCollaboratorDropdown)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Friends
                  </Button>

                  {/* Dropdown Menu */}
                  {showCollaboratorDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e2128] border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {availableFriends.filter(f => !collaborators.includes(f.id)).map((friend) => (
                        <button
                          key={friend.id}
                          type="button"
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                          onClick={() => {
                            setCollaborators([...collaborators, friend.id]);
                            toast.success(`${friend.name} added as collaborator`);
                          }}
                        >
                          <span className="text-2xl">{friend.avatar}</span>
                          <div className="flex-1">
                            <div className="text-white text-sm">{friend.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-2 h-2 rounded-full ${
                                friend.status === 'online' ? 'bg-green-400' : 
                                friend.status === 'away' ? 'bg-amber-400' : 
                                'bg-gray-500'
                              }`} />
                              <span className="text-xs text-gray-400 capitalize">{friend.status}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                      {availableFriends.filter(f => !collaborators.includes(f.id)).length === 0 && (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                          All friends have been added
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Collaborators */}
                {collaborators.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                    <div className="text-xs text-gray-400 mb-3">
                      {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'} added
                    </div>
                    <div className="space-y-2">
                      {collaborators.map((collabId) => {
                        const friend = availableFriends.find(f => f.id === collabId);
                        if (!friend) return null;
                        return (
                          <div key={collabId} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2.5">
                            <span className="text-xl">{friend.avatar}</span>
                            <div className="flex-1">
                              <div className="text-white text-sm">{friend.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  friend.status === 'online' ? 'bg-green-400' : 
                                  friend.status === 'away' ? 'bg-amber-400' : 
                                  'bg-gray-500'
                                }`} />
                                <span className="text-xs text-gray-400 capitalize">{friend.status}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCollaborators(collaborators.filter(id => id !== collabId));
                                toast.info(`${friend.name} removed`);
                              }}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-700">
                      💡 Collaborators will receive notifications and can view progress updates
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-white">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag and press Enter"
                  className="flex-1 bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1 text-white">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Milestones */}
            <MilestoneManager milestones={milestones} onMilestonesChange={setMilestones} />

            {/* Attachments */}
            <AttachmentManager attachments={attachments} onAttachmentsChange={setAttachments} />
          </TabsContent>

          <TabsContent value="smart" className="space-y-6 py-4">
            {/* Smart AI Creation */}
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-white">Smart AI Generation</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Let AI create a comprehensive {type} with suggested milestones, priority, energy cost, and tags based on best practices.
              </p>
              <Button 
                onClick={handleSmartGenerate}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Smart {type === 'task' ? 'Task' : 'Goal'}
              </Button>
            </div>

            {/* Show generated content if available */}
            {title && (
              <div className="space-y-4 border-t border-gray-800 pt-4">
                <h4 className="text-white font-medium">Generated Content:</h4>
                <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Title</div>
                    <div className="text-white">{title}</div>
                  </div>
                  {description && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Description</div>
                      <div className="text-sm text-gray-300">{description}</div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Priority</div>
                      <Badge variant="outline" className="capitalize">{priority}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Energy Cost</div>
                      <Badge variant="outline" className="capitalize">{energyCost}</Badge>
                    </div>
                  </div>
                  {milestones.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2">Milestones ({milestones.length})</div>
                      <div className="space-y-1">
                        {milestones.map((m) => (
                          <div key={m.id} className="text-sm text-gray-300">• {m.title}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  You can edit these details after creation
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-teal-600 hover:bg-teal-500">
            {mode === 'edit' ? 'Save Changes' : `Create ${type === 'task' ? 'Task' : 'Goal'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}