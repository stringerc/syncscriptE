import { useEnergy } from '../../contexts/EnergyContext';
import { EnergyPointsDisplay } from './EnergyPointsDisplay';
import { EnergyAuraDisplay } from './EnergyAuraDisplay';

interface EnergyDisplayProps {
  showLabel?: boolean;
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  forceMode?: 'points' | 'aura';
}

export function EnergyDisplay({ 
  showLabel = true,
  compact = false,
  size = 'md',
  className = '',
  forceMode,
}: EnergyDisplayProps) {
  const { energy } = useEnergy();
  const mode = forceMode || energy.displayMode;
  
  if (mode === 'aura') {
    return (
      <EnergyAuraDisplay 
        showLabel={showLabel}
        size={size}
        className={className}
      />
    );
  }
  
  return (
    <EnergyPointsDisplay 
      showLabel={showLabel}
      compact={compact}
      className={className}
    />
  );
}