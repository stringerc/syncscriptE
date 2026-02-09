import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DashboardLayout } from '../layout/DashboardLayout';

export function TasksGoalsPage() {
  const [activeView, setActiveView] = useState<'tasks' | 'goals'>('tasks');

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <h1 className="text-white">Tasks & Goals - Test Version</h1>
        
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'tasks' | 'goals')}>
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-white text-2xl">Tasks Content</h2>
              <p className="text-gray-400 mt-4">This is the tasks tab content.</p>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-white text-2xl">Goals Content</h2>
              <p className="text-gray-400 mt-4">This is the goals tab content.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
