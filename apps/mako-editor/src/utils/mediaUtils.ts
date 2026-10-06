import type { MediaFile, MediaType } from '../types';

export function getMediaType(file: File): MediaType {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'image';
  return 'video'; // default
}

export function getMediaAccept(): string {
  return 'video/*,image/*,audio/*';
}

export async function loadMediaFile(file: File): Promise<MediaFile> {
  const type = getMediaType(file);
  const url = URL.createObjectURL(file);

  let duration = 0;
  let width: number | undefined;
  let height: number | undefined;
  let thumbnail: string | undefined;

  if (type === 'video' || type === 'audio') {
    const meta = await getMediaMetadata(url, type);
    duration = meta.duration;
    width = meta.width;
    height = meta.height;
    if (type === 'video') {
      thumbnail = await generateThumbnail(url, meta.duration * 0.1);
    }
  } else if (type === 'image') {
    const dims = await getImageDimensions(url);
    width = dims.width;
    height = dims.height;
    duration = 5; // Default 5 seconds for images
    thumbnail = url;
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    file,
    url,
    duration,
    width,
    height,
    thumbnail,
  };
}

function getMediaMetadata(url: string, type: 'video' | 'audio'): Promise<{
  duration: number;
  width?: number;
  height?: number;
}> {
  return new Promise((resolve) => {
    const el = type === 'video'
      ? document.createElement('video')
      : document.createElement('audio');

    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      resolve({
        duration: el.duration || 0,
        width: type === 'video' ? (el as HTMLVideoElement).videoWidth : undefined,
        height: type === 'video' ? (el as HTMLVideoElement).videoHeight : undefined,
      });
      // Don't revoke - the URL is needed for playback
    };
    el.onerror = () => {
      resolve({ duration: 0 });
    };
    el.src = url;
  });
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve({ width: 1920, height: 1080 });
    img.src = url;
  });
}

function generateThumbnail(videoUrl: string, time: number): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(time, video.duration - 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 160, 90);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      } else {
        resolve('');
      }
    };

    video.onerror = () => resolve('');
    video.src = videoUrl;
  });
}

export function getEffectFilter(effects: {
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
}): string {
  const parts: string[] = [];
  if (effects.blur > 0) parts.push(`blur(${effects.blur}px)`);
  if (effects.brightness !== 0) parts.push(`brightness(${1 + effects.brightness / 100})`);
  if (effects.contrast !== 0) parts.push(`contrast(${1 + effects.contrast / 100})`);
  if (effects.saturation !== 0) parts.push(`saturate(${1 + effects.saturation / 100})`);
  if (effects.grayscale > 0) parts.push(`grayscale(${effects.grayscale / 100})`);
  if (effects.sepia > 0) parts.push(`sepia(${effects.sepia / 100})`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}
