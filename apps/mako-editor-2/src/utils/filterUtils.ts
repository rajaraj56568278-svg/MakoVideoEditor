import type { VideoEffects } from '../types';

/**
 * Build a CSS filter string from video effects
 */
export function buildFilterString(effects: VideoEffects): string {
  const filters: string[] = [];

  // Brightness (0-200 → 0-2)
  if (effects.brightness !== 100) {
    filters.push(`brightness(${effects.brightness / 100})`);
  }

  // Contrast (0-200 → 0-2)
  if (effects.contrast !== 100) {
    filters.push(`contrast(${effects.contrast / 100})`);
  }

  // Saturation (0-200 → 0-2)
  if (effects.saturation !== 100) {
    filters.push(`saturate(${effects.saturation / 100})`);
  }

  // Blur
  if (effects.blur > 0) {
    filters.push(`blur(${effects.blur}px)`);
  }

  // Grayscale
  if (effects.grayscale > 0) {
    filters.push(`grayscale(${effects.grayscale / 100})`);
  }

  // Sepia
  if (effects.sepia > 0) {
    filters.push(`sepia(${effects.sepia / 100})`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Build a CSS transform string for keyframe animations
 */
export function buildTransformString(
  x: number,
  y: number,
  scale: number,
  rotation: number
): string {
  return `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
}

/**
 * Interpolate between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
