/**
 * Background Removal Engine
 * Canvas-based person segmentation using skin-tone detection + edge analysis.
 * No external ML dependencies — uses browser Canvas 2D API.
 */
import type { BgRemovalSettings } from '../types';

/**
 * Generate a person mask from a video frame.
 * Uses skin-tone detection in YCbCr + spatial coherence to identify the main person.
 */
export function generatePersonMask(
  source: HTMLCanvasElement | HTMLVideoElement,
  width: number,
  height: number
): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Uint8Array(width * height);

  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const mask = new Uint8Array(width * height);

  // Step 1: Detect skin pixels using YCbCr
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    if (y > 60 && cb > 85 && cb < 135 && cr > 135 && cr < 180) {
      mask[i / 4] = 1;
    }
  }

  // Step 2: Find the largest connected skin region (the person)
  const visited = new Uint8Array(width * height);
  let bestRegion: { x: number; y: number; w: number; h: number; count: number } | null = null;
  const regions: { x: number; y: number; w: number; h: number; count: number }[] = [];

  for (let sy = 0; sy < height; sy += 4) {
    for (let sx = 0; sx < width; sx += 4) {
      const idx = sy * width + sx;
      if (mask[idx] && !visited[idx]) {
        // Flood fill
        let minX = sx, maxX = sx, minY = sy, maxY = sy, count = 0;
        const stack: [number, number][] = [[sx, sy]];
        while (stack.length > 0 && count < 20000) {
          const [x, y] = stack.pop()!;
          if (x < 0 || x >= width || y < 0 || y >= height) continue;
          const i = y * width + x;
          if (visited[i] || !mask[i]) continue;
          visited[i] = 1;
          count++;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          if (count % 2 === 0) {
            stack.push([x+2, y], [x-2, y], [x, y+2], [x, y-2]);
          }
        }
        if (count > 100) {
          const region = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, count };
          regions.push(region);
          if (!bestRegion || count > bestRegion.count) bestRegion = region;
        }
      }
    }
  }

  if (!bestRegion) {
    canvas.width = 0; canvas.height = 0;
    return new Uint8Array(width * height);
  }

  // Step 3: Expand mask to include body area below face
  const bodyMask = new Uint8Array(width * height);
  const cx = bestRegion.x + bestRegion.w / 2;
  const bodyTop = bestRegion.y + bestRegion.h * 0.8;
  const bodyBottom = Math.min(height, bestRegion.y + bestRegion.h * 2.5);
  const shoulderWidth = bestRegion.w * 1.5;

  for (let y = Math.max(0, Math.round(bestRegion.y - bestRegion.h * 0.2)); y < Math.min(height, Math.round(bodyBottom)); y++) {
    for (let x = Math.max(0, Math.round(cx - shoulderWidth)); x < Math.min(width, Math.round(cx + shoulderWidth)); x++) {
      const idx = y * width + x;
      // Original skin pixel
      if (mask[idx]) { bodyMask[idx] = 255; continue; }
      // Extended body region (below face, within shoulder width)
      if (y > bodyTop) {
        const dx = Math.abs(x - cx) / shoulderWidth;
        const dy = (y - bodyTop) / (bodyBottom - bodyTop);
        if (dx < 1 - dy * 0.3) {
          bodyMask[idx] = 200;
        }
      }
      // Near face: extend slightly
      const faceCx = bestRegion.x + bestRegion.w / 2;
      const faceCy = bestRegion.y + bestRegion.h / 2;
      const faceRx = bestRegion.w * 0.7;
      const faceRy = bestRegion.h * 0.7;
      const fdx = (x - faceCx) / faceRx;
      const fdy = (y - faceCy) / faceRy;
      if (fdx * fdx + fdy * fdy < 1.5) {
        bodyMask[idx] = Math.max(bodyMask[idx], 180);
      }
    }
  }

  // Step 4: Smooth edges with gaussian-like blur
  const smoothMask = smoothEdges(bodyMask, width, height, 3);

  canvas.width = 0; canvas.height = 0;
  return smoothMask;
}

function smoothEdges(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const result = new Uint8Array(width * height);
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          sum += mask[(y + dy) * width + (x + dx)];
          count++;
        }
      }
      result[y * width + x] = Math.round(sum / count);
    }
  }
  return result;
}

/**
 * Apply background removal to a canvas frame.
 */
export function applyBackgroundRemoval(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: BgRemovalSettings,
  source: HTMLCanvasElement | HTMLVideoElement,
  customImage?: HTMLImageElement | null
): void {
  if (!settings.enabled) return;

  const mask = generatePersonMask(source, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (settings.mode) {
    case 'transparent':
      // Make background pixels transparent
      for (let i = 0; i < mask.length; i++) {
        const alpha = mask[i];
        data[i * 4 + 3] = alpha;
      }
      break;

    case 'blur': {
      // Blur the background, keep person sharp
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = width; tmpCanvas.height = height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (tmpCtx) {
        tmpCtx.filter = `blur(${(settings.blurAmount / 100) * 12}px)`;
        tmpCtx.drawImage(ctx.canvas, 0, 0);
        tmpCtx.filter = 'none';
        const blurredData = tmpCtx.getImageData(0, 0, width, height);
        for (let i = 0; i < mask.length; i++) {
          const personAlpha = mask[i] / 255;
          const bgAlpha = 1 - personAlpha;
          for (let c = 0; c < 3; c++) {
            data[i * 4 + c] = Math.round(data[i * 4 + c] * personAlpha + blurredData.data[i * 4 + c] * bgAlpha);
          }
        }
      }
      tmpCanvas.width = 0; tmpCanvas.height = 0;
      break;
    }

    case 'image':
      if (customImage) {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = width; tmpCanvas.height = height;
        const tmpCtx = tmpCanvas.getContext('2d');
        if (tmpCtx) {
          // Draw custom image scaled to fill
          const scale = Math.max(width / customImage.naturalWidth, height / customImage.naturalHeight);
          const iw = customImage.naturalWidth * scale;
          const ih = customImage.naturalHeight * scale;
          tmpCtx.drawImage(customImage, (width - iw) / 2, (height - ih) / 2, iw, ih);
          const bgData = tmpCtx.getImageData(0, 0, width, height);
          for (let i = 0; i < mask.length; i++) {
            const personAlpha = mask[i] / 255;
            for (let c = 0; c < 3; c++) {
              data[i * 4 + c] = Math.round(data[i * 4 + c] * personAlpha + bgData.data[i * 4 + c] * (1 - personAlpha));
            }
          }
        }
        tmpCanvas.width = 0; tmpCanvas.height = 0;
      }
      break;

    case 'original':
    default:
      // No background change
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * CSS filter approximation for preview (no actual segmentation, just visual hint)
 */
export function getBgRemovalPreviewFilter(settings: BgRemovalSettings): string {
  if (!settings.enabled || settings.mode === 'original') return '';
  if (settings.mode === 'blur') {
    return `drop-shadow(0 0 ${(settings.blurAmount / 100) * 2}px rgba(0,0,0,0.3))`;
  }
  return '';
}
