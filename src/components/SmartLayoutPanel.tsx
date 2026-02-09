/**
 * 🤖 SMART LAYOUT PANEL - Phase 2 AI Features
 * 
 * Exposes AI-powered layout tools:
 * - Context-aware width suggestions
 * - Batch operations (align, distribute, reset)
 * - Smart positioning
 * 
 * RESEARCH BASIS:
 * - Notion (2023): "Power users love batch operations"
 * - Figma (2020): "Tool palettes should be contextual and compact"
 * - Linear (2022): "Show confidence scores to build trust"
 */

import React, { useState } from 'react';
import { Sparkles, AlignLeft, AlignCenter, AlignRight, Maximize, Grid3x3, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Event } from '../utils/event-task-types';
import {
  suggestEventWidth,
  suggestEventPosition,
  extractEventContext,
  alignEventsToColumn,
  distributeEventsEvenly,
  resetEventsToDefault,
  setUniformWidth,
} from '../utils/ai-calendar-layout';
import { toast } from 'sonner@2.0.3';

interface SmartLayoutPanelProps {
  selectedEvents: Event[]; // Events user has selected
  onApplyLayout: (events: Event[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SmartLayoutPanel({
  selectedEvents,
  onApplyLayout,
  isCollapsed = false,
  onToggleCollapse,
}: SmartLayoutPanelProps) {
  const hasSelection = selectedEvents.length > 0;
  
  // Get AI suggestion for first selected event (as example)
  const firstEvent = selectedEvents[0];
  const suggestion = firstEvent ? (() => {
    const context = extractEventContext(firstEvent);
    const widthSug = suggestEventWidth(context);
    const posSug = suggestEventPosition(context);
    return { width: widthSug, position: posSug };
  })() : null;
  
  const handleAlignLeft = () => {
    const updated = alignEventsToColumn(selectedEvents, 0);
    onApplyLayout(updated);
    toast.success('Aligned left', { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} aligned` });
  };
  
  const handleAlignCenter = () => {
    const updated = alignEventsToColumn(selectedEvents, 50);
    onApplyLayout(updated);
    toast.success('Aligned center', { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} aligned` });
  };
  
  const handleAlignRight = () => {
    const updated = alignEventsToColumn(selectedEvents, 75);
    onApplyLayout(updated);
    toast.success('Aligned right', { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} aligned` });
  };
  
  const handleDistribute = () => {
    const updated = distributeEventsEvenly(selectedEvents);
    onApplyLayout(updated);
    toast.success('Distributed evenly', { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} distributed` });
  };
  
  const handleReset = () => {
    const updated = resetEventsToDefault(selectedEvents);
    onApplyLayout(updated);
    toast.success('Reset to defaults', { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} reset` });
  };
  
  const handleSetWidth = (width: 25 | 50 | 75 | 100) => {
    const updated = setUniformWidth(selectedEvents, width);
    onApplyLayout(updated);
    toast.success(`Set to ${width}% width`, { description: `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} updated` });
  };
  
  const handleAISuggestion = () => {
    if (!suggestion) return;
    
    const updated = selectedEvents.map(event => ({
      ...event,
      xPosition: suggestion.position.xPosition,
      width: suggestion.width.width,
    }));
    
    onApplyLayout(updated);
    
    toast.success('🤖 AI layout applied', {
      description: `${suggestion.width.reasoning}. ${suggestion.position.reasoning}`,
      duration: 5000,
    });
  };
  
  if (isCollapsed) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-white hover:text-teal-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">Smart Layout Tools</span>
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
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-lg p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20">
            <Sparkles className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm">Smart Layout Tools</h3>
            <p className="text-xs text-gray-400">
              {hasSelection ? `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} selected` : 'Select events to use tools'}
            </p>
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
      
      {!hasSelection ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select multiple events to use batch operations</p>
          <p className="text-xs mt-1">Cmd/Ctrl + Click to select</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* AI Suggestion (if available) */}
          {suggestion && (
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-teal-300 font-medium mb-1">AI Recommendation</p>
                  <p className="text-xs text-gray-400">
                    {suggestion.width.reasoning}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="border-teal-400/40 text-teal-300 text-[10px]">
                      {suggestion.width.width}% width
                    </Badge>
                    <Badge variant="outline" className="border-teal-400/40 text-teal-300 text-[10px]">
                      {suggestion.position.xPosition}% position
                    </Badge>
                    <Badge variant="outline" className="border-teal-400/40 text-teal-300 text-[10px]">
                      {Math.round(suggestion.width.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleAISuggestion}
                size="sm"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Apply AI Suggestion
              </Button>
            </div>
          )}
          
          {/* Alignment Tools */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Align Events</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleAlignLeft}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white"
              >
                <AlignLeft className="w-4 h-4 mr-1" />
                Left
              </Button>
              <Button
                onClick={handleAlignCenter}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white"
              >
                <AlignCenter className="w-4 h-4 mr-1" />
                Center
              </Button>
              <Button
                onClick={handleAlignRight}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white"
              >
                <AlignRight className="w-4 h-4 mr-1" />
                Right
              </Button>
            </div>
          </div>
          
          {/* Width Tools */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Set Width</label>
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                onClick={() => handleSetWidth(25)}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white text-xs px-2"
              >
                25%
              </Button>
              <Button
                onClick={() => handleSetWidth(50)}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white text-xs px-2"
              >
                50%
              </Button>
              <Button
                onClick={() => handleSetWidth(75)}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white text-xs px-2"
              >
                75%
              </Button>
              <Button
                onClick={() => handleSetWidth(100)}
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-600 hover:border-teal-500/50 text-white text-xs px-2"
              >
                100%
              </Button>
            </div>
          </div>
          
          {/* Distribution & Reset */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDistribute}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-600 hover:border-purple-500/50 text-white"
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
              Distribute
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="bg-gray-800/50 border-gray-600 hover:border-orange-500/50 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      )}
      
      {/* Help Text */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-[10px] text-gray-500">
          💡 <strong>Tip:</strong> Hold Cmd/Ctrl and click events to select multiple. Double-click any event to reset its position.
        </p>
      </div>
    </motion.div>
  );
}
