/**
 * Avatar Animation Unlock System
 *
 * Maps gamification levels to unlockable profile picture animations.
 * Users earn new animation styles as they level up, creating a
 * visual progression system tied to their productivity.
 *
 * Animation types come from AnimatedAvatar.tsx:
 *   glow, heartbeat, shake, spin, pulse, wiggle, bounce, none
 */

export type AvatarAnimationType = 'none' | 'glow' | 'pulse' | 'bounce' | 'wiggle' | 'heartbeat' | 'shake' | 'spin';

export interface AnimationUnlock {
  type: AvatarAnimationType;
  name: string;
  description: string;
  unlockLevel: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color: string; // Tailwind color for UI display
}

export const ANIMATION_UNLOCKS: AnimationUnlock[] = [
  {
    type: 'none',
    name: 'Default',
    description: 'Clean, no animation',
    unlockLevel: 0,
    rarity: 'common',
    color: 'gray',
  },
  {
    type: 'glow',
    name: 'Energy Glow',
    description: 'A warm aura that pulses with your energy level',
    unlockLevel: 1,
    rarity: 'common',
    color: 'yellow',
  },
  {
    type: 'pulse',
    name: 'Ripple Pulse',
    description: 'Expanding ripple waves radiate outward',
    unlockLevel: 3,
    rarity: 'uncommon',
    color: 'teal',
  },
  {
    type: 'bounce',
    name: 'Power Bounce',
    description: 'Energetic bounce with impact rings',
    unlockLevel: 5,
    rarity: 'uncommon',
    color: 'green',
  },
  {
    type: 'wiggle',
    name: 'Sound Wave',
    description: 'Musical sound waves emanate from your avatar',
    unlockLevel: 8,
    rarity: 'rare',
    color: 'blue',
  },
  {
    type: 'heartbeat',
    name: 'Vital Heartbeat',
    description: 'A living EKG line traces your avatar border',
    unlockLevel: 12,
    rarity: 'rare',
    color: 'red',
  },
  {
    type: 'shake',
    name: 'Lightning Strike',
    description: 'Electric bolts crackle around your avatar',
    unlockLevel: 18,
    rarity: 'epic',
    color: 'purple',
  },
  {
    type: 'spin',
    name: 'Orbital',
    description: 'Particles orbit your avatar like a galaxy',
    unlockLevel: 25,
    rarity: 'legendary',
    color: 'amber',
  },
];

const STORAGE_KEY = 'syncscript_avatar_animation';

export function getUnlockedAnimations(level: number): AnimationUnlock[] {
  return ANIMATION_UNLOCKS.filter(a => level >= a.unlockLevel);
}

export function isAnimationUnlocked(type: AvatarAnimationType, level: number): boolean {
  const anim = ANIMATION_UNLOCKS.find(a => a.type === type);
  return anim ? level >= anim.unlockLevel : false;
}

export function getNextUnlock(level: number): AnimationUnlock | null {
  const locked = ANIMATION_UNLOCKS.filter(a => level < a.unlockLevel);
  return locked.length > 0 ? locked[0] : null;
}

export function getSelectedAnimation(): AvatarAnimationType {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ANIMATION_UNLOCKS.some(a => a.type === stored)) {
      return stored as AvatarAnimationType;
    }
  } catch {}
  return 'glow';
}

export function setSelectedAnimation(type: AvatarAnimationType): void {
  try {
    localStorage.setItem(STORAGE_KEY, type);
  } catch {}
}

export function getRarityColors(rarity: AnimationUnlock['rarity']): { bg: string; text: string; border: string } {
  switch (rarity) {
    case 'common': return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-600' };
    case 'uncommon': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-600' };
    case 'rare': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-600' };
    case 'epic': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-600' };
    case 'legendary': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-600' };
  }
}
