import { useRef, useEffect, useCallback, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { buildFilterString } from '../utils/filterUtils';
import { Upload, Film } from 'lucide-react';

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Build filter string for current clip
  const filterString = currentClip ? buildFilterString(currentClip.effects) : 'none';

  // Build crop style
  const cropStyle = currentClip?.crop ? {
    clipPath: `inset(${currentClip.crop.y}% ${100 - currentClip.crop.x - currentClip.crop.width}% ${100 - currentClip.crop.y - currentClip.crop.height}% ${currentClip.crop.x}%)`,
  } : {};

  // Rotation
  const rotation = currentClip?.rotation || 0;

  return (
    <div
      ref={containerRef}
      className="preview-container w-full aspect-video bg-black relative"
    >
      {hasVideo && currentClip ? (
        <>
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            style={{
              filter: filterString,
              transform: `rotate(${rotation}deg)`,
              ...cropStyle,
            }}
            playsInline
            preload="auto"
            muted={currentClip.volume === 0}
          />

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

          {/* Vignette overlay */}
          {currentClip.effects.vignette > 0 && (
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
        </div>
      )}
    </div>
  );
}
