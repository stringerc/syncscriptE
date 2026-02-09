import { useState } from 'react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function TasksGoalsPage() {
  const [activeView, setActiveView] = useState<'tasks' | 'goals'>('tasks');

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <h1 className="text-white text-3xl">Tasks & Goals</h1>
        
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'tasks' | 'goals')} defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-white text-xl mb-4">Tasks View</h2>
              <p className="text-gray-400">Tasks content will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="goals">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-white text-xl mb-4">Goals View</h2>
              <p className="text-gray-400">Goals content will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
