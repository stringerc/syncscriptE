/**
 * CreateTeamScriptDialog Component (Phase 6B)
 * 
 * Dialog for converting team events into reusable script templates.
 * Allows configuration of permissions, pricing, and marketplace settings.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Users,
  Lock,
  Globe,
  DollarSign,
  Zap,
  Clock,
  Target,
  AlertCircle,
  Check,
  Settings,
  Shield,
} from 'lucide-react';
import { Event } from '../../utils/event-task-types';
import { Team } from '../../types/team';
import { ScriptVisibility, ScriptPricing } from '../../utils/team-script-integration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { cn } from '../ui/utils';

interface CreateTeamScriptDialogProps {
  open: boolean;
  onClose: () => void;
  event: Event;
  team: Team;
  onCreateScript: (options: {
    name: string;
    description: string;
    category: string;
    visibility: ScriptVisibility;
    pricing: ScriptPricing;
    price?: number;
  }) => void;
}

export function CreateTeamScriptDialog({
  open,
  onClose,
  event,
  team,
  onCreateScript,
}: CreateTeamScriptDialogProps) {
  const [name, setName] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [category, setCategory] = useState('workflow');
  const [visibility, setVisibility] = useState<ScriptVisibility>('team-only');
  const [pricing, setPricing] = useState<ScriptPricing>('free');
  const [price, setPrice] = useState(0);

  // Permissions
  const [allowFork, setAllowFork] = useState(true);
  const [allowCustomization, setAllowCustomization] = useState(true);
  const [requireAttribution, setRequireAttribution] = useState(true);
  const [allowCommercialUse, setAllowCommercialUse] = useState(false);

  // Calculate script stats
  const milestoneCount = event.milestones?.length || 0;
  const stepCount =
    event.milestones?.reduce((sum, m) => sum + (m.children?.length || 0), 0) || 0;
  const totalEvents = 1 + milestoneCount + stepCount;
  const taskCount = event.associatedTasks?.length || 0;
  const estimatedDuration = event.duration || 60;

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }

    onCreateScript({
      name: name.trim(),
      description: description.trim(),
      category,
      visibility,
      pricing,
      price: pricing === 'free' ? undefined : price,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1c24] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Create Team Script Template
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Convert "{event.title}" into a reusable script template that your team can
            use again.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#1e2128] border border-gray-800">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Script Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Sprint Planning"
                className="bg-[#1e2128] border-gray-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this script template does and when to use it..."
                rows={4}
                className="bg-[#1e2128] border-gray-800 text-white resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#1e2128] border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1e2128] border-gray-800">
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="task-management">Task Management</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="reporting">Reporting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-gray-800" />

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="grid grid-cols-2 gap-3">
                <VisibilityOption
                  icon={Users}
                  label="Team Only"
                  description="Only your team members"
                  value="team-only"
                  selected={visibility === 'team-only'}
                  onClick={() => setVisibility('team-only')}
                />
                <VisibilityOption
                  icon={Globe}
                  label="Public"
                  description="Anyone in marketplace"
                  value="public"
                  selected={visibility === 'public'}
                  onClick={() => setVisibility('public')}
                />
                <VisibilityOption
                  icon={Lock}
                  label="Private"
                  description="Only you"
                  value="private"
                  selected={visibility === 'private'}
                  onClick={() => setVisibility('private')}
                />
                <VisibilityOption
                  icon={Shield}
                  label="Unlisted"
                  description="Only with link"
                  value="unlisted"
                  selected={visibility === 'unlisted'}
                  onClick={() => setVisibility('unlisted')}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <Label>Pricing</Label>
              <div className="grid grid-cols-3 gap-3">
                <PricingOption
                  label="Free"
                  value="free"
                  selected={pricing === 'free'}
                  onClick={() => setPricing('free')}
                />
                <PricingOption
                  label="Paid"
                  value="paid"
                  selected={pricing === 'paid'}
                  onClick={() => setPricing('paid')}
                />
                <PricingOption
                  label="Premium"
                  value="premium"
                  selected={pricing === 'premium'}
                  onClick={() => setPricing('premium')}
                />
              </div>

              {pricing !== 'free' && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="price">Price (Credits)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="bg-[#1e2128] border-gray-800 text-white pl-10"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#1e2128] rounded-lg border border-gray-800">
                <div className="flex-1">
                  <div className="font-medium text-white">Allow Forking</div>
                  <div className="text-xs text-gray-400">
                    Let others create copies of this script
                  </div>
                </div>
                <Switch checked={allowFork} onCheckedChange={setAllowFork} />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e2128] rounded-lg border border-gray-800">
                <div className="flex-1">
                  <div className="font-medium text-white">Allow Customization</div>
                  <div className="text-xs text-gray-400">
                    Users can modify the script before applying
                  </div>
                </div>
                <Switch
                  checked={allowCustomization}
                  onCheckedChange={setAllowCustomization}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e2128] rounded-lg border border-gray-800">
                <div className="flex-1">
                  <div className="font-medium text-white">Require Attribution</div>
                  <div className="text-xs text-gray-400">
                    Users must credit you when using this script
                  </div>
                </div>
                <Switch
                  checked={requireAttribution}
                  onCheckedChange={setRequireAttribution}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1e2128] rounded-lg border border-gray-800">
                <div className="flex-1">
                  <div className="font-medium text-white">Commercial Use</div>
                  <div className="text-xs text-gray-400">
                    Allow usage for commercial purposes
                  </div>
                </div>
                <Switch
                  checked={allowCommercialUse}
                  onCheckedChange={setAllowCommercialUse}
                />
              </div>
            </div>

            {visibility === 'public' && pricing !== 'free' && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-400 mb-1">
                      Revenue Sharing
                    </div>
                    <p className="text-xs text-gray-400">
                      You'll receive 100% of revenue from this script. You can add
                      collaborators later to share revenue.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-[#1e2128] rounded-lg border border-gray-800">
                <h4 className="font-semibold text-white mb-2">Script Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <StatItem icon={Target} label="Total Events" value={totalEvents} />
                  <StatItem icon={Users} label="Milestones" value={milestoneCount} />
                  <StatItem icon={Check} label="Steps" value={stepCount} />
                  <StatItem icon={FileText} label="Tasks" value={taskCount} />
                  <StatItem
                    icon={Clock}
                    label="Duration"
                    value={`${estimatedDuration}m`}
                  />
                  <StatItem
                    icon={Zap}
                    label="Energy Req."
                    value={totalEvents * 20}
                  />
                </div>
              </div>

              <div className="p-4 bg-[#1e2128] rounded-lg border border-gray-800">
                <h4 className="font-semibold text-white mb-2">What's Included</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>1 primary event with full configuration</span>
                  </li>
                  {milestoneCount > 0 && (
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{milestoneCount} milestone(s) with dependencies</span>
                    </li>
                  )}
                  {stepCount > 0 && (
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{stepCount} step(s) for detailed execution</span>
                    </li>
                  )}
                  {taskCount > 0 && (
                    <li className="flex items-start gap-2 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{taskCount} associated task(s)</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2 text-sm text-gray-400">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>All tags, categories, and metadata</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-400 mb-1">Note</div>
                    <p className="text-xs text-gray-400">
                      Dates and times will not be copied. Users will set their own
                      schedule when applying this script.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()} className="gap-2">
            <FileText className="w-4 h-4" />
            Create Script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper components
function VisibilityOption({
  icon: Icon,
  label,
  description,
  value,
  selected,
  onClick,
}: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border-2 text-left transition-all',
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-800 bg-[#1e2128] hover:border-gray-700'
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 mb-2',
          selected ? 'text-blue-400' : 'text-gray-400'
        )}
      />
      <div
        className={cn(
          'font-medium mb-1',
          selected ? 'text-blue-400' : 'text-white'
        )}
      >
        {label}
      </div>
      <div className="text-xs text-gray-400">{description}</div>
    </button>
  );
}

function PricingOption({ label, value, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border-2 text-center transition-all',
        selected
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-gray-800 bg-[#1e2128] text-white hover:border-gray-700'
      )}
    >
      <div className="font-medium">{label}</div>
    </button>
  );
}

function StatItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}
