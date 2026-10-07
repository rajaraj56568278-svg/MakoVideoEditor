/**
 * Portrait Effects Engine
 * Face-aware portrait enhancement with background blur.
 */
import type { PortraitSettings } from '../types';
import { detectFaces } from './faceSmooth';

export function getPortraitPreviewFilter(settings: PortraitSettings): string {
  if (!settings.enabled) return '';
  const parts: string[] = [];
  // Smooth: subtle blur
  if (settings.smooth > 5) {
    const blur = (settings.smooth / 100) * 0.35;
    parts.push(`blur(${blur.toFixed(2)}px)`);
  }
  // Face light
  if (settings.faceLight > 5) {
    parts.push(`brightness(${(1 + (settings.faceLight / 100) * 0.12).toFixed(3)})`);
  }
  // Detail: contrast boost
  if (settings.detail > 5) {
    parts.push(`contrast(${(1 + (settings.detail / 100) * 0.15).toFixed(3)})`);
  }
  // Focus: vignette via brightness at edges (approximated with contrast)
  if (settings.focus > 10) {
    parts.push(`contrast(${(1 + (settings.focus / 100) * 0.08).toFixed(3)})`);
  }
  return parts.join(' ');
}

/**
 * Apply portrait effects to canvas for export.
 * Background blur is done by blurring the full frame then compositing sharp face area on top.
 */
export async function applyPortraitToCanvas(
  ctx: CanvasRenderingContext2D, width: number, height: number,
  settings: PortraitSettings, source?: HTMLCanvasElement | HTMLVideoElement
): Promise<void> {
  if (!settings.enabled) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Brightness (face light)
  if (settings.faceLight > 5) {
    const boost = 1 + (settings.faceLight / 100) * 0.1;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] * boost);
      data[i+1] = clamp(data[i+1] * boost);
      data[i+2] = clamp(data[i+2] * boost);
    }
  }
  // Detail: sharpen
  if (settings.detail > 10) {
    const amount = (settings.detail / 100) * 0.3;
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c] * 4;
          const lap = center - copy[idx+c-width*4] - copy[idx+c+width*4] - copy[idx+c-4] - copy[idx+c+4];
          data[idx + c] = clamp(data[idx + c] + lap * amount);
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Background blur: if enabled, blur the frame then draw sharp face region
  if (settings.bgBlur > 10 && source) {
    const faces = await detectFaces(source, width, height);
    if (faces.length > 0) {
      // Save current (sharp) frame
      const sharpData = ctx.getImageData(0, 0, width, height);
      // Apply blur via canvas filter
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = width;
      tmpCanvas.height = height;
      const tmpCtx = tmpCanvas.getContext('2d');
      if (tmpCtx) {
        tmpCtx.filter = `blur(${(settings.bgBlur / 100) * 8}px)`;
        tmpCtx.drawImage(ctx.canvas, 0, 0);
        tmpCtx.filter = 'none';
        // Draw sharp face regions on top
        const blurredData = tmpCtx.getImageData(0, 0, width, height);
        const resultData = ctx.getImageData(0, 0, width, height);
        for (const face of faces) {
          const pad = Math.max(face.width, face.height) * 0.3;
          const cx = face.x + face.width / 2;
          const cy = face.y + face.height / 2;
          const rx = face.width / 2 + pad;
          const ry = face.height / 2 + pad;
          for (let y = Math.max(0, Math.round(cy - ry)); y < Math.min(height, Math.round(cy + ry)); y++) {
            for (let x = Math.max(0, Math.round(cx - rx)); x < Math.min(width, Math.round(cx + rx)); x++) {
              const dx = (x - cx) / rx;
              const dy = (y - cy) / ry;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 1) {
                const blend = dist * dist; // smooth falloff
                const idx = (y * width + x) * 4;
                for (let c = 0; c < 3; c++) {
                  resultData.data[idx + c] = clamp(
                    sharpData.data[idx + c] * (1 - blend) + blurredData.data[idx + c] * blend
                  );
                }
              }
            }
          }
        }
        ctx.putImageData(resultData, 0, 0);
      }
      tmpCanvas.width = 0;
      tmpCanvas.height = 0;
    }
  }
}

function clamp(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
