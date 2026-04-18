/**
 * Classic VU-style peak follower: fast attack toward louder samples, slower release (decay).
 * Keeps orb motion fluid without extra React renders — runs in the Web Audio RAF tick only.
 */
export const VU_ATTACK = 0.42;
export const VU_RELEASE = 0.14;

export function stepVuEnvelope(raw: number, envelope: number): number {
  const x = Math.min(1, Math.max(0, raw));
  const e = Math.min(1, Math.max(0, envelope));
  const k = x >= e ? VU_ATTACK : VU_RELEASE;
  return Math.min(1, Math.max(0, e + (x - e) * k));
}
