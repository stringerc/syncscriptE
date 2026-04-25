/**
 * Aether / Nexus immersive orb palette (design reference: public/nexus/aether-orb-reference.png).
 * Use inline styles or short class names — long arbitrary Tailwind gradients can be dropped in prod CSS.
 */
export const NEXUS_AETHER = {
  deep: '#3B3F9C',
  magenta: '#D82F89',
  cyan: '#5ED7ED',
  gold: '#F4C470',
} as const

export function aetherInnerFill(): string {
  const { deep, magenta, cyan, gold } = NEXUS_AETHER
  return [
    'radial-gradient(circle at 50% 38%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.35) 18%, transparent 42%)',
    `radial-gradient(circle at 32% 62%, ${hexToRgba(cyan, 0.55)} 0%, transparent 48%)`,
    `radial-gradient(circle at 72% 58%, ${hexToRgba(magenta, 0.5)} 0%, transparent 50%)`,
    `radial-gradient(circle at 50% 78%, ${hexToRgba(deep, 0.45)} 0%, transparent 55%)`,
    `radial-gradient(circle at 58% 28%, ${hexToRgba(gold, 0.35)} 0%, transparent 40%)`,
  ].join(', ')
}

export function aetherShellBackground(): string {
  const { deep, magenta, cyan } = NEXUS_AETHER
  return [
    `radial-gradient(circle at 50% 48%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 38%, rgba(0,0,0,0.15) 100%)`,
    `radial-gradient(circle at 20% 30%, ${hexToRgba(cyan, 0.22)} 0%, transparent 45%)`,
    `radial-gradient(circle at 82% 70%, ${hexToRgba(magenta, 0.2)} 0%, transparent 48%)`,
    `radial-gradient(circle at 50% 100%, ${hexToRgba(deep, 0.35)} 0%, transparent 58%)`,
  ].join(', ')
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
