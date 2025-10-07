import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Emblem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  bonusType: string;
  bonusValue: number;
  isUnlocked: boolean;
  isEquipped: boolean;
  progress: number;
}

interface EmblemGalleryModalProps {
  open: boolean;
  onClose: () => void;
  emblems: Emblem[];
  onEquip: (emblemId: string) => void;
  onUnequip: (emblemId: string) => void;
}

const rarityStyles = {
  common: {
    gradient: 'linear-gradient(to bottom right, rgb(156 163 175), rgb(209 213 219))',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    label: 'Common',
    emoji: '⚪'
  },
  rare: {
    gradient: 'linear-gradient(to bottom right, rgb(59 130 246), rgb(6 182 212))',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    label: 'Rare',
    emoji: '🔵'
  },
  epic: {
    gradient: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    label: 'Epic',
    emoji: '🟣'
  },
  legendary: {
    gradient: 'linear-gradient(to bottom right, rgb(234 179 8), rgb(249 115 22), rgb(239 68 68))',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    label: 'Legendary',
    emoji: '🟡'
  }
};

export function EmblemGalleryModal({ 
  open, 
  onClose, 
  emblems, 
  onEquip, 
  onUnequip 
}: EmblemGalleryModalProps) {
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  const filteredEmblems = selectedRarity === 'all' 
    ? emblems 
    : emblems.filter(e => e.rarity === selectedRarity);

  const unlockedCount = emblems.filter(e => e.isUnlocked).length;
  const equippedEmblem = emblems.find(e => e.isEquipped);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Emblem Collection
          </DialogTitle>
          <DialogDescription>
            {unlockedCount} / {emblems.length} emblems unlocked
            {equippedEmblem && (
              <span className="ml-2 text-purple-600">
                • Equipped: {equippedEmblem.emoji} {equippedEmblem.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Rarity Filters */}
        <Tabs value={selectedRarity} onValueChange={setSelectedRarity}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({emblems.length})</TabsTrigger>
            <TabsTrigger value="common">⚪ Common</TabsTrigger>
            <TabsTrigger value="rare">🔵 Rare</TabsTrigger>
            <TabsTrigger value="epic">🟣 Epic</TabsTrigger>
            <TabsTrigger value="legendary">🟡 Legendary</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedRarity} className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredEmblems.map((emblem) => {
                const rarity = rarityStyles[emblem.rarity];
                
                return (
                  <div
                    key={emblem.id}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all",
                      emblem.isUnlocked 
                        ? "border-transparent hover:scale-105 cursor-pointer" 
                        : "border-gray-200 opacity-60"
                    )}
                    style={emblem.isUnlocked ? { backgroundImage: rarity.gradient } : { backgroundColor: '#f9fafb' }}
                  >
                    {/* Locked Overlay */}
                    {!emblem.isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    {/* Equipped Badge */}
                    {emblem.isEquipped && (
                      <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg border-2 border-green-500">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    )}

                    <div className={cn(
                      "text-center",
                      emblem.isUnlocked ? "text-white" : "text-gray-500"
                    )}>
                      <div className="text-5xl mb-2">{emblem.emoji}</div>
                      <div className="font-bold text-lg mb-1">{emblem.name}</div>
                      <div className={cn(
                        "text-xs mb-2",
                        emblem.isUnlocked ? "text-white/80" : "text-gray-400"
                      )}>
                        {emblem.description}
                      </div>

                      {/* Rarity Badge */}
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "mb-2 text-xs",
                          emblem.isUnlocked ? "bg-white/20 text-white border-white/30" : ""
                        )}
                      >
                        {rarity.emoji} {rarity.label}
                      </Badge>

                      {/* Bonus Display */}
                      {emblem.isUnlocked && (
                        <div className={cn(
                          "text-sm font-semibold",
                          emblem.isUnlocked ? "text-white" : "text-gray-600"
                        )}>
                          +{emblem.bonusValue}% {emblem.bonusType.replace('_', ' ')}
                        </div>
                      )}

                      {/* Progress Bar (if locked) */}
                      {!emblem.isUnlocked && emblem.progress > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-1">{emblem.progress}% complete</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${emblem.progress}%`,
                                backgroundImage: rarity.gradient
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Equip/Unequip Button */}
                      {emblem.isUnlocked && (
                        <Button
                          size="sm"
                          variant={emblem.isEquipped ? "secondary" : "default"}
                          className={cn(
                            "mt-3 w-full",
                            emblem.isEquipped 
                              ? "bg-white/20 hover:bg-white/30 text-white border-white/30" 
                              : "bg-white/90 hover:bg-white text-gray-900"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            emblem.isEquipped ? onUnequip(emblem.id) : onEquip(emblem.id);
                          }}
                        >
                          {emblem.isEquipped ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Equipped
                            </>
                          ) : (
                            'Equip'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

