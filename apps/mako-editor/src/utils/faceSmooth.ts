/**
 * Face Smooth / Face Retouch Engine
 * 
 * Real face detection and skin smoothing using:
 * - Browser's FaceDetector API (Chrome/Edge) with fallback
 * - Skin-tone detection via YCbCr color space
 * - Edge-preserving bilateral filter for natural smoothing
 * - Feature preservation (eyes, lips, nose) via edge detection
 * 
 * Processes ImageData pixels frame-by-frame for export,
 * and provides CSS filter approximation for real-time preview.
 */

export interface FaceSmoothSettings {
  enabled: boolean;
  smoothness: number; // 0-100, default 30
  skinDetail: number; // 0-100, default 50
}

export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Face Detection ───

/**
 * Detect faces using browser's FaceDetector API (Chrome/Edge)
 * Falls back to skin-tone detection if not available
 */
export async function detectFaces(
  canvas: HTMLCanvasElement | HTMLVideoElement,
  width: number,
  height: number
): Promise<FaceRegion[]> {
  // Try native FaceDetector API first (Chrome/Edge)
  if ('FaceDetector' in window) {
    try {
      const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
      const faces = await detector.detect(canvas);
      return faces.map((face: any) => ({
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
      }));
    } catch (e) {
      // Fall through to skin detection
    }
  }

  // Fallback: skin-tone based face detection
  return detectFacesBySkinTone(canvas, width, height);
}

/**
 * Detect face regions by analyzing skin-tone pixels
 * Uses YCbCr color space for robust skin detection
 */
function detectFacesBySkinTone(
  source: HTMLCanvasElement | HTMLVideoElement,
  width: number,
  height: number
): FaceRegion[] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Detect skin pixels using YCbCr color space
  const skinMask = new Uint8Array(width * height);
  let skinPixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Convert to YCbCr
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Skin tone range in YCbCr (works for various skin tones)
    const isSkin = y > 60 && cb > 85 && cb < 135 && cr > 135 && cr < 180;

    if (isSkin) {
      skinMask[i / 4] = 1;
      skinPixelCount++;
    }
  }

  // If very few skin pixels, no face detected
  if (skinPixelCount < width * height * 0.01) return [];

  // Find connected regions of skin pixels (simple blob detection)
  const regions = findSkinRegions(skinMask, width, height);

  // Filter for face-like regions (roughly square, in upper portion of frame)
  const faceRegions: FaceRegion[] = [];
  for (const region of regions) {
    const aspectRatio = region.width / region.height;
    const isFaceLike = aspectRatio > 0.5 && aspectRatio < 2.0 && region.y < height * 0.7;
    
    if (isFaceLike && region.width > width * 0.05 && region.height > height * 0.05) {
      faceRegions.push({
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
      });
    }
  }

  return faceRegions.slice(0, 3); // Max 3 faces
}

/**
 * Find connected regions of skin pixels using simple flood fill
 */
function findSkinRegions(
  skinMask: Uint8Array,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number }[] {
  const visited = new Uint8Array(width * height);
  const regions: { x: number; y: number; width: number; height: number }[] = [];

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = y * width + x;
      if (skinMask[idx] && !visited[idx]) {
        // Flood fill to find region bounds
        const region = floodFill(skinMask, visited, x, y, width, height);
        if (region.width > 20 && region.height > 20) {
          regions.push(region);
        }
      }
    }
  }

  // Sort by size (largest first)
  regions.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  return regions;
}

