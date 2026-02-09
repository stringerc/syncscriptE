/**
 * useEnergy Hook
 * 
 * Convenient re-export of the Energy context hook.
 * Import from here for cleaner code.
 * 
 * USAGE:
 * import { useEnergy } from '@/hooks/useEnergy';
 * 
 * const { energy, completeTask, toggleMode } = useEnergy();
 */

export { useEnergy } from '../contexts/EnergyContext';

// Also export the context provider
export { EnergyProvider } from '../contexts/EnergyContext';
