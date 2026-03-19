import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface WorkstreamFlowToolbarProps {
  nodeCount: number;
  edgeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onAddEvent: () => void;
  onAutoLayout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
}

export function WorkstreamFlowToolbar({
  nodeCount,
  edgeCount,
  canUndo,
  canRedo,
  onAddEvent,
  onAutoLayout,
  onUndo,
  onRedo,
  onFitView,
}: WorkstreamFlowToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-700/80 bg-[#0f131b] p-2">
      <Button size="sm" className="bg-violet-500 text-white hover:bg-violet-400" onClick={onAddEvent}>
        Add task
      </Button>
      <Button size="sm" variant="outline" className="border-gray-600 text-gray-200" onClick={onAutoLayout}>
        Auto layout
      </Button>
      <Button size="sm" variant="outline" className="border-gray-600 text-gray-200" onClick={onUndo} disabled={!canUndo}>
        Undo
      </Button>
      <Button size="sm" variant="outline" className="border-gray-600 text-gray-200" onClick={onRedo} disabled={!canRedo}>
        Redo
      </Button>
      <Button size="sm" variant="outline" className="border-gray-600 text-gray-200" onClick={onFitView}>
        Fit
      </Button>
      <Badge variant="outline" className="ml-auto border-gray-600 text-gray-300">
        {nodeCount} tasks
      </Badge>
      <Badge variant="outline" className="border-gray-600 text-gray-300">
        {edgeCount} connections
      </Badge>
    </div>
  );
}
