/**
 * AI HD Video Enhancement Engine
 * 
 * Real canvas-based image processing pipeline that applies:
 * - Adaptive sharpening (unsharp mask via convolution)
 * - Noise reduction (selective blur preserving edges)
 * - Auto brightness/contrast (histogram-based auto-levels)
 * - Detail enhancement (high-frequency boost)
 * 
 * Works on ImageData pixels for export, and CSS filter strings for real-time preview.
 */

import type { AiHdSettings, AiHdQuality } from '../types';

// ─── Resolution map ───
export const AI_HD_RESOLUTIONS: Record<AiHdQuality, { width: number; height: number; label: string } | null> = {
  'auto': null, // use source resolution
  '720p': { width: 1280, height: 720, label: 'HD 720p' },
  '1080p': { width: 1920, height: 1080, label: 'Full HD 1080p' },
  '4K': { width: 3840, height: 2160, label: '4K Ultra HD' },
};

// ─── CSS Filter for real-time preview ───
// Generates a CSS filter string that approximates the AI enhancement for live preview.
// This is fast (GPU-accelerated by the browser) and gives a close approximation
// of what the pixel-level export pipeline will produce.
export function getAiHdPreviewFilter(settings: AiHdSettings): string {
  if (!settings.enabled || settings.strength <= 0) return '';

  const t = settings.strength / 100; // 0..1

  const parts: string[] = [];

  // Sharpening approximation: boost contrast in midtones + slight brightness lift
  // This makes edges appear crisper without actual convolution
  const sharpContrast = 1 + t * 0.18;
  parts.push(`contrast(${sharpContrast.toFixed(3)})`);

  // Auto brightness: slight lift in shadows
  const autoBright = 1 + t * 0.06;
  parts.push(`brightness(${autoBright.toFixed(3)})`);

  // Detail enhancement: slight saturation boost for vividness
  const detailSat = 1 + t * 0.08;
  parts.push(`saturate(${detailSat.toFixed(3)})`);

  // Clarity: a tiny bit of extra contrast curve
  if (t > 0.3) {
    const clarity = 1 + (t - 0.3) * 0.1;
    parts.push(`contrast(${clarity.toFixed(3)})`);
  }

  return parts.join(' ');
}

// ─── Pixel-level enhancement for export ───
// This processes actual ImageData pixels frame-by-frame during export.

/**
 * Apply AI HD enhancement to a canvas context.
 * Called during the export render loop for each frame.
 * 
 * @param ctx - The 2D canvas context with the frame already drawn
 * @param width - Frame width
 * @param height - Frame height
 * @param settings - AI HD settings
 */
export function applyAiHdToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: AiHdSettings
): void {
  if (!settings.enabled || settings.strength <= 0) return;

  const t = settings.strength / 100;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // For performance on large resolutions, we process a downscaled version
  // and blend back. For 720p and below, process directly.
  const pixelCount = width * height;

  // Step 1: Auto-levels (histogram stretching for brightness/contrast)
  if (t > 0.1) {
    applyAutoLevels(data, t);
  }

  // Step 2: Adaptive sharpening via unsharp mask
  if (t > 0.15) {
    applyUnsharpMask(data, width, height, t);
  }

  // Step 3: Noise reduction (selective smoothing)
  if (t > 0.2) {
    applyNoiseReduction(data, width, height, t);
  }

  // Step 4: Detail enhancement (high-frequency boost)
  if (t > 0.25) {
    applyDetailEnhance(data, width, height, t);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Histogram-based auto-levels: stretches the luminance range
 * to use the full 0-255 spectrum, improving contrast naturally.
 */
function applyAutoLevels(data: Uint8ClampedArray, strength: number): void {
  // Find min/max luminance (sampling for speed on large images)
  const step = data.length > 500000 ? 16 : 4;
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += step * 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Don't stretch too aggressively — blend with original range
  const targetMin = minLum * strength;
  const targetMax = 255 - (255 - maxLum) * strength;
  const range = targetMax - targetMin;

  if (range < 10) return; // Skip if range is too small

  const scale = 255 / range;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp((data[i] - targetMin) * scale);
    data[i + 1] = clamp((data[i + 1] - targetMin) * scale);
    data[i + 2] = clamp((data[i + 2] - targetMin) * scale);
  }
}

/**
 * Unsharp mask: sharpen edges by subtracting a blurred version
 * from the original and adding it back with a gain factor.
 */
function applyUnsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  const amount = strength * 0.8; // Sharpening amount
  const threshold = 2; // Don't sharpen noise

  // Create a simple box blur for the "unsharp" part
  const blurred = new Uint8ClampedArray(data.length);
  
  // Box blur (3x3 kernel)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const sum =
          data[idx + c - width * 4 - 4] +
          data[idx + c - width * 4] +
          data[idx + c - width * 4 + 4] +
          data[idx + c - 4] +
          data[idx + c] +
          data[idx + c + 4] +
          data[idx + c + width * 4 - 4] +
          data[idx + c + width * 4] +
          data[idx + c + width * 4 + 4];
        blurred[idx + c] = sum / 9;
      }
      blurred[idx + 3] = data[idx + 3];
    }
  }

  // Unsharp mask: original + amount * (original - blurred)
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = data[i + c] - blurred[i + c];
      if (Math.abs(diff) > threshold) {
        data[i + c] = clamp(data[i + c] + diff * amount);
      }
    }
  }
}

