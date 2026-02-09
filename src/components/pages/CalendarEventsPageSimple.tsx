import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { DashboardLayout } from '../layout/DashboardLayout';

export function CalendarEventsPageSimple() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'week'>('week');

  // Simple week view data
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  // Sample events
  const events = [
    { id: 1, title: 'Team Standup', day: 'Monday', startHour: 9, duration: 1, color: 'bg-teal-600' },
    { id: 2, title: 'Client Call', day: 'Tuesday', startHour: 14, duration: 2, color: 'bg-blue-600' },
    { id: 3, title: 'Design Review', day: 'Wednesday', startHour: 10, duration: 1, color: 'bg-purple-600' },
    { id: 4, title: 'Sprint Planning', day: 'Thursday', startHour: 13, duration: 2, color: 'bg-orange-600' },
    { id: 5, title: 'One-on-One', day: 'Friday', startHour: 15, duration: 1, color: 'bg-green-600' },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Calendar & Events</h1>
            <p className="text-gray-400">Schedule and manage your events</p>
          </div>
          <Button 
            className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
          >
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        </div>

        {/* Calendar Controls */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-white font-medium">
                Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </div>

        {/* Week Calendar */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-6 border-b border-gray-800">
            <div className="p-3 border-r border-gray-800/50 text-sm text-gray-500">Time</div>
            {weekDays.map((day) => (
              <div key={day} className="p-3 border-r border-gray-800/50 last:border-r-0 text-center">
                <div className="text-white font-medium">{day}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(2025, 11, weekDays.indexOf(day) + 22).getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto hide-scrollbar">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-6 border-b border-gray-800/50 last:border-b-0">
                <div className="p-3 border-r border-gray-800/50 text-sm text-gray-500">
                  {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                </div>
                {weekDays.map((day) => {
                  const dayEvents = events.filter(e => e.day === day && e.startHour === hour);
                  return (
                    <div 
                      key={day} 
                      className="p-2 border-r border-gray-800/50 last:border-r-0 min-h-[80px] hover:bg-gray-800/30 transition-colors"
                    >
                      {dayEvents.map(event => (
                        <motion.div
                          key={event.id}
                          className={`${event.color} rounded p-2 mb-1 text-xs text-white cursor-pointer hover:opacity-90 transition-opacity`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs opacity-75">{event.duration}h</div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Events This Week', value: '12', icon: CalendarIcon, color: 'text-teal-400' },
            { label: 'Meeting Hours', value: '18h', icon: CalendarIcon, color: 'text-blue-400' },
            { label: 'Focus Time', value: '22h', icon: CalendarIcon, color: 'text-purple-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-[#1e2128] border border-gray-800 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}