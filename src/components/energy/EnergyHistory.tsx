import { motion } from 'motion/react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useEnergy } from '../../contexts/EnergyContext';
import { Badge } from '../ui/badge';
import React from 'react';

export function EnergyHistory() {
  const { energy } = useEnergy();
  
  // Group entries by date to create history
  const history = React.useMemo(() => {
    const grouped: Record<string, { date: string; total: number }> = {};
    
    energy.entries.forEach(entry => {
      const date = entry.timestamp.toDateString();
      if (!grouped[date]) {
        grouped[date] = { date, total: 0 };
      }
      grouped[date].total += entry.amount;
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(grouped)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(1); // Skip today (it's shown separately)
  }, [energy.entries]);
  
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No history yet</p>
        <p className="text-sm">Keep completing tasks to build your energy history</p>
      </div>
    );
  }
  
  const maxHistoryEnergy = Math.max(...history.map(h => h.total), energy.totalEnergy);
  const averageEnergy = history.reduce((sum, h) => sum + h.total, 0) / history.length;
  const trend = energy.totalEnergy > averageEnergy ? 'up' : energy.totalEnergy < averageEnergy ? 'down' : 'stable';
  
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{Math.round(energy.totalEnergy)}</div>
          <div className="text-xs text-gray-400 mt-1">Today</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{Math.round(averageEnergy)}</div>
          <div className="text-xs text-gray-400 mt-1">7-Day Avg</div>
        </div>
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <div className="w-5 h-5" />
            )}
            <Badge variant="outline" className={`
              ${trend === 'up' ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''}
              ${trend === 'down' ? 'bg-red-600/20 text-red-400 border-red-600/30' : ''}
              ${trend === 'stable' ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : ''}
            `}>
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
            </Badge>
          </div>
          <div className="text-xs text-gray-400 mt-1">Trend</div>
        </div>
      </div>
      
      {/* History Chart */}
      <div className="space-y-3">
        <h4 className="text-sm text-gray-400 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Daily History
        </h4>
        
        <div className="space-y-2">
          {/* Today (current) */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-400">Today</div>
            <div className="flex-1 relative h-8 bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-yellow-500 to-teal-500 rounded-lg"
                initial={{ width: 0 }}
                animate={{ width: `${(energy.totalEnergy / maxHistoryEnergy) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-xs font-medium text-white drop-shadow-lg">
                  {Math.round(energy.totalEnergy)}
                </span>
              </div>
            </div>
          </div>
          
          {/* History items */}
          {history.slice(0, 7).map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return (
              <motion.div
                key={day.date}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-24 text-sm text-gray-500">
                  <div>{dayName}</div>
                  <div className="text-xs text-gray-600">{dayDate}</div>
                </div>
                <div className="flex-1 relative h-6 bg-gray-800/30 rounded overflow-hidden border border-gray-800">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-600 to-gray-500 rounded opacity-50"
                    style={{ width: `${(day.total / maxHistoryEnergy) * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-xs text-gray-400">
                      {Math.round(day.total)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}