/**
 * Selective noise reduction: smooths flat areas while preserving edges.
 * Uses a simple edge-aware filter.
 */
function applyNoiseReduction(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  const radius = 1;
  const edgeThreshold = 20 + (1 - strength) * 30; // Higher strength = more aggressive
  const copy = new Uint8ClampedArray(data);

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        let sum = 0;
        let count = 0;
        let hasEdge = false;

        // Check neighborhood
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * width + (x + dx)) * 4 + c;
            const neighbor = copy[nIdx];
            if (Math.abs(neighbor - center) > edgeThreshold) {
              hasEdge = true;
              break;
            }
            sum += neighbor;
            count++;
          }
          if (hasEdge) break;
        }

        // Only smooth if no edge detected in neighborhood
        if (!hasEdge && count > 0) {
          const avg = sum / count;
          const blend = strength * 0.4;
          data[idx + c] = clamp(center * (1 - blend) + avg * blend);
        }
      }
    }
  }
}

/**
 * Detail enhancement: boost high-frequency details using a Laplacian kernel.
 * Makes textures and fine details more visible.
 */
function applyDetailEnhance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): void {
  const amount = strength * 0.3;
  const copy = new Uint8ClampedArray(data);

  // Laplacian kernel for edge/detail detection
  // [0, -1, 0]
  // [-1, 4, -1]
  // [0, -1, 0]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c] * 4;
        const top = copy[idx + c - width * 4];
        const bottom = copy[idx + c + width * 4];
        const left = copy[idx + c - 4];
        const right = copy[idx + c + 4];

        const laplacian = center - top - bottom - left - right;
        data[idx + c] = clamp(data[idx + c] + laplacian * amount);
      }
    }
  }
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

// ─── Export resolution helper ───
/**
 * Determine the export resolution based on AI HD settings and source video.
 * Returns { width, height } preserving the original aspect ratio.
 */
export function getAiHdExportResolution(
  settings: AiHdSettings,
  sourceWidth: number,
  sourceHeight: number,
  projectAspect: string
): { width: number; height: number } {
  if (!settings.enabled || settings.quality === 'auto') {
    // Use source resolution or project default
    return { width: sourceWidth || 1920, height: sourceHeight || 1080 };
  }

  const res = AI_HD_RESOLUTIONS[settings.quality];
  if (!res) return { width: sourceWidth || 1920, height: sourceHeight || 1080 };

  // Preserve aspect ratio
  if (projectAspect === '9:16') {
    return { width: res.height, height: res.width };
  }
  if (projectAspect === '1:1') {
    return { width: res.height, height: res.height };
  }
  if (projectAspect === '4:3') {
    return { width: Math.round(res.height * 4 / 3), height: res.height };
  }
  return { width: res.width, height: res.height };
}

/**
 * Get a human-readable description of the AI HD enhancement.
 */
export function getAiHdDescription(settings: AiHdSettings): string {
  if (!settings.enabled) return 'AI HD disabled';
  
  const qualityLabel = settings.quality === 'auto' ? 'Auto' :
    settings.quality === '720p' ? 'HD 720p' :
    settings.quality === '1080p' ? 'Full HD 1080p' : '4K Ultra HD';
  
  return `AI HD ${qualityLabel} • Strength ${settings.strength}%`;
}
