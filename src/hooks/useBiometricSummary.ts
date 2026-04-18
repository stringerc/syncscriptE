import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Biometric / wearable bridge — does not touch energy-system.ts or useEnergyPrediction.
 * When @capgo/capacitor-health is added to the app, extend readHealthSamples() here.
 */
export function useBiometricSummary() {
  const [supported, setSupported] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setSupported(true);
      setNote('Health data plugins can be enabled without changing the core energy engine.');
    }
  }, []);

  return { supported, note };
}
