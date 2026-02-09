import { DashboardLayout } from '../layout/DashboardLayout';
import { Calendar as CalendarIcon } from 'lucide-react';

export function CalendarEventsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto hide-scrollbar p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <CalendarIcon className="w-6 h-6 text-teal-400" />
            <h1 className="text-2xl text-white">Calendar & Events</h1>
          </div>
          
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-8">
            <div className="text-center">
              <p className="text-white mb-2">Calendar page is loading...</p>
              <p className="text-gray-400 text-sm">If you're seeing this, the Calendar route works!</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}