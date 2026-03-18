import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, ArrowRight, GitBranch } from 'lucide-react';
import type { WorkstreamNode } from '../utils/workstream-promotion';

interface WorkstreamCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  milestones: Array<{
    id: string;
    title: string;
    steps?: Array<{ id: string; title: string }>;
  }>;
  onPromoteNode: (node: WorkstreamNode) => void;
}

function flattenNodes(taskId: string, taskTitle: string, milestones: WorkstreamCanvasModalProps['milestones']): WorkstreamNode[] {
  const nodes: WorkstreamNode[] = [{ id: taskId, title: taskTitle, level: 'task' }];
  for (const milestone of milestones) {
    nodes.push({
      id: milestone.id,
      title: milestone.title,
      level: 'milestone',
      parentId: taskId,
    });
    for (const step of milestone.steps || []) {
      nodes.push({
        id: step.id,
        title: step.title,
        level: 'step',
        parentId: milestone.id,
      });
    }
  }
  return nodes;
}

export function WorkstreamCanvasModal({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  milestones,
  onPromoteNode,
}: WorkstreamCanvasModalProps) {
  const nodes = useMemo(() => flattenNodes(taskId, taskTitle, milestones), [taskId, taskTitle, milestones]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#171b22] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-300" />
            Workstream Canvas (MVP)
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Select a node and promote it to a project shell.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => setSelectedNodeId(node.id)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                selectedNodeId === node.id
                  ? 'border-purple-500/60 bg-purple-500/10'
                  : 'border-gray-700 bg-[#1f2430] hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-gray-600 text-gray-300 text-[10px]">
                  {node.level}
                </Badge>
                <p className="text-sm text-white">{node.title}</p>
              </div>
              {node.parentId && (
                <p className="text-[11px] text-gray-500 mt-1">parent: {node.parentId}</p>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-3">
          <p className="text-xs text-gray-400">
            {selectedNode ? `Selected ${selectedNode.level}: ${selectedNode.title}` : 'Select a node to promote'}
          </p>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!selectedNode}
            onClick={() => {
              if (!selectedNode) return;
              onPromoteNode(selectedNode);
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Promote to Project
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
