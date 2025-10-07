import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EnergySelectorProps {
  currentEnergy?: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
  onEnergyChange: (energy: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK') => void;
  className?: string;
  compact?: boolean;
}

const energyLevels = [
  {
    id: 'LOW',
    label: 'Low',
    emoji: '😴',
    description: 'Tired, need rest',
    gradient: 'linear-gradient(to bottom right, rgb(239 68 68), rgb(249 115 22), rgb(234 179 8))',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  {
    id: 'MEDIUM',
    label: 'Medium',
    emoji: '😐',
    description: 'Moderate, routine work',
    gradient: 'linear-gradient(to bottom right, rgb(234 179 8), rgb(245 158 11), rgb(249 115 22))',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 'HIGH',
    label: 'High',
    emoji: '⚡',
    description: 'Focused, productive',
    gradient: 'linear-gradient(to bottom right, rgb(34 197 94), rgb(16 185 129), rgb(20 184 166))',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  {
    id: 'PEAK',
    label: 'Peak',
    emoji: '🔥',
    description: 'Ultimate flow state',
    gradient: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153), rgb(249 115 22))',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50'
  }
];

export function EnergySelector({ 
  currentEnergy = 'MEDIUM', 
  onEnergyChange, 
  className = '',
  compact = false 
}: EnergySelectorProps) {
  const [selectedEnergy, setSelectedEnergy] = useState(currentEnergy);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEnergySelect = (energyId: string) => {
    const energy = energyId as 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
    setSelectedEnergy(energy);
    onEnergyChange(energy);
    setIsExpanded(false);
    console.log(`⚡ Energy changed to: ${energy}`);
  };

  const currentLevel = energyLevels.find(e => e.id === selectedEnergy) || energyLevels[1];

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto py-2 px-4 text-white font-semibold shadow-lg hover:shadow-xl"
          style={{ backgroundImage: currentLevel.gradient }}
        >
          <span className="text-2xl mr-2">{currentLevel.emoji}</span>
          <span>{currentLevel.label}</span>
        </Button>

        {isExpanded && (
          <Card className="absolute top-full mt-2 right-0 p-2 shadow-xl z-50 min-w-[200px]">
            <div className="space-y-1">
              {energyLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleEnergySelect(level.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors",
                    selectedEnergy === level.id && level.bgColor
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{level.emoji}</span>
                    <div className="flex-1">
                      <div className={cn("font-semibold text-sm", level.textColor)}>
                        {level.label}
                      </div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">How's your energy?</h3>
        <p className="text-sm text-gray-600">Select your current energy level</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {energyLevels.map((level) => {
          const isSelected = selectedEnergy === level.id;
          
          return (
            <button
              key={level.id}
              onClick={() => handleEnergySelect(level.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all",
                isSelected 
                  ? "border-transparent shadow-xl scale-105" 
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              )}
              style={isSelected ? { backgroundImage: level.gradient } : { backgroundColor: 'white' }}
            >
              <div className={cn(
                "text-center",
                isSelected ? "text-white" : "text-gray-900"
              )}>
                <div className="text-4xl mb-2">{level.emoji}</div>
                <div className="font-bold text-lg mb-1">{level.label}</div>
                <div className={cn(
                  "text-xs",
                  isSelected ? "text-white/80" : "text-gray-500"
                )}>
                  {level.description}
                </div>
              </div>
              
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

