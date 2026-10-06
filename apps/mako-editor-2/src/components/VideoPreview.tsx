import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { buildFilterString } from '../utils/filterUtils';
import { Upload, Film } from 'lucide-react';
import type { FxInstance, BackgroundRemoval } from '../types';

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const {
    project, currentTime, isPlaying, selectedClipId,
    setIsPlaying, setCurrentTime,
  } = useProjectStore();

  const [hasVideo, setHasVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the current video clip
  const currentClip = project?.tracks
    .flatMap(t => t.clips)
    .find(c => c.type === 'video' && c.fileUrl &&
      currentTime >= c.startTime && currentTime < c.startTime + c.duration);

  // Find visible text overlays
  const visibleTexts = project?.tracks
    .find(t => t.type === 'text')?.clips
    .filter(c => c.textOverlay &&
      currentTime >= c.startTime && currentTime < c.startTime + c.duration) || [];

  // Find visible stickers
  const visibleStickers = project?.tracks
    .find(t => t.type === 'sticker')?.clips
    .filter(c => c.sticker &&
      currentTime >= c.startTime && currentTime < c.startTime + c.duration) || [];

  // Update video source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentClip?.fileUrl) {
      setHasVideo(false);
      return;
    }

    if (video.src !== currentClip.fileUrl) {
      video.src = currentClip.fileUrl;
      video.load();
      setHasVideo(true);
      setError(null);
    }
  }, [currentClip?.fileUrl]);

  // Sync playback time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    if (currentClip) {
      const clipRelativeTime = currentTime - currentClip.startTime + currentClip.trimStart;
      if (Math.abs(video.currentTime - clipRelativeTime) > 0.3) {
        video.currentTime = clipRelativeTime;
      }
      video.playbackRate = currentClip.speed;
    }
  }, [currentTime, currentClip, hasVideo]);

  // Play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;

    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying, hasVideo, setIsPlaying]);

  // Time update from video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || !currentClip) return;

    const handler = () => {
      const projectTime = currentClip.startTime + (video.currentTime - currentClip.trimStart);
      setCurrentTime(projectTime);

      // Auto-pause at end of clip
      if (video.currentTime >= currentClip.trimEnd) {
        setIsPlaying(false);
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handler);
    return () => video.removeEventListener('timeupdate', handler);
  }, [hasVideo, currentClip, setCurrentTime, setIsPlaying]);

  // Video error handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      setError('Failed to load video. The file may be corrupted or unsupported.');
      setHasVideo(false);
    };

    video.addEventListener('error', handleError);
    return () => video.removeEventListener('error', handleError);
  }, []);

  // Build filter string for current clip + FX blur
  const filterString = useMemo(() => {
    if (!currentClip) return 'none';
    const base = buildFilterString(currentClip.effects);
    const fxFilters = buildFxCssFilters(currentClip.fxInstances);
    const combined = [base, fxFilters].filter(f => f && f !== 'none').join(' ');
    return combined || 'none';
  }, [currentClip]);

  // Build FX transform
  const fxTransform = useMemo(() => {
    if (!currentClip) return '';
    return buildFxTransform(currentClip.fxInstances, currentTime, currentClip.startTime);
  }, [currentClip, currentTime]);

  // Build FX animation classes
  const fxAnimClass = useMemo(() => {
    if (!currentClip || currentClip.fxInstances.length === 0) return '';
    return getFxAnimationClass(currentClip.fxInstances, currentTime, currentClip.startTime);
  }, [currentClip, currentTime]);

  // Canvas overlay for noise, glitch, VHS, film grain
  useEffect(() => {
    if (!currentClip || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hasCanvasFx = currentClip.fxInstances.some(fx =>
      fx.enabled && ['noise', 'glitch', 'vhs', 'film', 'flash'].includes(fx.type)
    );

    if (!hasCanvasFx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const clipElapsed = currentTime - currentClip.startTime;

      for (const fx of currentClip.fxInstances) {
        if (!fx.enabled) continue;
        if (clipElapsed < fx.startTime || clipElapsed > fx.startTime + fx.duration) continue;

        const intensity = fx.intensity / 100;

        switch (fx.type) {
          case 'noise':
            drawNoise(ctx, canvas.width, canvas.height, intensity);
            break;
          case 'glitch':
            drawGlitch(ctx, canvas.width, canvas.height, intensity);
            break;
          case 'vhs':
            drawVHS(ctx, canvas.width, canvas.height, intensity);
            break;
          case 'film':
            drawFilmGrain(ctx, canvas.width, canvas.height, intensity);
            break;
          case 'flash':
            drawFlash(ctx, canvas.width, canvas.height, intensity, clipElapsed, fx.startTime);
            break;
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentClip, currentTime]);

  // Build crop style
  const cropStyle = currentClip?.crop ? {
    clipPath: `inset(${currentClip.crop.y}% ${100 - currentClip.crop.x - currentClip.crop.width}% ${100 - currentClip.crop.y - currentClip.crop.height}% ${currentClip.crop.x}%)`,
  } : {};

  // Rotation
  const rotation = currentClip?.rotation || 0;

  // Background removal style
  const bgRemovalStyle = useMemo(() => {
    if (!currentClip?.backgroundRemoval?.enabled) return {};
    return buildBgRemovalStyle(currentClip.backgroundRemoval);
  }, [currentClip?.backgroundRemoval]);

  // Background replacement layer
  const bgReplacementLayer = useMemo(() => {
    if (!currentClip?.backgroundRemoval?.enabled) return null;
    return buildBgReplacementLayer(currentClip.backgroundRemoval);
  }, [currentClip?.backgroundRemoval]);

  // Build FX overlay layers (vignette, glow, RGB split, mirror, pixelate, etc.)
  const fxOverlays = useMemo(() => {
    if (!currentClip) return null;
    return buildFxOverlays(currentClip.fxInstances, currentTime, currentClip.startTime);
  }, [currentClip, currentTime]);

  return (
    <div
      ref={containerRef}
      className="preview-container w-full aspect-video bg-black relative"
    >
      {hasVideo && currentClip ? (
        <>
          {/* Background replacement layer (behind video) */}
          {bgReplacementLayer}

          <video
            ref={videoRef}
            className={`max-w-full max-h-full object-contain ${fxAnimClass}`}
            style={{
              filter: filterString,
              transform: `rotate(${rotation}deg) ${fxTransform}`,
              ...cropStyle,
              ...bgRemovalStyle,
            }}
            playsInline
            preload="auto"
            muted={currentClip.volume === 0}
          />

          {/* Canvas overlay for noise/glitch/VHS/film */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay"
            style={{ zIndex: 25 }}
          />

          {/* FX Overlay layers */}
          {fxOverlays}

          {/* Text Overlays */}
          {visibleTexts.map(clip => {
            if (!clip.textOverlay) return null;
            const t = clip.textOverlay;
            const animClass = t.animation && t.animation !== 'none'
              ? `animate-${t.animation}`
              : '';

            return (
              <div
                key={clip.id}
                className={`absolute pointer-events-none ${animClass}`}
                style={{
                  left: `${t.position.x}%`,
                  top: `${t.position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${t.rotation}deg) scale(${t.scale})`,
                  fontSize: `${t.fontSize}px`,
                  fontFamily: t.font,
                  color: t.color,
                  backgroundColor: t.backgroundOpacity > 0
                    ? `${t.backgroundColor}${Math.round(t.backgroundOpacity * 2.55).toString(16).padStart(2, '0')}`
                    : 'transparent',
                  padding: t.backgroundOpacity > 0 ? '4px 12px' : '0',
                  borderRadius: t.backgroundOpacity > 0 ? '6px' : '0',
                  textShadow: t.shadow ? `2px 2px 4px ${t.shadowColor}` : 'none',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                {t.text}
              </div>
            );
          })}

          {/* Sticker Overlays */}
          {visibleStickers.map(clip => {
            if (!clip.sticker) return null;
            const s = clip.sticker;
            return (
              <div
                key={clip.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${s.position.x}%`,
                  top: `${s.position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                  fontSize: '48px',
                  opacity: s.opacity / 100,
                  zIndex: 20,
                }}
              >
                {s.emoji}
              </div>
            );
          })}

          {/* Legacy vignette from effects */}
          {currentClip.effects.vignette > 0 && !currentClip.fxInstances.some(f => f.type === 'vignette' && f.enabled) && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${currentClip.effects.vignette / 100}) 100%)`,
                zIndex: 30,
              }}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          {error ? (
            <>
              <div className="w-14 h-14 rounded-full bg-danger/20 flex items-center justify-center mb-3">
                <Film size={24} className="text-danger" />
              </div>
              <p className="text-sm text-danger mb-2">Error</p>
              <p className="text-xs text-text-muted">{error}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center mb-3">
                <Upload size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-secondary mb-1">No video imported</p>
              <p className="text-xs text-text-muted">Tap the timeline to add media</p>
            </>
          )}
        </div>
      )}

      {/* Selection indicator */}
      {currentClip && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-text-secondary backdrop-blur-sm">
          {currentClip.fileName} • {currentClip.speed}x
          {currentClip.fxInstances.length > 0 && ` • ${currentClip.fxInstances.length} FX`}
          {currentClip.backgroundRemoval?.enabled && ' • BG Removed'}
        </div>
      )}
    </div>
  );
}

// ─── FX Rendering Helpers ─────────────────────────────────────

function isFxActive(fx: FxInstance, clipElapsed: number): boolean {
  return fx.enabled && clipElapsed >= fx.startTime && clipElapsed <= fx.startTime + fx.duration;
}

function buildFxCssFilters(fxInstances: FxInstance[]): string {
  const filters: string[] = [];
  for (const fx of fxInstances) {
    if (!fx.enabled) continue;
    const i = fx.intensity / 100;
    switch (fx.type) {
      case 'blur':
        filters.push(`blur(${i * 10}px)`);
        break;
      case 'motionBlur':
        filters.push(`blur(${i * 5}px)`);
        break;
      case 'pixelate':
        // Can't do pixelate with CSS filter, handled via transform
        break;
    }
  }
  return filters.join(' ');
}

function buildFxTransform(fxInstances: FxInstance[], currentTime: number, startTime: number): string {
  const transforms: string[] = [];
  const elapsed = currentTime - startTime;

  for (const fx of fxInstances) {
    if (!isFxActive(fx, elapsed)) continue;
    const i = fx.intensity / 100;

    switch (fx.type) {
      case 'zoom':
        transforms.push(`scale(${1 + i * 0.5})`);
        break;
      case 'shake': {
        const shakeX = Math.sin(elapsed * 30) * i * 8;
        const shakeY = Math.cos(elapsed * 25) * i * 6;
        transforms.push(`translate(${shakeX}px, ${shakeY}px)`);
        break;
      }
      case 'spin':
        transforms.push(`rotate(${elapsed * i * 180}deg)`);
        break;
      case 'distortion': {
        const skewX = Math.sin(elapsed * 5) * i * 10;
        const skewY = Math.cos(elapsed * 3) * i * 5;
        transforms.push(`skew(${skewX}deg, ${skewY}deg)`);
        break;
      }
      case 'mirror':
        if (i > 0.5) transforms.push('scaleX(-1)');
        break;
    }
  }

  return transforms.join(' ');
}

function getFxAnimationClass(fxInstances: FxInstance[], currentTime: number, startTime: number): string {
  const elapsed = currentTime - startTime;
  const classes: string[] = [];

  for (const fx of fxInstances) {
    if (!isFxActive(fx, elapsed)) continue;
    switch (fx.type) {
      case 'shake':
        classes.push('fx-shake');
        break;
      case 'glitch':
        classes.push('fx-glitch');
        break;
    }
  }

  return classes.join(' ');
}

function buildBgRemovalStyle(bg: BackgroundRemoval): Record<string, string> {
  if (!bg.enabled) return {};
  // Simulate background removal with mix-blend-mode and opacity
  const tolerance = bg.tolerance / 100;
  return {
    // Use a combination of blend modes to simulate BG removal
    mixBlendMode: bg.replacementType === 'transparent' ? 'multiply' : 'normal',
    // Edge smoothing via a slight mask
    maskImage: bg.edgeSmoothing > 0
      ? `radial-gradient(ellipse at center, black ${100 - bg.edgeSmoothing}%, transparent 100%)`
      : 'none',
    WebkitMaskImage: bg.edgeSmoothing > 0
      ? `radial-gradient(ellipse at center, black ${100 - bg.edgeSmoothing}%, transparent 100%)`
      : 'none',
  };
}

function buildBgReplacementLayer(bg: BackgroundRemoval): React.ReactNode {
  if (!bg.enabled || bg.replacementType === 'transparent') return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
  };

  switch (bg.replacementType) {
    case 'color':
      style.backgroundColor = bg.replacementColor;
      break;
    case 'gradient':
      style.background = `linear-gradient(${bg.replacementGradient.angle}deg, ${bg.replacementGradient.from}, ${bg.replacementGradient.to})`;
      break;
    case 'image':
      if (bg.replacementImageUrl) {
        style.backgroundImage = `url(${bg.replacementImageUrl})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
      break;
    default:
      return null;
  }

  return <div style={style} />;
}

function buildFxOverlays(fxInstances: FxInstance[], currentTime: number, startTime: number): React.ReactNode {
  const elapsed = currentTime - startTime;
  const overlays: React.ReactNode[] = [];

  for (const fx of fxInstances) {
    if (!isFxActive(fx, elapsed)) continue;
    const i = fx.intensity / 100;

    switch (fx.type) {
      case 'vignette':
        overlays.push(
          <div
            key={`vignette-${fx.id}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent ${40 - i * 30}%, rgba(0,0,0,${i}) 100%)`,
              zIndex: 30,
            }}
          />
        );
        break;

      case 'glow':
        overlays.push(
          <div
            key={`glow-${fx.id}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,255,255,${i * 0.15}) 0%, transparent 70%)`,
              zIndex: 28,
              mixBlendMode: 'soft-light',
            }}
          />
        );
        break;

      case 'rgbSplit': {
        const offset = i * 6;
        overlays.push(
          <div
            key={`rgb-${fx.id}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset ${offset}px 0 ${i * 20}px rgba(255,0,0,${i * 0.3}), inset -${offset}px 0 ${i * 20}px rgba(0,0,255,${i * 0.3})`,
              zIndex: 29,
            }}
          />
        );
        break;
      }

      case 'chromaticAberration': {
        const caOffset = i * 4;
        overlays.push(
          <div
            key={`ca-${fx.id}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: `inset ${caOffset}px ${caOffset / 2}px 0 rgba(255,0,0,${i * 0.15}), inset -${caOffset}px -${caOffset / 2}px 0 rgba(0,255,0,${i * 0.15})`,
              zIndex: 29,
            }}
          />
        );
        break;
      }

      case 'pixelate':
        overlays.push(
          <div
            key={`pixelate-${fx.id}`}
            className="absolute inset-0 pointer-events-none"
            style={{
              backdropFilter: `blur(${i * 3}px)`,
              WebkitBackdropFilter: `blur(${i * 3}px)`,
              zIndex: 27,
              opacity: i * 0.5,
            }}
          />
        );
        break;
    }
  }

  return <>{overlays}</>;
}

// ─── Canvas Drawing Functions ──────────────────────────────────

function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  const alpha = intensity * 60;

  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawGlitch(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const slices = Math.floor(intensity * 8) + 2;
  for (let i = 0; i < slices; i++) {
    const y = Math.random() * h;
    const sliceH = Math.random() * 20 * intensity + 2;
    const offset = (Math.random() - 0.5) * 40 * intensity;

    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${Math.random() > 0.5 ? 255 : 0}, ${intensity * 0.3})`;
    ctx.fillRect(offset, y, w, sliceH);
  }
}

function drawVHS(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  // Scanlines
  ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.15})`;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Color bleeding
  const bleedY = Math.random() * h;
  ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.08})`;
  ctx.fillRect(0, bleedY, w, 3);
  ctx.fillStyle = `rgba(0, 255, 0, ${intensity * 0.06})`;
  ctx.fillRect(0, bleedY + 5, w, 2);

  // Tracking noise at bottom
  const trackH = intensity * 30;
  for (let y = h - trackH; y < h; y += 2) {
    const alpha = ((y - (h - trackH)) / trackH) * intensity * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(Math.random() * 10, y, w, 1);
  }
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  const alpha = intensity * 30;

  for (let i = 0; i < data.length; i += 16) { // Skip pixels for performance
    const v = Math.random() * 200 + 55;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);

  // Film scratches
  if (Math.random() > 0.7) {
    const x = Math.random() * w;
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.1})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 20, h);
    ctx.stroke();
  }
}

function drawFlash(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number, elapsed: number, startTime: number) {
  const flashInterval = 2 - intensity; // Faster flashes at higher intensity
  const phase = (elapsed - startTime) % flashInterval;
  const flashDuration = 0.1;

  if (phase < flashDuration) {
    const alpha = (1 - phase / flashDuration) * intensity * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, w, h);
  }
}
