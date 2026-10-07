import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import type { TransitionType } from '../types';

interface TransitionsPanelProps {
  onClose: () => void;
}

interface TransitionDef {
  type: TransitionType;
  label: string;
  icon: string;
  color: string;
}

const TRANSITIONS: TransitionDef[] = [
  { type: 'none', label: 'None', icon: '⊘', color: '#606078' },
  { type: 'fade', label: 'Fade', icon: '◐', color: '#6366f1' },
  { type: 'flash', label: 'Flash', icon: '⚡', color: '#fbbf24' },
  { type: 'zoom-in', label: 'Zoom In', icon: '⊕', color: '#8b5cf6' },
  { type: 'zoom-out', label: 'Zoom Out', icon: '⊖', color: '#a78bfa' },
  { type: 'swipe-left', label: 'Swipe L', icon: '◀', color: '#3b82f6' },
  { type: 'swipe-right', label: 'Swipe R', icon: '▶', color: '#60a5fa' },
  { type: 'swipe-up', label: 'Swipe Up', icon: '▲', color: '#06b6d4' },
  { type: 'swipe-down', label: 'Swipe Dn', icon: '▼', color: '#22d3ee' },
  { type: 'spin', label: 'Spin', icon: '↻', color: '#f472b6' },
  { type: 'glitch', label: 'Glitch', icon: '▦', color: '#ef4444' },
  { type: 'blur', label: 'Blur', icon: '◎', color: '#14b8a6' },
  { type: 'cross-dissolve', label: 'Dissolve', icon: '✦', color: '#f97316' },
];

