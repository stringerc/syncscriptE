import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CreateEventModal } from '@/components/calendar/CreateEventModal';
import { AddTransactionModal } from '@/components/financial/AddTransactionModal';
import { EnergySelector } from '@/components/energy/EnergySelector';
import { TaskCreationForm } from '@/components/tasks/TaskCreationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Plus, 
  CheckSquare, 
  Calendar, 
  Zap,
  DollarSign,
  Users,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActionsFAB() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEnergySelector, setShowEnergySelector] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const actions = [
    {
      id: 'add-task',
      icon: <CheckSquare className="w-5 h-5" />,
      label: 'Add Task',
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'from-green-600 to-emerald-600',
      onClick: () => {
        console.log('➕ Quick Action: Add Task');
        setShowTaskModal(true);
        setIsOpen(false);
      }
    },
    {
      id: 'new-event',
      icon: <Calendar className="w-4 h-4" />,
      label: 'New Event',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'from-blue-600 to-cyan-600',
      onClick: () => {
        console.log('➕ Quick Action: New Event');
        setShowEventModal(true);
        setIsOpen(false);
      }
    },
    {
      id: 'log-energy',
      icon: <Zap className="w-4 h-4" />,
      label: 'Log Energy',
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'from-purple-600 to-pink-600',
      onClick: () => {
        console.log('➕ Quick Action: Log Energy');
        setShowEnergySelector(true);
        setIsOpen(false);
      }
    },
    {
      id: 'add-transaction',
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Add Transaction',
      color: 'from-orange-500 to-red-500',
      hoverColor: 'from-orange-600 to-red-600',
      onClick: () => {
        console.log('➕ Quick Action: Add Transaction');
        setShowTransactionModal(true);
        setIsOpen(false);
      }
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Action Menu (appears when open) */}
      {isOpen && (
        <div className="flex flex-col gap-2 animate-slide-up">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 pr-5 pl-4 py-3 border-2 border-gray-200 dark:border-gray-700 hover:scale-105"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              {/* Icon */}
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 bg-gradient-to-r",
                  action.color
                )}
              >
                {action.icon}
              </div>
              
              {/* Label */}
              <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-2xl hover:shadow-[0_20px_50px_rgba(147,51,234,0.4)] transition-all duration-300 flex items-center justify-center text-white",
          isOpen && "rotate-45 scale-110"
        )}
        style={{
          backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(236 72 153))',
        }}
        title="Quick Actions (Shift + A)"
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <Plus className="w-7 h-7" />
        )}
      </button>
      
      {/* Modals */}
      <CreateEventModal 
        open={showEventModal} 
        onClose={() => setShowEventModal(false)}
      />
      
      <AddTransactionModal 
        open={showTransactionModal} 
        onClose={() => setShowTransactionModal(false)}
      />
      
      <Dialog open={showEnergySelector} onOpenChange={setShowEnergySelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Log Your Energy</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Select your current energy level to optimize your tasks.
            </DialogDescription>
          </DialogHeader>
          <EnergySelector 
            currentEnergy="MEDIUM"
            onEnergyChange={(energy) => {
              console.log('⚡ Energy logged:', energy);
              toast({
                title: `⚡ Energy Logged!`,
                description: `Your ${energy} energy has been set.`,
                duration: 3000,
              });
              setShowEnergySelector(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              Add New Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a task and match it to your energy level.
            </DialogDescription>
          </DialogHeader>
          <TaskCreationForm 
            onSuccess={() => {
              toast({
                title: '✅ Task Created!',
                description: 'Your task has been saved and added to your list.',
                duration: 3000,
              });
              setShowTaskModal(false);
            }}
            onCancel={() => setShowTaskModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