function floodFill(
  skinMask: Uint8Array,
  visited: Uint8Array,
  startX: number,
  startY: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const stack: [number, number][] = [[startX, startY]];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;
  let count = 0;

  while (stack.length > 0 && count < 10000) {
    const [x, y] = stack.pop()!;
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx] || !skinMask[idx]) continue;

    visited[idx] = 1;
    count++;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    // Sample neighbors (skip some for speed)
    if (count % 2 === 0) {
      stack.push([x + 2, y]);
      stack.push([x - 2, y]);
      stack.push([x, y + 2]);
      stack.push([x, y - 2]);
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ─── Face Smoothing ───

/**
 * Apply face smoothing to canvas context
 * Detects faces and applies edge-preserving blur to skin areas
 */
export async function applyFaceSmooth(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: FaceSmoothSettings,
  source?: HTMLCanvasElement | HTMLVideoElement
): Promise<void> {
  if (!settings.enabled || settings.smoothness <= 0) return;

  const sourceEl = source || ctx.canvas;
  
  // Detect faces
  const faces = await detectFaces(sourceEl, width, height);
  if (faces.length === 0) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply smoothing to each face region
  for (const face of faces) {
    smoothFaceRegion(data, width, height, face, settings);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Synchronous face smoothing for export pipeline
 * Uses only skin-tone detection (no async FaceDetector API)
 */
export function applyFaceSmoothSync(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: FaceSmoothSettings,
  source?: HTMLCanvasElement | HTMLVideoElement
): void {
  if (!settings.enabled || settings.smoothness <= 0) return;

  const sourceEl = source || ctx.canvas;
  
  // Detect faces synchronously using skin-tone detection only
  const faces = detectFacesBySkinTone(sourceEl, width, height);
  if (faces.length === 0) return;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply smoothing to each face region
  for (const face of faces) {
    smoothFaceRegion(data, width, height, face, settings);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Smooth a single face region with edge-preserving filter
 */
function smoothFaceRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  face: FaceRegion,
  settings: FaceSmoothSettings
): void {
  const smoothRadius = Math.max(1, Math.round(settings.smoothness / 20));
  const detailStrength = settings.skinDetail / 100;

  // Expand face region slightly for natural blending
  const padding = Math.max(face.width, face.height) * 0.15;
  const x1 = Math.max(0, Math.round(face.x - padding));
  const y1 = Math.max(0, Math.round(face.y - padding));
  const x2 = Math.min(width, Math.round(face.x + face.width + padding));
  const y2 = Math.min(height, Math.round(face.y + face.height + padding));

  // Create skin mask for this face region
  const skinMask = createSkinMask(data, width, x1, y1, x2, y2);

  // Detect facial features (eyes, lips) to preserve
  const featureMask = detectFacialFeatures(data, width, height, x1, y1, x2, y2);

  // Apply bilateral filter (edge-preserving blur)
  const smoothed = bilateralFilter(data, width, height, x1, y1, x2, y2, smoothRadius, skinMask, featureMask);

  // Blend smoothed result back with original based on strength
  const blendStrength = (settings.smoothness / 100) * detailStrength;
  
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * 4;
      const smoothIdx = ((y - y1) * (x2 - x1) + (x - x1)) * 4;

      // Only apply to skin pixels, preserve features
      if (skinMask[y * width + x] && !featureMask[y * width + x]) {
        for (let c = 0; c < 3; c++) {
          const original = data[idx + c];
          const smoothed_val = smoothed[smoothIdx + c];
          data[idx + c] = Math.round(original * (1 - blendStrength) + smoothed_val * blendStrength);
        }
      }
    }
  }
}

/**
 * Create a mask of skin-tone pixels in a region
 */
function createSkinMask(
  data: Uint8ClampedArray,
  width: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Uint8Array {
  const mask = new Uint8Array(width * (y2 - y1));

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // YCbCr skin detection
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      if (cb > 85 && cb < 135 && cr > 135 && cr < 180) {
        mask[(y - y1) * (x2 - x1) + (x - x1)] = 1;
      }
    }
  }

  return mask;
}

/**
 * Detect facial features (eyes, lips, nose) to preserve during smoothing
 * Uses edge detection to find high-contrast areas
 */
function detectFacialFeatures(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Uint8Array {
  const mask = new Uint8Array(width * (y2 - y1));
  const regionWidth = x2 - x1;
  const regionHeight = y2 - y1;

  // Sobel edge detection
  for (let y = y1 + 1; y < y2 - 1; y++) {
    for (let x = x1 + 1; x < x2 - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate gradient magnitude
      const gx = (
        getGray(data, idx + 4) - getGray(data, idx - 4) +
        2 * (getGray(data, idx + 4 - width * 4) - getGray(data, idx - 4 - width * 4)) +
        getGray(data, idx + 4 - width * 4) - getGray(data, idx - 4 - width * 4)
      );

      const gy = (
        getGray(data, idx + width * 4) - getGray(data, idx - width * 4) +
        2 * (getGray(data, idx + width * 4 + 4) - getGray(data, idx - width * 4 + 4)) +
        getGray(data, idx + width * 4 + 4) - getGray(data, idx - width * 4 + 4)
      );

      const magnitude = Math.sqrt(gx * gx + gy * gy);

      // High gradient = feature (eyes, lips, nose edges)
      if (magnitude > 30) {
        mask[(y - y1) * regionWidth + (x - x1)] = 1;
      }
    }
  }

  return mask;
}

function getGray(data: Uint8ClampedArray, idx: number): number {
  return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
}

/**
 * Bilateral filter: edge-preserving smoothing
 * Blurs flat areas while preserving edges
 */
function bilateralFilter(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  skinMask: Uint8Array,
  featureMask: Uint8Array
): Uint8ClampedArray {
  const regionWidth = x2 - x1;
  const regionHeight = y2 - y1;
  const output = new Uint8ClampedArray(regionWidth * regionHeight * 4);

  const sigmaSpace = radius;
  const sigmaColor = 20 + radius * 5;

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const centerIdx = (y * width + x) * 4;
      const outIdx = ((y - y1) * regionWidth + (x - x1)) * 4;

      let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;

      // Sample neighborhood
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if (nx < x1 || nx >= x2 || ny < y1 || ny >= y2) continue;

          const neighborIdx = (ny * width + nx) * 4;
          
          // Spatial weight
          const spatialDist = Math.sqrt(dx * dx + dy * dy);
          const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * sigmaSpace * sigmaSpace));

          // Color weight (preserves edges)
          const colorDist = Math.sqrt(
            (data[centerIdx] - data[neighborIdx]) ** 2 +
            (data[centerIdx + 1] - data[neighborIdx + 1]) ** 2 +
            (data[centerIdx + 2] - data[neighborIdx + 2]) ** 2
          );
          const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * sigmaColor * sigmaColor));

          const weight = spatialWeight * colorWeight;

          sumR += data[neighborIdx] * weight;
          sumG += data[neighborIdx + 1] * weight;
          sumB += data[neighborIdx + 2] * weight;
          sumWeight += weight;
        }
      }

      if (sumWeight > 0) {
        output[outIdx] = sumR / sumWeight;
        output[outIdx + 1] = sumG / sumWeight;
        output[outIdx + 2] = sumB / sumWeight;
        output[outIdx + 3] = data[centerIdx + 3];
      } else {
        output[outIdx] = data[centerIdx];
        output[outIdx + 1] = data[centerIdx + 1];
        output[outIdx + 2] = data[centerIdx + 2];
        output[outIdx + 3] = data[centerIdx + 3];
      }
    }
  }

  return output;
}

// ─── CSS Filter for Preview ───

/**
 * Generate CSS filter string for real-time preview
 * This is an approximation - actual export uses pixel-level processing
 */
export function getFaceSmoothPreviewFilter(settings: FaceSmoothSettings): string {
  if (!settings.enabled || settings.smoothness <= 0) return '';

  // Subtle blur + brightness boost for skin smoothing effect
  const blurAmount = (settings.smoothness / 100) * 0.5;
  const brightnessBoost = 1 + (settings.smoothness / 100) * 0.03;

  const parts: string[] = [];
  if (blurAmount > 0.05) parts.push(`blur(${blurAmount.toFixed(2)}px)`);
  parts.push(`brightness(${brightnessBoost.toFixed(3)})`);

  return parts.join(' ');
}
