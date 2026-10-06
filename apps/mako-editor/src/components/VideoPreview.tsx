import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { getEffectFilter, getFilterPresetCss } from '../utils/mediaUtils';
import { formatTime } from '../utils/timeUtils';

export default function VideoPreview() {
  const { state, dispatch, selectedClip } = useProject();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const project = state.project;
  if (!project) return null;

  // Find the clip that should be playing at the current time
  const activeVideoClip = project.clips
    .filter(c => c.type === 'video' && c.mediaUrl)
    .find(c => state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration);

  const activeTextClips = project.clips.filter(
    c => c.type === 'text' && state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration
  );

  const activeStickerClips = project.clips.filter(
    c => (c.type === 'sticker' || c.type === 'overlay') && state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration
  );

  // Sync video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (activeVideoClip?.mediaUrl && video.src !== activeVideoClip.mediaUrl) {
      video.src = activeVideoClip.mediaUrl;
      video.playbackRate = activeVideoClip.speed;
      setLoaded(false);
    }

    if (activeVideoClip) {
      const clipTime = state.currentTime - activeVideoClip.startTime + activeVideoClip.trimStart;
      if (Math.abs(video.currentTime - clipTime) > 0.3) {
        video.currentTime = clipTime;
      }
    }
  }, [activeVideoClip?.id, state.currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (state.isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [state.isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoClip) return;
    video.playbackRate = activeVideoClip.speed;
  }, [activeVideoClip?.speed]);

  // Update current time from video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideoClip) return;

    const onTimeUpdate = () => {
      if (state.isPlaying) {
        const timelineTime = activeVideoClip.startTime + (video.currentTime - activeVideoClip.trimStart);
        if (timelineTime >= activeVideoClip.startTime + activeVideoClip.duration) {
          // Move to next clip or stop
          dispatch({ type: 'SET_PLAYING', isPlaying: false });
          dispatch({ type: 'SET_TIME', time: activeVideoClip.startTime + activeVideoClip.duration });
        } else {
          dispatch({ type: 'SET_TIME', time: timelineTime });
        }
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => video.removeEventListener('timeupdate', onTimeUpdate);
  }, [state.isPlaying, activeVideoClip?.id]);

  const togglePlay = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: !state.isPlaying });
  }, [state.isPlaying, dispatch]);

  const seek = useCallback((delta: number) => {
    const newTime = Math.max(0, Math.min(project.duration, state.currentTime + delta));
    dispatch({ type: 'SET_TIME', time: newTime });
  }, [state.currentTime, project.duration, dispatch]);

  // Build CSS filter string combining effects + named filter preset
  let filterStr = 'none';
  if (activeVideoClip) {
    const effectsFilter = getEffectFilter(activeVideoClip.effects);
    const presetFilter = getFilterPresetCss(activeVideoClip.activeFilter ?? 'original', activeVideoClip.filterIntensity ?? 100);
    if (effectsFilter !== 'none' && presetFilter !== 'none') {
      filterStr = `${effectsFilter} ${presetFilter}`;
    } else if (effectsFilter !== 'none') {
      filterStr = effectsFilter;
    } else if (presetFilter !== 'none') {
      filterStr = presetFilter;
    }
  }
  const clipOpacity = activeVideoClip?.opacity ?? 1;
  const clipRotation = activeVideoClip?.rotation ?? 0;
  const clipScale = activeVideoClip?.scale ?? 1;

  return (
    <div className="relative flex flex-col items-center">
      {/* Video Preview Area */}
      <div
        className="relative w-full bg-black rounded-xl overflow-hidden"
        style={{ aspectRatio: project.aspectRatio === '9:16' ? '9/16' : project.aspectRatio === '1:1' ? '1/1' : project.aspectRatio === '4:3' ? '4/3' : '16/9', maxHeight: '45vh' }}
        onClick={() => setShowControls(s => !s)}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          onLoadedData={() => setLoaded(true)}
          playsInline
          muted={activeVideoClip ? project.tracks.find(t => t.type === 'video')?.muted : false}
          style={{
            filter: filterStr,
            opacity: clipOpacity,
            transform: `scale(${clipScale}) rotate(${clipRotation}deg)`,
          }}
        />

        {/* Text overlays */}
        {activeTextClips.map(clip => {
          if (!clip.textConfig) return null;
          const tc = clip.textConfig;
          const progress = (state.currentTime - clip.startTime) / clip.duration;
          let animStyle: React.CSSProperties = {};

          if (tc.animation === 'fade') {
            animStyle.opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;
          } else if (tc.animation === 'slide-left') {
            const x = progress < 0.1 ? (1 - progress * 10) * 100 : 0;
            animStyle.transform = `translateX(-${x}%)`;
          } else if (tc.animation === 'slide-right') {
            const x = progress < 0.1 ? -(1 - progress * 10) * 100 : 0;
            animStyle.transform = `translateX(${x}%)`;
          } else if (tc.animation === 'slide-up') {
            const y = progress < 0.1 ? (1 - progress * 10) * 100 : 0;
            animStyle.transform = `translateY(${y}%)`;
          } else if (tc.animation === 'zoom') {
            const s = progress < 0.1 ? 0.5 + progress * 5 : 1;
            animStyle.transform = `scale(${s})`;
          }

          return (
            <div
              key={clip.id}
              className="absolute px-4 py-2 pointer-events-none"
              style={{
                left: `${clip.position.x}%`,
                top: `${clip.position.y}%`,
                transform: `translate(-50%, -50%) ${animStyle.transform || ''}`,
                fontFamily: tc.fontFamily,
                fontSize: `${tc.fontSize * (clip.scale || 1)}px`,
                color: tc.color,
                backgroundColor: tc.backgroundColor !== 'transparent' ? tc.backgroundColor : undefined,
                fontWeight: tc.bold ? 'bold' : 'normal',
                fontStyle: tc.italic ? 'italic' : 'normal',
                textAlign: tc.align as any,
                textShadow: tc.shadow ? `2px 2px 4px ${tc.shadowColor}` : 'none',
                opacity: clip.opacity,
                ...animStyle,
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {tc.text}
            </div>
          );
        })}

        {/* Sticker overlays */}
        {activeStickerClips.map(clip => (
          <div
            key={clip.id}
            className="absolute pointer-events-none"
            style={{
              left: `${clip.position.x}%`,
              top: `${clip.position.y}%`,
              transform: `translate(-50%, -50%) scale(${clip.scale}) rotate(${clip.rotation}deg)`,
              fontSize: '48px',
              opacity: clip.opacity,
              zIndex: 11,
            }}
          >
            {clip.stickerUrl}
          </div>
        ))}

        {/* Vignette overlay */}
        {activeVideoClip && activeVideoClip.effects.vignette > 0 && (
          <div
            className="vignette-overlay"
            style={{ opacity: activeVideoClip.effects.vignette / 100 }}
          />
        )}

        {/* No video placeholder */}
        {!activeVideoClip && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
            <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">Import media to get started</p>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        {/* Time display */}
        <span className="text-xs font-mono text-text-secondary min-w-[80px]">
          {formatTime(state.currentTime)}
        </span>

        {/* Center controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => seek(-5)}
            className="touch-target rounded-full hover:bg-bg-hover transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            {state.isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => seek(5)}
            className="touch-target rounded-full hover:bg-bg-hover transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
        </div>

        {/* Duration */}
        <span className="text-xs font-mono text-text-secondary min-w-[80px] text-right">
          {formatTime(project.duration)}
        </span>
      </div>
    </div>
  );
}