export default function TransitionsPanel({ onClose }: TransitionsPanelProps) {
  const { state, dispatch, selectedClip } = useProject();
  const [previewType, setPreviewType] = useState<TransitionType | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const project = state.project;

  // Find the adjacent clip pair for context
  const getAdjacentClips = () => {
    if (!selectedClip || !project) return null;
    const trackClips = project.clips
      .filter(c => c.trackIndex === selectedClip.trackIndex && (c.type === 'video' || c.type === 'overlay'))
      .sort((a, b) => a.startTime - b.startTime);
    
    const idx = trackClips.findIndex(c => c.id === selectedClip.id);
    if (idx <= 0) return null; // No clip before this one
    
    return {
      leftClip: trackClips[idx - 1],
      rightClip: trackClips[idx],
    };
  };

  const adjacent = getAdjacentClips();
  const currentTransition = selectedClip?.transition ?? { type: 'none' as TransitionType, duration: 0.5 };

  function setTransition(type: TransitionType) {
    if (!selectedClip) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        transition: {
          ...selectedClip.transition,
          type,
        },
      },
    });
  }

  function setDuration(duration: number) {
    if (!selectedClip) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        transition: {
          ...selectedClip.transition,
          duration,
        },
      },
    });
  }

  // Preview animation
  function playPreview(type: TransitionType) {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    setPreviewType(type);
    setIsPlayingPreview(true);
    const dur = (selectedClip?.transition.duration ?? 0.5) * 1000;
    previewTimerRef.current = setTimeout(() => {
      setIsPlayingPreview(false);
    }, dur + 100);
  }

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  // Get preview animation style
  function getPreviewStyle(type: TransitionType): React.CSSProperties {
    if (!isPlayingPreview || previewType !== type) return {};
    const dur = `${currentTransition.duration}s`;
    
    switch (type) {
      case 'fade':
        return { animation: `transition-fade ${dur} ease-in-out` };
      case 'flash':
        return { animation: `transition-flash ${dur} ease-in-out` };
      case 'zoom-in':
        return { animation: `transition-zoom-in ${dur} ease-in-out` };
      case 'zoom-out':
        return { animation: `transition-zoom-out ${dur} ease-in-out` };
      case 'swipe-left':
        return { animation: `transition-swipe-left ${dur} ease-in-out` };
      case 'swipe-right':
        return { animation: `transition-swipe-right ${dur} ease-in-out` };
      case 'swipe-up':
        return { animation: `transition-swipe-up ${dur} ease-in-out` };
      case 'swipe-down':
        return { animation: `transition-swipe-down ${dur} ease-in-out` };
      case 'spin':
        return { animation: `transition-spin ${dur} ease-in-out` };
      case 'glitch':
        return { animation: `transition-glitch ${dur} steps(8)` };
      case 'blur':
        return { animation: `transition-blur ${dur} ease-in-out` };
      case 'cross-dissolve':
        return { animation: `transition-cross-dissolve ${dur} ease-in-out` };
      default:
        return {};
    }
  }

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-tertiary flex items-center justify-center">
          <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary mb-1">No clip selected</p>
        <p className="text-xs text-text-muted mb-3">Select a clip that has a neighbor to add transitions</p>
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-hover transition-colors">Close</button>
      </div>
    );
  }

  if (!adjacent) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bg-tertiary flex items-center justify-center">
          <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary mb-1">No adjacent clip</p>
        <p className="text-xs text-text-muted mb-3">Place another clip next to this one on the timeline to add a transition</p>
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-hover transition-colors">Close</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Transitions</h3>
            <p className="text-[10px] text-text-muted">Between clips</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preview area */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Preview</span>
            {currentTransition.type !== 'none' && (
              <button
                onClick={() => playPreview(currentTransition.type)}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-medium hover:bg-accent/20 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play
              </button>
            )}
          </div>
          <div
            ref={previewRef}
            className="relative h-28 rounded-xl overflow-hidden bg-bg-tertiary border border-border"
          >
            {/* Left clip (outgoing) */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-accent/40 to-accent-dim/40 flex items-center justify-center"
              style={
                isPlayingPreview && currentTransition.type !== 'none'
                  ? getPreviewStyle(currentTransition.type)
                  : {}
              }
            >
              <div className="text-center">
                <span className="text-2xl">🎬</span>
                <p className="text-[10px] text-white/70 mt-1">Clip 1</p>
              </div>
            </div>
            
            {/* Right clip (incoming) - shown during transition preview */}
            {isPlayingPreview && currentTransition.type !== 'none' && (
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center"
                style={getIncomingStyle(currentTransition.type, currentTransition.duration)}
              >
                <div className="text-center">
                  <span className="text-2xl">🎬</span>
                  <p className="text-[10px] text-white/70 mt-1">Clip 2</p>
                </div>
              </div>
            )}

            {/* Transition badge */}
            {currentTransition.type !== 'none' && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
                <span className="text-[10px] text-white font-medium">
                  {TRANSITIONS.find(t => t.type === currentTransition.type)?.label} • {currentTransition.duration.toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Transition grid */}
        <div>
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-2 block">Effects</span>
          <div className="grid grid-cols-4 gap-2">
            {TRANSITIONS.map(t => {
              const isActive = currentTransition.type === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => {
                    setTransition(t.type);
                    if (t.type !== 'none') playPreview(t.type);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'ring-2 shadow-lg scale-[1.02]'
                      : 'hover:scale-[1.02] hover:shadow-md'
                  }`}
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, ${t.color}33, ${t.color}11)`
                      : 'rgba(26, 26, 38, 0.8)',
                    borderColor: isActive ? t.color : 'transparent',
                    boxShadow: isActive ? `0 4px 12px ${t.color}22` : undefined,
                    ...(isActive ? { border: `1.5px solid ${t.color}88` } : { border: '1.5px solid transparent' }),
                  }}
                >
                  <span
                    className="text-xl transition-transform duration-200"
                    style={{ color: isActive ? t.color : '#9090a8' }}
                  >
                    {t.icon}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: isActive ? t.color : '#9090a8' }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration slider */}
        {currentTransition.type !== 'none' && (
          <div className="space-y-2 p-3 rounded-xl bg-bg-tertiary/50 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary font-medium">Duration</label>
              <span className="text-xs font-mono text-accent">{currentTransition.duration.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={currentTransition.duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-text-muted">
              <span>0.1s</span>
              <span>1.0s</span>
              <span>2.0s</span>
            </div>
          </div>
        )}

        {/* Remove transition */}
        {currentTransition.type !== 'none' && (
          <button
            onClick={() => setTransition('none')}
            className="w-full py-2.5 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/10 transition-colors"
          >
            Remove Transition
          </button>
        )}
      </div>
    </div>
  );
}

// Get the incoming clip's animation style for the preview
function getIncomingStyle(type: TransitionType, duration: number): React.CSSProperties {
  const dur = `${duration}s`;
  switch (type) {
    case 'fade':
      return { animation: `transition-fade-in ${dur} ease-in-out` };
    case 'flash':
      return { opacity: 0, animation: `transition-flash-in ${dur} ease-in-out` };
    case 'zoom-in':
      return { animation: `transition-zoom-in-incoming ${dur} ease-in-out` };
    case 'zoom-out':
      return { animation: `transition-zoom-out-incoming ${dur} ease-in-out` };
    case 'swipe-left':
      return { animation: `transition-swipe-left-in ${dur} ease-in-out` };
    case 'swipe-right':
      return { animation: `transition-swipe-right-in ${dur} ease-in-out` };
    case 'swipe-up':
      return { animation: `transition-swipe-up-in ${dur} ease-in-out` };
    case 'swipe-down':
      return { animation: `transition-swipe-down-in ${dur} ease-in-out` };
    case 'spin':
      return { animation: `transition-spin-in ${dur} ease-in-out` };
    case 'glitch':
      return { animation: `transition-glitch-in ${dur} steps(8)` };
    case 'blur':
      return { animation: `transition-blur-in ${dur} ease-in-out` };
    case 'cross-dissolve':
      return { animation: `transition-cross-dissolve-in ${dur} ease-in-out` };
    default:
      return {};
  }
}
