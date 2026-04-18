/**
 * Shared hook for current energy readiness calculation
 * Ensures all avatars show the same readiness percentage
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRITICAL FIX: Connected to EnergyContext (Section 2.19)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * PROBLEM: Progress bar was NOT connected to energy points system
 * - Energy was being awarded correctly ✓
 * - But useCurrentReadiness() was reading from profile override or circadian calc ✗
 * - Result: Completing tasks didn't update the progress ring ✗
 * 
 * SOLUTION: Read from EnergyContext.totalEnergy and convert to percentage
 * - ROYGBIV system: 0-700 energy = 0-100% progress (one complete loop)
 * - After 700, loops restart (like permanent Aura system)
 * - Formula: (totalEnergy % 700) / 700 * 100
 * 
 * ENERGY MAPPING:
 * - 0 energy = 0% (Red)
 * - 100 energy = 14.28% (Orange)
 * - 200 energy = 28.57% (Yellow)
 * - 300 energy = 42.86% (Green)
 * - 400 energy = 57.14% (Blue)
 * - 500 energy = 71.43% (Indigo)
 * - 600 energy = 85.71% (Violet)
 * - 700 energy = 100% (Complete loop - earn Aura, restart at Red)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEnergy } from '../contexts/EnergyContext';

const MAX_ENERGY_PER_LOOP = 700; // One complete ROYGBIV cycle

/** Pure readiness % from total energy — use this + `useEnergy()` in components to avoid chunk/minify issues with the hook name in production. */
export function getReadinessPercentFromTotalEnergy(totalEnergy: number): number {
  const energyInCurrentLoop = totalEnergy % MAX_ENERGY_PER_LOOP;
  const progressPercentage = (energyInCurrentLoop / MAX_ENERGY_PER_LOOP) * 100;
  return Math.max(0, Math.min(100, progressPercentage));
}

export function useCurrentReadiness(): number {
  const { energy } = useEnergy();
  const clampedProgress = getReadinessPercentFromTotalEnergy(energy.totalEnergy);
  console.log('🎯 [useCurrentReadiness] Progress calculation:', {
    totalEnergy: energy.totalEnergy,
    energyInCurrentLoop: energy.totalEnergy % MAX_ENERGY_PER_LOOP,
    progressPercentage: clampedProgress.toFixed(2) + '%',
    currentColor: energy.currentColor?.name || 'Unknown',
    loopNumber: Math.floor(energy.totalEnergy / MAX_ENERGY_PER_LOOP) + 1,
  });
  return clampedProgress;
}
