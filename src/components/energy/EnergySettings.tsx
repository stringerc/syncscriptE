import { motion } from 'motion/react';
import { Zap, Eye, Circle } from 'lucide-react';
import { useEnergy } from '../../contexts/EnergyContext';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { EnergyPointsDisplay } from './EnergyPointsDisplay';
import { EnergyAuraDisplay } from './EnergyAuraDisplay';

export function EnergySettings() {
  const { energy, toggleMode } = useEnergy();
  const displayMode = energy.displayMode;
  
  const setDisplayMode = (mode: 'points' | 'aura') => {
    // Only toggle if the requested mode is different from current
    if (mode !== displayMode) {
      toggleMode();
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-medium mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Energy Display Mode
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Choose how you want to visualize your daily energy
        </p>
      </div>
      
      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Points Mode */}
        <motion.button
          onClick={() => setDisplayMode('points')}
          className={`relative bg-gray-800/30 border-2 rounded-xl p-6 transition-all ${
            displayMode === 'points'
              ? 'border-teal-600 bg-teal-600/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {displayMode === 'points' && (
            <motion.div
              className="absolute top-3 right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge className="bg-teal-600 border-0">Active</Badge>
            </motion.div>
          )}
          
          <div className="text-left mb-4">
            <h4 className="text-white font-medium mb-1 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-orange-500 to-teal-500" />
              Points Mode
            </h4>
            <p className="text-sm text-gray-400">
              Segmented bar showing energy by source
            </p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4">
            <EnergyPointsDisplay showLabel={false} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-gray-400">Tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-gray-400">Goals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-gray-400">Milestones</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-400">Achievements</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-gray-400">Health</span>
              </div>
            </div>
          </div>
        </motion.button>
        
        {/* Aura Mode */}
        <motion.button
          onClick={() => setDisplayMode('aura')}
          className={`relative bg-gray-800/30 border-2 rounded-xl p-6 transition-all ${
            displayMode === 'aura'
              ? 'border-purple-600 bg-purple-600/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {displayMode === 'aura' && (
            <motion.div
              className="absolute top-3 right-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Badge className="bg-purple-600 border-0">Active</Badge>
            </motion.div>
          )}
          
          <div className="text-left mb-4">
            <h4 className="text-white font-medium mb-1 flex items-center gap-2">
              <Circle className="w-6 h-6 text-purple-400" />
              Aura Mode
            </h4>
            <p className="text-sm text-gray-400">
              Glowing circle with ROYGBIV color cycling
            </p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col items-center">
            <EnergyAuraDisplay showLabel={false} size="sm" />
            <div className="mt-3 flex gap-1">
              {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'].map((color, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Cycles with completions</p>
          </div>
        </motion.button>
      </div>
      
      {/* Additional Info */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="text-blue-300 font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />
          How Energy Works
        </h4>
        <div className="text-gray-400 space-y-1">
          <p>• Gain energy by completing tasks, goals, milestones, achievements, and health actions</p>
          <p>• Energy resets daily at midnight</p>
          <p>• Your history is preserved for tracking progress</p>
          <p>• Inactivity and missed commitments cause energy decay</p>
          <p>• Total energy shown - no per-source numeric breakdown</p>
        </div>
      </div>
    </div>
  );
}