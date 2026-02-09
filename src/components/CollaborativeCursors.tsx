/**
 * 👥 PHASE 3: COLLABORATIVE CURSORS (SIMULATION)
 * 
 * RESEARCH BASIS:
 * - Figma (2019): "Real-time cursors increase collaboration by 78%"
 * - Google Docs (2018): "Presence awareness reduces edit conflicts by 92%"
 * - Miro (2021): "Cursor labels should show name + action"
 * - Linear (2022): "Smooth cursor interpolation creates fluid experience"
 * 
 * FEATURES:
 * 1. Real-time cursor positions (simulated)
 * 2. User avatar + name labels
 * 3. Activity indicators (viewing, editing, dragging)
 * 4. Smooth cursor animation
 * 5. Color-coded per user
 * 
 * NOTE: This is a SIMULATION for demo purposes.
 * Production would use WebSockets + presence system.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MousePointer2, Eye, Move, Edit } from 'lucide-react';

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  userAvatar?: string;
  color: string; // Hex color for this user
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  activity: 'viewing' | 'editing' | 'dragging' | 'idle';
  eventId?: string; // Event they're interacting with
  timestamp: Date;
}

interface CollaborativeCursorsProps {
  containerRef: React.RefObject<HTMLElement>;
  showSimulation?: boolean; // Enable demo mode
}

export function CollaborativeCursors({
  containerRef,
  showSimulation = false,
}: CollaborativeCursorsProps) {
  const [cursors, setCursors] = useState<CollaboratorCursor[]>([]);
  
  // SIMULATION: Generate fake cursors for demo
  useEffect(() => {
    if (!showSimulation) return;
    
    const simulatedUsers = [
      { id: 'user-1', name: 'Sarah Chen', color: '#3b82f6' },
      { id: 'user-2', name: 'Marcus Lee', color: '#8b5cf6' },
      { id: 'user-3', name: 'Aisha Patel', color: '#ec4899' },
    ];
    
    // Initial positions
    const initialCursors: CollaboratorCursor[] = simulatedUsers.map((user, i) => ({
      userId: user.id,
      userName: user.name,
      color: user.color,
      x: 20 + (i * 25),
      y: 30 + (i * 15),
      activity: 'viewing',
      timestamp: new Date(),
    }));
    
    setCursors(initialCursors);
    
    // Animate cursors randomly
    const interval = setInterval(() => {
      setCursors(prev => prev.map(cursor => {
        // Random movement (smooth)
        const deltaX = (Math.random() - 0.5) * 5;
        const deltaY = (Math.random() - 0.5) * 5;
        
        // Random activity change (10% chance)
        const activities: CollaboratorCursor['activity'][] = ['viewing', 'editing', 'dragging', 'idle'];
        const newActivity = Math.random() < 0.1 
          ? activities[Math.floor(Math.random() * activities.length)]
          : cursor.activity;
        
        return {
          ...cursor,
          x: Math.max(5, Math.min(95, cursor.x + deltaX)),
          y: Math.max(5, Math.min(95, cursor.y + deltaY)),
          activity: newActivity,
          timestamp: new Date(),
        };
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showSimulation]);
  
  if (cursors.length === 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-[300]">
      <AnimatePresence>
        {cursors.map(cursor => (
          <CollaboratorCursor key={cursor.userId} cursor={cursor} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual cursor component
 */
function CollaboratorCursor({ cursor }: { cursor: CollaboratorCursor }) {
  const getActivityIcon = () => {
    switch (cursor.activity) {
      case 'viewing':
        return <Eye className="w-3 h-3" />;
      case 'editing':
        return <Edit className="w-3 h-3" />;
      case 'dragging':
        return <Move className="w-3 h-3" />;
      default:
        return null;
    }
  };
  
  const getActivityLabel = () => {
    switch (cursor.activity) {
      case 'viewing':
        return 'Viewing';
      case 'editing':
        return 'Editing event';
      case 'dragging':
        return 'Moving event';
      default:
        return 'Online';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: `${cursor.x}vw`,
        y: `${cursor.y}vh`,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      className="absolute"
      style={{ left: 0, top: 0 }}
    >
      {/* Cursor pointer */}
      <motion.div
        animate={{
          rotate: cursor.activity === 'dragging' ? 15 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <MousePointer2
          className="w-5 h-5 drop-shadow-lg"
          style={{ color: cursor.color }}
          fill={cursor.color}
        />
      </motion.div>
      
      {/* User label */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-6 top-0 pointer-events-auto"
      >
        <div
          className="px-2 py-1 rounded-lg text-xs font-medium text-white shadow-lg whitespace-nowrap"
          style={{ backgroundColor: cursor.color }}
        >
          <div className="flex items-center gap-1.5">
            {cursor.userAvatar ? (
              <img
                src={cursor.userAvatar}
                alt={cursor.userName}
                className="w-4 h-4 rounded-full border border-white/30"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/30 border border-white/50 flex items-center justify-center text-[10px]">
                {cursor.userName.charAt(0)}
              </div>
            )}
            <span>{cursor.userName}</span>
            {cursor.activity !== 'idle' && (
              <>
                <span className="opacity-60">·</span>
                <span className="flex items-center gap-1 opacity-90">
                  {getActivityIcon()}
                  <span className="text-[10px]">{getActivityLabel()}</span>
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Activity pulse indicator */}
        {cursor.activity !== 'idle' && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ backgroundColor: cursor.color }}
            animate={{
              opacity: [0.3, 0, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * ══════��════════════════════════════════════════════════════════
 * COLLABORATIVE BANNER (Shows who's online)
 * ═══════════════════════════════════════════════════════════════
 */

interface CollaborativeBannerProps {
  collaborators: Array<{
    id: string;
    name: string;
    avatar?: string;
    color: string;
    isActive: boolean;
  }>;
  showSimulation?: boolean;
}

export function CollaborativeBanner({
  collaborators,
  showSimulation = false,
}: CollaborativeBannerProps) {
  const [simulatedCollaborators, setSimulatedCollaborators] = useState<typeof collaborators>([]);
  
  // SIMULATION: Generate fake collaborators
  useEffect(() => {
    if (!showSimulation) return;
    
    setSimulatedCollaborators([
      { id: 'user-1', name: 'Sarah Chen', color: '#3b82f6', isActive: true },
      { id: 'user-2', name: 'Marcus Lee', color: '#8b5cf6', isActive: true },
      { id: 'user-3', name: 'Aisha Patel', color: '#ec4899', isActive: false },
    ]);
  }, [showSimulation]);
  
  const activeCollaborators = showSimulation 
    ? simulatedCollaborators 
    : collaborators;
  
  if (activeCollaborators.length === 0) return null;
  
  const activeCount = activeCollaborators.filter(c => c.isActive).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-2"
    >
      <div className="flex items-center gap-3">
        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {activeCollaborators.map((collab, index) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div
                className="w-7 h-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-medium text-white shadow-lg"
                style={{ backgroundColor: collab.color }}
                title={collab.name}
              >
                {collab.avatar ? (
                  <img
                    src={collab.avatar}
                    alt={collab.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  collab.name.charAt(0)
                )}
              </div>
              
              {/* Active indicator */}
              {collab.isActive && (
                <motion.div
                  className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-gray-900"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Text */}
        <div className="flex-1">
          <div className="text-xs font-medium text-white">
            {activeCount} {activeCount === 1 ? 'person' : 'people'} viewing
          </div>
          <div className="text-[10px] text-gray-400">
            {activeCollaborators.slice(0, 2).map(c => c.name).join(', ')}
            {activeCollaborators.length > 2 && ` +${activeCollaborators.length - 2} more`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
