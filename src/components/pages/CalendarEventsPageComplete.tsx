import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Cloud, CloudRain, Sun, Wind, MapPin, Clock, Users, Zap,
  Video, Phone, Navigation, AlertTriangle, TrendingUp, Brain, Sparkles, Check, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DashboardLayout } from '../layout/DashboardLayout';
import { getPageInsights } from '../../utils/insights-config';
import { CalendarImportSelector } from '../CalendarImportSelector';

export function CalendarEventsPage() {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'timeline'>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 22));
  const [showImportSelector, setShowImportSelector] = useState(false);

  return (
    <DashboardLayout>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white mb-2">Calendar & Events</h1>
            <p className="text-gray-400">Energy-aware scheduling with weather and route intelligence</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => setShowImportSelector(true)}
            >
              <Download className="w-4 h-4" />
              Import
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 transition-all"
              onClick={() => toast.success('New Event', { description: 'Event creation coming soon' })}
            >
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Calendar Import Selector */}
        {showImportSelector && (
          <CalendarImportSelector onClose={() => setShowImportSelector(false)} />
        )}

        {/* Calendar View */}
        <div className="mt-4">
          <Tabs defaultValue={currentView} onValueChange={setCurrentView}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Calendar Content */}
        <div className="mt-4">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'day' && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-white mb-2">Day View</h2>
                <p className="text-gray-400">Content for day view goes here</p>
              </div>
            )}
            {currentView === 'week' && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-white mb-2">Week View</h2>
                <p className="text-gray-400">Content for week view goes here</p>
              </div>
            )}
            {currentView === 'month' && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-white mb-2">Month View</h2>
                <p className="text-gray-400">Content for month view goes here</p>
              </div>
            )}
            {currentView === 'timeline' && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-white mb-2">Timeline View</h2>
                <p className="text-gray-400">Content for timeline view goes here</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}