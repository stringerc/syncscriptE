import type { TTSConfigResult } from './tts-router';
import { NEXUS_LANDING_KOKORO_VOICE_ID } from './nexus-tts-prosody';

/** Kokoro preset shared with landing + desktop companion (`cortana`). */
export const NEXUS_LANDING_KOKORO_VOICE = NEXUS_LANDING_KOKORO_VOICE_ID;

/**
 * Router hints for pitch/model; **speed is overridden** per sentence in `useVoiceStream` when
 * `voice === cortana` via the landing Kokoro pipeline (chunked prosody ~0.97–1.0).
 */
export function nexusLandingKokoroConfig(tts: TTSConfigResult): {
  model: TTSConfigResult['model'];
  voice: string;
  speed: number;
  pitch: number;
} {
  // Align with landing Nexus prosody: `cortana` + ~0.97–1.0 speed (see NexusVoiceCallContext PROSODY_MAP).
  const speed = Math.min(Math.max(0.97 + (tts.speed - 1) * 0.04, 0.97), 1.0);
  const pitch = Math.min(Math.max(tts.pitch * 0.99, 0.97), 1.03);
  return {
    model: tts.model,
    voice: NEXUS_LANDING_KOKORO_VOICE_ID,
    speed,
    pitch,
  };
}
