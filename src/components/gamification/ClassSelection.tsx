import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap, Target, Users, Mountain, CheckCircle2, Lock, Unlock,
  Star, Award, TrendingUp, Clock, Flame, Brain, Heart
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { PlayerClass, ClassDefinition, ClassSkill } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';
import { CLASS_DEFINITIONS } from '../../data/gamification-data';

interface ClassSelectionProps {
  className?: string;
}

export function ClassSelection({ className }: ClassSelectionProps) {
  const { profile, selectClass, unlockSkill, useSkill } = useGamification();
  const [selectedClass, setSelectedClass] = useState<ClassDefinition | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const currentClass = CLASS_DEFINITIONS.find(c => c.id === profile.class);
  const hasSelectedClass = profile.class !== null;
  
  const handleClassClick = (classDef: ClassDefinition) => {
    setSelectedClass(classDef);
    if (!hasSelectedClass) {
      setShowConfirmDialog(true);
    }
  };
  
  const handleConfirmClass = () => {
    if (selectedClass) {
      selectClass(selectedClass.id);
      setShowConfirmDialog(false);
    }
  };
  
  const getClassIcon = (classId: PlayerClass) => {
    switch (classId) {
      case 'sprinter': return Zap;
      case 'marathon': return Mountain;
      case 'captain': return Users;
      case 'solo': return Target;
    }
  };
  
  return (
    <div className={className}>
      {!hasSelectedClass ? (
        <>
          {/* Class Selection Screen */}
          <div className="text-center mb-8">
            <h2 className="text-white text-3xl font-bold mb-2">Choose Your Path</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Select a class that matches your work style. Each class provides unique bonuses and abilities to enhance your productivity journey.
            </p>
            <Badge variant="outline" className="mt-3 text-blue-400 border-blue-400">
              Unlocks at Level 5
            </Badge>
          </div>
          
          {/* Class Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {CLASS_DEFINITIONS.map((classDef) => {
              const Icon = getClassIcon(classDef.id);
              
              return (
                <motion.div
                  key={classDef.id}
                  className="bg-[#1e2128] border-2 border-gray-800 rounded-xl p-6 cursor-pointer transition-all hover:border-blue-500/50"
                  style={{
                    borderColor: selectedClass?.id === classDef.id ? classDef.color : undefined,
                  }}
                  onClick={() => handleClassClick(classDef)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${classDef.color}20` }}
                    >
                      {classDef.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white text-xl font-bold mb-1">{classDef.name}</h3>
                      <p className="text-gray-400 text-sm">{classDef.description}</p>
                    </div>
                  </div>
                  
                  {/* Playstyle */}
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3 mb-4">
                    <div className="text-gray-500 text-xs mb-1">Playstyle</div>
                    <div className="text-gray-300 text-sm">{classDef.playstyle}</div>
                  </div>
                  
                  {/* Bonuses */}
                  <div className="mb-4">
                    <div className="text-gray-400 text-sm font-semibold mb-2">Passive Bonuses</div>
                    <div className="space-y-2">
                      {classDef.bonuses.map((bonus, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{bonus.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Skills Preview */}
                  <div>
                    <div className="text-gray-400 text-sm font-semibold mb-2">Skills ({classDef.skills.length})</div>
                    <div className="flex gap-2">
                      {classDef.skills.map((skill, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 bg-[#252830] border border-gray-700 rounded-lg flex items-center justify-center text-xl"
                          title={skill.name}
                        >
                          {skill.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Best For */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-gray-500 text-xs mb-1">Best For</div>
                    <div className="text-gray-300 text-sm">{classDef.bestFor}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-lg">
              {selectedClass && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <span className="text-3xl">{selectedClass.icon}</span>
                      Choose {selectedClass.name}?
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      This choice is permanent and will shape your journey. Make sure this class fits your playstyle!
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Flame className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <div className="text-yellow-400 font-semibold mb-1">Important!</div>
                          <div className="text-gray-300 text-sm">
                            You cannot change your class later. Choose wisely based on your work style and preferences.
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm font-semibold mb-2">You'll receive:</div>
                      <ul className="space-y-1 text-gray-300 text-sm">
                        {selectedClass.bonuses.map((bonus, i) => (
                          <li key={i}>• {bonus.description}</li>
                        ))}
                        <li>• Access to {selectedClass.skills.length} unique skills</li>
                        <li>• Class-specific achievements and titles</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowConfirmDialog(false)}
                      >
                        Go Back
                      </Button>
                      <Button
                        className="flex-1"
                        style={{ backgroundColor: selectedClass.color }}
                        onClick={handleConfirmClass}
                        disabled={profile.level < 5}
                      >
                        {profile.level < 5 ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Requires Level 5
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirm Choice
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          {/* Class Dashboard (After Selection) */}
          <div className="space-y-6">
            {/* Class Header */}
            <div 
              className="bg-gradient-to-r from-[#252830] to-[#1e2128] border-2 rounded-xl p-6"
              style={{ borderColor: currentClass?.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center text-5xl"
                    style={{ backgroundColor: `${currentClass?.color}20` }}
                  >
                    {currentClass?.icon}
                  </div>
                  <div>
                    <h2 className="text-white text-2xl font-bold mb-1">{currentClass?.name}</h2>
                    <p className="text-gray-400 mb-3">{currentClass?.description}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                        <div className="text-gray-500 text-xs mb-1">Class Level</div>
                        <div className="text-white text-xl font-bold">{profile.classLevel}</div>
                      </div>
                      <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                        <div className="text-gray-500 text-xs mb-1">Skill Points</div>
                        <div className="text-white text-xl font-bold">{profile.skillPoints}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  style={{ color: currentClass?.color, borderColor: currentClass?.color }}
                >
                  Active Class
                </Badge>
              </div>
            </div>
            
            {/* Passive Bonuses */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Passive Bonuses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentClass?.bonuses.map((bonus, i) => (
                  <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold mb-1">+{bonus.value}% Bonus</div>
                        <div className="text-gray-400 text-sm">{bonus.description}</div>
                        {bonus.condition && (
                          <div className="text-gray-500 text-xs mt-1">Condition: {bonus.condition}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skills */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Skills & Abilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentClass?.skills.map((skill, i) => {
                  const isUnlocked = profile.level >= skill.requiredLevel;
                  const hasUnlocked = profile.unlockedSkills.includes(skill.id);
                  
                  return (
                    <motion.div
                      key={i}
                      className={`border rounded-lg p-4 ${
                        isUnlocked 
                          ? 'bg-[#252830] border-gray-700' 
                          : 'bg-gray-800/20 border-gray-800'
                      }`}
                      whileHover={isUnlocked ? { scale: 1.02 } : {}}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl ${
                            isUnlocked 
                              ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                              : 'bg-gray-700'
                          }`}
                        >
                          {skill.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                              {skill.name}
                            </h4>
                            {!isUnlocked && (
                              <Lock className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <p className={`text-sm mb-2 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                            {skill.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs">
                              <div className={isUnlocked ? 'text-gray-400' : 'text-gray-600'}>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {skill.cooldown}h cooldown
                              </div>
                              <div className={isUnlocked ? 'text-gray-400' : 'text-gray-600'}>
                                {skill.charges} charge{skill.charges > 1 ? 's' : ''}/day
                              </div>
                            </div>
                          </div>
                          
                          {isUnlocked ? (
                            <Button 
                              size="sm" 
                              className="mt-3 w-full bg-purple-600 hover:bg-purple-700"
                              onClick={() => useSkill(skill.id)}
                            >
                              Use Skill
                            </Button>
                          ) : (
                            <Badge variant="outline" className="mt-3 text-gray-500 border-gray-600">
                              Unlocks at Level {skill.requiredLevel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Class Progression */}
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Class Progression
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Next Class Level</span>
                    <span className="text-white font-semibold">
                      Level {profile.classLevel} → {profile.classLevel + 1}
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <div className="text-gray-500 text-xs mt-1">
                    Complete class-specific actions to level up
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {profile.stats.tasksCompleted}
                    </div>
                    <div className="text-gray-400 text-xs">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {Math.floor(profile.stats.focusHours)}
                    </div>
                    <div className="text-gray-400 text-xs">Focus Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {profile.stats.teamCollaborations}
                    </div>
                    <div className="text-gray-400 text-xs">Team Actions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
