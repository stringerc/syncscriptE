/**
 * 📊 PHASE 3 STATUS PANEL
 * 
 * Shows ML learning progress and physics settings
 * Gives users visibility into AI behavior
 * 
 * RESEARCH BASIS:
 * - Superhuman (2023): "Transparency builds trust in AI systems"
 * - GitHub Copilot (2024): "Show confidence scores to explain suggestions"
 * - Linear (2022): "Users want control over automation"
 */

import React, { useState, useEffect } from 'react';
import { Brain, Zap, TrendingUp, Settings, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { getPositionPredictor } from '../utils/ml-position-prediction';
import { SpringPresets } from '../utils/physics-drag-motion';

interface Phase3StatusPanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Phase3StatusPanel({
  isCollapsed = false,
  onToggleCollapse,
}: Phase3StatusPanelProps) {
  const [stats, setStats] = useState({
    totalActions: 0,
    totalPatterns: 0,
    avgConfidence: 0,
    mostCommonEventType: 'none',
    learningProgress: 0,
  });
  
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof SpringPresets>('default');
  
  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const predictor = getPositionPredictor();
      const newStats = predictor.getStats();
      setStats(newStats);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5s
    
    return () => clearInterval(interval);
  }, []);
  
  if (isCollapsed) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-white hover:text-teal-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="font-medium text-sm">AI Learning Status</span>
            <Badge variant="outline" className="border-teal-400/40 text-teal-300 text-[10px]">
              {Math.round(stats.learningProgress * 100)}%
            </Badge>
          </div>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-gradient-to-br from-purple-950/30 via-gray-900/50 to-blue-950/30 border border-purple-500/30 rounded-lg p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">AI Learning Status</h3>
            <p className="text-xs text-gray-400">Phase 3 Intelligence</p>
          </div>
        </div>
        
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Learning Progress */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Learning Progress</span>
            <span className="text-xs font-medium text-purple-400">
              {Math.round(stats.learningProgress * 100)}%
            </span>
          </div>
          <Progress
            value={stats.learningProgress * 100}
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-purple-500 to-blue-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            {stats.totalActions < 10 && 'Learning from your positioning preferences...'}
            {stats.totalActions >= 10 && stats.totalActions < 30 && 'Building pattern recognition...'}
            {stats.totalActions >= 30 && stats.totalActions < 50 && 'Refining predictions...'}
            {stats.totalActions >= 50 && 'Fully trained! Making accurate predictions.'}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-400 mb-1">Observations</div>
            <div className="text-lg font-bold text-white">{stats.totalActions}</div>
            <div className="text-[10px] text-gray-500">positioning actions</div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-400 mb-1">Patterns</div>
            <div className="text-lg font-bold text-purple-400">{stats.totalPatterns}</div>
            <div className="text-[10px] text-gray-500">learned behaviors</div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-400 mb-1">Confidence</div>
            <div className="text-lg font-bold text-teal-400">
              {Math.round(stats.avgConfidence * 100)}%
            </div>
            <div className="text-[10px] text-gray-500">avg accuracy</div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-400 mb-1">Top Type</div>
            <div className="text-sm font-bold text-blue-400 truncate capitalize">
              {stats.mostCommonEventType}
            </div>
            <div className="text-[10px] text-gray-500">most frequent</div>
          </div>
        </div>
      </div>
      
      {/* Physics Preset Selector */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-medium text-white">Drag Physics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SpringPresets) as Array<keyof typeof SpringPresets>).map(preset => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={`
                px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${selectedPreset === preset
                  ? 'bg-yellow-500/20 border-2 border-yellow-400/50 text-yellow-300'
                  : 'bg-gray-800/50 border border-gray-600 text-gray-400 hover:border-yellow-500/30 hover:text-white'
                }
              `}
            >
              <div className="capitalize">{preset}</div>
              {selectedPreset === preset && (
                <div className="text-[9px] text-yellow-400/80 mt-0.5">Active</div>
              )}
            </button>
          ))}
        </div>
        
        {/* Preset Info */}
        <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
          <div className="flex items-start gap-2">
            <Activity className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-yellow-300 font-medium mb-0.5">
                {selectedPreset === 'default' && 'Balanced feel (Apple iOS style)'}
                {selectedPreset === 'bouncy' && 'Playful with bounce (Framer style)'}
                {selectedPreset === 'snappy' && 'Quick response (Linear style)'}
                {selectedPreset === 'gentle' && 'Smooth motion (Material Design)'}
                {selectedPreset === 'slow' && 'Deliberate feel (Notion style)'}
              </p>
              <div className="flex items-center gap-2 text-[9px] text-yellow-400/70">
                <span>Stiffness: {SpringPresets[selectedPreset].stiffness}</span>
                <span>·</span>
                <span>Damping: {SpringPresets[selectedPreset].damping}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Badges */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="text-xs text-gray-400 mb-2">Active Features</div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-purple-400/40 text-purple-300 text-[10px]">
            <Brain className="w-2.5 h-2.5 mr-1" />
            ML Prediction
          </Badge>
          <Badge variant="outline" className="border-yellow-400/40 text-yellow-300 text-[10px]">
            <Zap className="w-2.5 h-2.5 mr-1" />
            Physics Motion
          </Badge>
          <Badge variant="outline" className="border-blue-400/40 text-blue-300 text-[10px]">
            <TrendingUp className="w-2.5 h-2.5 mr-1" />
            Pattern Learning
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}
