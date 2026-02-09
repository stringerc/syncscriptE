import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertTriangle, Shield, AlertCircle, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'mitigating' | 'resolved';
  owner: string;
  mitigationPlan: string;
  createdAt: string;
  updatedAt: string;
}

interface RiskManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  existingRisks: Risk[];
  onAddRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateRisk: (riskId: string, updates: Partial<Risk>) => void;
  mode?: 'add' | 'edit';
  editingRisk?: Risk | null;
}

export function RiskManagementDialog({ 
  open, 
  onOpenChange, 
  goalTitle,
  existingRisks,
  onAddRisk,
  onUpdateRisk,
  mode = 'add',
  editingRisk
}: RiskManagementDialogProps) {
  const [title, setTitle] = useState(editingRisk?.title || '');
  const [description, setDescription] = useState(editingRisk?.description || '');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>(editingRisk?.severity || 'medium');
  const [status, setStatus] = useState<'active' | 'mitigating' | 'resolved'>(editingRisk?.status || 'active');
  const [owner, setOwner] = useState(editingRisk?.owner || '');
  const [mitigationPlan, setMitigationPlan] = useState(editingRisk?.mitigationPlan || '');

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a risk title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a risk description');
      return;
    }

    const riskData = {
      title: title.trim(),
      description: description.trim(),
      severity,
      status,
      owner: owner.trim(),
      mitigationPlan: mitigationPlan.trim(),
    };

    if (mode === 'edit' && editingRisk) {
      onUpdateRisk(editingRisk.id, riskData);
      toast.success('Risk updated', { description: 'Risk has been updated successfully' });
    } else {
      onAddRisk(riskData);
      toast.success('Risk added', { description: 'New risk has been added to goal' });
    }

    // Reset form
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setStatus('active');
    setOwner('');
    setMitigationPlan('');
  };

  const severityOptions = [
    { value: 'low', label: 'Low', icon: AlertCircle, color: 'text-blue-400' },
    { value: 'medium', label: 'Medium', icon: AlertTriangle, color: 'text-amber-400' },
    { value: 'high', label: 'High', icon: AlertOctagon, color: 'text-orange-400' },
    { value: 'critical', label: 'Critical', icon: Shield, color: 'text-red-400' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-red-500/20 text-red-400 border-red-500' },
    { value: 'mitigating', label: 'Mitigating', color: 'bg-amber-500/20 text-amber-400 border-amber-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500' },
  ];

  const teamMembers = [
    'Jordan Smith',
    'Sarah Chen',
    'Marcus Johnson',
    'David Kim',
    'Elena Rodriguez',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'edit' ? 'Edit Risk' : 'Add Risk / Blocker'}
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">{goalTitle}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Risk Title */}
          <div className="space-y-2">
            <Label>Risk Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Page load performance below target"
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk in detail..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity Level</Label>
            <div className="grid grid-cols-4 gap-2">
              {severityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = severity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSeverity(option.value as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? `${option.color} border-current bg-current/20`
                        : 'border-gray-700 bg-[#2a2d35] hover:border-gray-600 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((option) => {
                const isSelected = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value as any)}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      isSelected 
                        ? option.color
                        : 'border-gray-700 bg-[#2a2d35] hover:border-gray-600 text-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label>Risk Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger className="bg-[#2a2d35] border-gray-700 text-white">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2d35] border-gray-700">
                {teamMembers.map((member) => (
                  <SelectItem key={member} value={member} className="text-white hover:bg-gray-700">
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mitigation Plan */}
          <div className="space-y-2">
            <Label>Mitigation Plan</Label>
            <Textarea
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder="Describe how you plan to address this risk..."
              className="bg-[#2a2d35] border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {mode === 'edit' ? 'Update Risk' : 'Add Risk'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
