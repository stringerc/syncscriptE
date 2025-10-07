import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Zap, Tag, FileText } from 'lucide-react';

interface TaskCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingTask?: any; // Task to edit (optional)
}

export function TaskCreationForm({ onSuccess, onCancel, editingTask }: TaskCreationFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(editingTask?.priority || 'MEDIUM');
  const [energyLevel, setEnergyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK'>(editingTask?.energyLevel || 'HIGH');
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: '❌ Validation Error',
        description: 'Please enter a task title',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    if (editingTask) {
      // Update existing task
      const updatedTask = {
        ...editingTask,
        title: title.trim(),
        description: description.trim() || '',
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        basePoints: priority === 'HIGH' ? 150 : priority === 'MEDIUM' ? 100 : 50,
        updatedAt: new Date().toISOString()
      };

      // Update in local storage
      try {
        const existingTasks = JSON.parse(localStorage.getItem('syncscript-local-tasks') || '[]');
        const updatedTasks = existingTasks.map((t: any) => 
          t.id === editingTask.id ? updatedTask : t
        );
        localStorage.setItem('syncscript-local-tasks', JSON.stringify(updatedTasks));
        console.log('✏️ Task updated in local storage:', updatedTask.title);
      } catch (error) {
        console.error('❌ Failed to update task in local storage:', error);
      }

      // Update backend in background (don't block UI)
      try {
        const response = await Promise.race([
          api.put(`/tasks/${editingTask.id}`, {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            energyLevel,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            status: updatedTask.status || 'PENDING'
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        console.log('✅ Task updated and saved to backend:', response);
      } catch (error: any) {
        console.error('❌ Failed to update task in backend:', error.message || error);
        console.log('💾 Task remains in local storage only');
        // Don't show error to user - task was already updated locally
        // Backend will be synced later
      }

      // Show success toast
      toast({
        title: '✏️ Task Updated!',
        description: `${updatedTask.title} has been updated`,
        duration: 3000,
      });

      onSuccess();
    } else {
      // Create new task
      const newTask = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim() || '',
        priority,
        energyLevel,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'PENDING',
        completed: false,
        basePoints: priority === 'HIGH' ? 150 : priority === 'MEDIUM' ? 100 : 50,
        energyBonus: 0,
        tags: [],
        isLocal: true,
        createdAt: new Date().toISOString()
      };

      // Save to local storage immediately
      try {
        const existingTasks = JSON.parse(localStorage.getItem('syncscript-local-tasks') || '[]');
        const updatedTasks = [...existingTasks, newTask];
        localStorage.setItem('syncscript-local-tasks', JSON.stringify(updatedTasks));
        console.log('💾 Task saved to local storage:', newTask.title);
      } catch (error) {
        console.error('❌ Failed to save to local storage:', error);
      }

      // Show success immediately (optimistic UI)
      onSuccess();
    }

    // Save to backend in background (don't block UI)
    try {
      const response = await Promise.race([
        api.post('/tasks', {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          energyLevel,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          status: 'PENDING'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      console.log('✅ Task created and saved to backend:', response);
    } catch (error: any) {
      console.error('❌ Failed to save task to backend:', error.message || error);
      console.log('💾 Task remains in local storage only');
      // Don't show error to user - task was already created locally
      // Backend will be synced later
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors = {
    LOW: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
    MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600',
    HIGH: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
  };

  const energyColors = {
    LOW: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600',
    MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600',
    HIGH: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
    PEAK: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600',
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Title */}
      <div>
        <label htmlFor="task-title" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Task Title
        </label>
        <input 
          id="task-title"
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Write Q4 Strategy"
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="task-description" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Description (Optional)
        </label>
        <textarea 
          id="task-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this task..."
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Priority
        </label>
        <div className="flex gap-2">
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                priority === p ? priorityColors[p] : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div>
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Required Energy Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['LOW', 'MEDIUM', 'HIGH', 'PEAK'] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEnergyLevel(e)}
              className={`py-2 px-4 rounded-lg border-2 transition-all ${
                energyLevel === e ? energyColors[e] : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="task-due-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Due Date (Optional)
        </label>
        <input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Preview */}
      {title && (
        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Preview</div>
          <div className="font-semibold text-gray-900 dark:text-white mb-2">{title}</div>
          {description && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">{description}</div>
          )}
          <div className="flex gap-2">
            <Badge className={priorityColors[priority]}>
              {priority} Priority
            </Badge>
            <Badge className={energyColors[energyLevel]}>
              {energyLevel} Energy
            </Badge>
            {dueDate && (
              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                Due: {new Date(dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 text-white"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))' }}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (editingTask ? '⏳ Updating...' : '⏳ Creating...') 
            : (editingTask ? '✏️ Update Task' : 'Create Task')
          }
        </Button>
      </div>
    </form>
  );
}

