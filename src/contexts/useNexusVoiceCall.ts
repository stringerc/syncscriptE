import { useContext } from 'react';
import { NexusVoiceCallContext } from './NexusVoiceCallContext';

export function useNexusVoiceCall() {
  const ctx = useContext(NexusVoiceCallContext);
  if (!ctx) throw new Error('useNexusVoiceCall must be used within NexusVoiceCallProvider');
  return ctx;
}
