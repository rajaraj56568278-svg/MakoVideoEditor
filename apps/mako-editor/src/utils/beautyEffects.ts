/**
 * Beauty Effects Engine
 * CSS filter preview + canvas export pipeline.
 */
import type { BeautySettings } from '../types';
import { detectFaces } from './faceSmooth';

export function getBeautyPreviewFilter(settings: BeautySettings): string {
  if (!settings.enabled) return '';
  const parts: string[] = [];
  const brightnessVal = 0.85 + (settings.brightness / 100) * 0.3;
  if (Math.abs(brightnessVal - 1) > 0.01) parts.push(`brightness(${brightnessVal.toFixed(3)})`);
  const contrastVal = 0.85 + (settings.contrast / 100) * 0.3;
  if (Math.abs(contrastVal - 1) > 0.01) parts.push(`contrast(${contrastVal.toFixed(3)})`);
  if (settings.skinSmooth > 5) {
    const blur = (settings.skinSmooth / 100) * 0.4;
    parts.push(`blur(${blur.toFixed(2)}px)`);
  }
  if (settings.sharpness > 5) {
    const sharp = 1 + (settings.sharpness / 100) * 0.15;
    parts.push(`contrast(${sharp.toFixed(3)})`);
  }
  if (settings.skinTone !== 50) {
    const hueShift = (settings.skinTone - 50) * 0.2;
    if (Math.abs(hueShift) > 0.5) parts.push(`hue-rotate(${hueShift.toFixed(1)}deg)`);
    const satBoost = 1 + Math.abs(settings.skinTone - 50) * 0.003;
    parts.push(`saturate(${satBoost.toFixed(3)})`);
  }
  if (settings.faceLight > 5) {
    const faceBright = 1 + (settings.faceLight / 100) * 0.12;
    parts.push(`brightness(${faceBright.toFixed(3)})`);
  }
  return parts.join(' ');
}

export async function applyBeautyToCanvas(
  ctx: CanvasRenderingContext2D, width: number, height: number,
  settings: BeautySettings, source?: HTMLCanvasElement | HTMLVideoElement
): Promise<void> {
  if (!settings.enabled) return;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  if (settings.brightness !== 50) {
    const factor = 0.85 + (settings.brightness / 100) * 0.3;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] * factor);
      data[i+1] = clamp(data[i+1] * factor);
      data[i+2] = clamp(data[i+2] * factor);
    }
  }
  if (settings.contrast !== 50) {
    const factor = 0.85 + (settings.contrast / 100) * 0.3;
    const intercept = 128 * (1 - factor);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] * factor + intercept);
      data[i+1] = clamp(data[i+1] * factor + intercept);
      data[i+2] = clamp(data[i+2] * factor + intercept);
    }
  }
  if (settings.skinTone !== 50) {
    const warmth = (settings.skinTone - 50) / 50;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] + warmth * 8);
      data[i+2] = clamp(data[i+2] - warmth * 8);
    }
  }
  if (settings.faceLight > 5 && source) {
    const faces = await detectFaces(source, width, height);
    if (faces.length > 0) {
      const lightBoost = (settings.faceLight / 100) * 0.15;
      for (const face of faces) {
        const pad = Math.max(face.width, face.height) * 0.2;
        const x1 = Math.max(0, Math.round(face.x - pad));
        const y1 = Math.max(0, Math.round(face.y - pad));
        const x2 = Math.min(width, Math.round(face.x + face.width + pad));
        const y2 = Math.min(height, Math.round(face.y + face.height + pad));
        const cx = face.x + face.width / 2;
        const cy = face.y + face.height / 2;
        const maxDist = Math.max(face.width, face.height) * 0.7;
        for (let y = y1; y < y2; y++) {
          for (let x = x1; x < x2; x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const falloff = Math.max(0, 1 - dist / maxDist);
            const boost = 1 + lightBoost * falloff;
            const idx = (y * width + x) * 4;
            data[idx] = clamp(data[idx] * boost);
            data[idx+1] = clamp(data[idx+1] * boost);
            data[idx+2] = clamp(data[idx+2] * boost);
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function clamp(v: number): number { return v < 0 ? 0 : v > 255 ? 255 : v | 0; }
