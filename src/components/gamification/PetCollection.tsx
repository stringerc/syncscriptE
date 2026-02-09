import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart, Star, Zap, Shield, Droplet, Sun, Moon,
  Sparkles, TrendingUp, Award, Lock, CheckCircle2,
  Flame, Mountain, Users, Brain, Coffee, Gift
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Pet, PetSpecies, PetElement } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';
import { PET_SPECIES } from '../../data/gamification-data';

interface PetCollectionProps {
  className?: string;
}

export function PetCollection({ className }: PetCollectionProps) {
  const { profile, ownedPets, activePet, setActivePet, feedPet } = useGamification();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showPetDetails, setShowPetDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'collection' | 'active'>('active');
  
  const getElementIcon = (element: PetElement) => {
    switch (element) {
      case 'fire': return Flame;
      case 'air': return Sparkles;
      case 'earth': return Mountain;
      case 'water': return Droplet;
      case 'light': return Sun;
      case 'shadow': return Moon;
    }
  };
  
  const getElementColor = (element: PetElement) => {
    switch (element) {
      case 'fire': return '#EF4444';
      case 'air': return '#3B82F6';
      case 'earth': return '#10B981';
      case 'water': return '#06B6D4';
      case 'light': return '#FBBF24';
      case 'shadow': return '#8B5CF6';
    }
  };
  
  const handlePetClick = (pet: Pet) => {
    setSelectedPet(pet);
    setShowPetDetails(true);
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            Pet Collection
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Collect and nurture companions that boost your productivity
          </p>
        </div>
        <Badge variant="outline" className="text-pink-400 border-pink-400">
          {ownedPets.length} / {PET_SPECIES.length} Collected
        </Badge>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="active">
            Active Pet
          </TabsTrigger>
          <TabsTrigger value="collection">
            Collection ({ownedPets.length}/{PET_SPECIES.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Active Pet Tab */}
        <TabsContent value="active">
          {activePet ? (
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pet Display */}
                <div>
                  <div 
                    className="relative w-full aspect-square rounded-xl flex items-center justify-center mb-4"
                    style={{ 
                      backgroundColor: `${getElementColor(activePet.element)}20`,
                      border: `3px solid ${getElementColor(activePet.element)}`
                    }}
                  >
                    <div className="text-8xl">{activePet.isShiny ? '✨' : '🐾'}</div>
                    {activePet.isShiny && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        animate={{
                          boxShadow: [
                            `0 0 20px ${getElementColor(activePet.element)}`,
                            `0 0 40px ${getElementColor(activePet.element)}`,
                            `0 0 20px ${getElementColor(activePet.element)}`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-white text-2xl font-bold mb-1">
                      {activePet.nickname}
                      {activePet.isShiny && (
                        <Sparkles className="w-5 h-5 text-yellow-400 inline ml-2" />
                      )}
                    </h3>
                    <p className="text-gray-400 mb-3">{activePet.speciesName}</p>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge 
                        variant="outline"
                        style={{ color: getElementColor(activePet.element), borderColor: getElementColor(activePet.element) }}
                      >
                        {(() => {
                          const Icon = getElementIcon(activePet.element);
                          return <Icon className="w-3 h-3 mr-1" />;
                        })()}
                        {activePet.element.charAt(0).toUpperCase() + activePet.element.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        Level {activePet.level}
                      </Badge>
                      <Badge variant="outline" className="text-purple-400 border-purple-400 capitalize">
                        {activePet.stage}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Pet Stats */}
                <div className="space-y-4">
                  {/* Level Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Level Progress</span>
                      <span className="text-white">{activePet.xp} / {activePet.nextLevelXp} XP</span>
                    </div>
                    <Progress value={(activePet.xp / activePet.nextLevelXp) * 100} className="h-2" />
                  </div>
                  
                  {/* Happiness */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Heart className="w-4 h-4 text-pink-400" />
                        Happiness
                      </span>
                      <span className="text-white">{activePet.happiness}%</span>
                    </div>
                    <Progress 
                      value={activePet.happiness} 
                      className="h-2"
                      indicatorClassName="bg-gradient-to-r from-pink-500 to-red-500"
                    />
                  </div>
                  
                  {/* Hunger */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Coffee className="w-4 h-4 text-orange-400" />
                        Hunger
                      </span>
                      <span className="text-white">{activePet.hunger}%</span>
                    </div>
                    <Progress 
                      value={activePet.hunger} 
                      className="h-2"
                      indicatorClassName={
                        activePet.hunger > 70 ? 'bg-green-500' :
                        activePet.hunger > 30 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }
                    />
                    {activePet.hunger < 50 && (
                      <div className="text-xs text-orange-400 mt-1">
                        Your pet is hungry! Feed it to maintain happiness.
                      </div>
                    )}
                  </div>
                  
                  {/* Bonuses */}
                  <div className="pt-4 border-t border-gray-700">
                    <h4 className="text-white font-semibold mb-3">Active Bonuses</h4>
                    <div className="space-y-2">
                      {activePet.bonuses.map((bonus, i) => (
                        <div key={i} className="flex items-center justify-between bg-[#252830] border border-gray-700 rounded-lg p-2">
                          <span className="text-gray-300 text-sm">{bonus.description}</span>
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            +{bonus.value}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                      onClick={() => feedPet(activePet.id)}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Feed Pet ({profile.inventory.petFood})
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePetClick(activePet)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">No Active Pet</h3>
              <p className="text-gray-400 mb-4">
                Select a pet from your collection to set it as active
              </p>
              <Button onClick={() => setActiveTab('collection')}>
                View Collection
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Collection Tab */}
        <TabsContent value="collection">
          {ownedPets.length === 0 ? (
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">No Pets Yet</h3>
              <p className="text-gray-400 mb-4">
                Complete quests and achievements to hatch your first pet!
              </p>
              <Badge variant="outline" className="text-purple-400 border-purple-400">
                Coming Soon: Pet Eggs
              </Badge>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedPets.map((pet, index) => {
                const Icon = getElementIcon(pet.element);
                const isActive = activePet?.id === pet.id;
                
                return (
                  <motion.div
                    key={pet.id}
                    className={`bg-[#1e2128] border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      isActive ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'
                    }`}
                    onClick={() => handlePetClick(pet)}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Pet Image */}
                    <div 
                      className="relative w-full aspect-square rounded-lg flex items-center justify-center mb-3"
                      style={{ 
                        backgroundColor: `${getElementColor(pet.element)}20`,
                        border: `2px solid ${getElementColor(pet.element)}50`
                      }}
                    >
                      <div className="text-6xl">{pet.isShiny ? '✨' : '🐾'}</div>
                      {isActive && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                            ACTIVE
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Pet Info */}
                    <h4 className="text-white font-semibold mb-1 truncate">
                      {pet.nickname}
                      {pet.isShiny && <Sparkles className="w-3 h-3 text-yellow-400 inline ml-1" />}
                    </h4>
                    <p className="text-gray-400 text-sm mb-2">{pet.speciesName}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ color: getElementColor(pet.element), borderColor: `${getElementColor(pet.element)}50` }}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        Lv{pet.level}
                      </Badge>
                      <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs capitalize">
                        {pet.stage}
                      </Badge>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Happiness</div>
                        <div className="text-white font-semibold">{pet.happiness}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Hunger</div>
                        <div className="text-white font-semibold">{pet.hunger}%</div>
                      </div>
                    </div>
                    
                    {!isActive && (
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePet(pet.id);
                        }}
                      >
                        Set Active
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {/* Pokédex-Style Species Grid */}
          <div className="mt-8">
            <h3 className="text-white font-bold mb-4">All Species</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {PET_SPECIES.map((species) => {
                const owned = ownedPets.some(p => p.speciesId === species.id);
                const Icon = getElementIcon(species.element);
                
                return (
                  <div
                    key={species.id}
                    className={`bg-[#1e2128] border rounded-lg p-3 text-center ${
                      owned ? 'border-gray-700' : 'border-gray-800 opacity-50'
                    }`}
                  >
                    <div 
                      className="w-16 h-16 rounded-lg mx-auto mb-2 flex items-center justify-center text-3xl"
                      style={{ 
                        backgroundColor: owned ? `${getElementColor(species.element)}20` : '#1e2128',
                        border: `2px solid ${owned ? getElementColor(species.element) : '#374151'}50`
                      }}
                    >
                      {owned ? '🐾' : '?'}
                    </div>
                    <div className="text-white text-xs font-semibold truncate">
                      {owned ? species.name : '???'}
                    </div>
                    {owned && (
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-[10px]"
                        style={{ color: getElementColor(species.element), borderColor: `${getElementColor(species.element)}50` }}
                      >
                        <Icon className="w-2 h-2 mr-1" />
                        {species.element}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Pet Details Dialog */}
      <Dialog open={showPetDetails} onOpenChange={setShowPetDetails}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-2xl">
          {selectedPet && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <span className="text-4xl">{selectedPet.isShiny ? '✨' : '🐾'}</span>
                  {selectedPet.nickname}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedPet.speciesName} • {selectedPet.element.charAt(0).toUpperCase() + selectedPet.element.slice(1)} Element
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Level</div>
                    <div className="text-white text-2xl font-bold">{selectedPet.level}</div>
                  </div>
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Stage</div>
                    <div className="text-white text-lg font-bold capitalize">{selectedPet.stage}</div>
                  </div>
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Rarity</div>
                    <div className="text-white text-lg font-bold">
                      {selectedPet.isShiny ? 'Shiny ✨' : 'Normal'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Bonuses</h4>
                  <div className="space-y-2">
                    {selectedPet.bonuses.map((bonus, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-300">{bonus.description}</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          +{bonus.value}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedPet.traits && selectedPet.traits.length > 0 && (
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Traits</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPet.traits.map((trait, i) => (
                        <Badge key={i} variant="outline" className="text-purple-400 border-purple-400">
                          {trait.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
