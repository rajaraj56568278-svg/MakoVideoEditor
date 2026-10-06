import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { secondsToPixels, formatTimeShort } from '../utils/timeUtils';
import type { Clip } from '../types';

export default function Timeline() {
  const { state, dispatch, selectedClip } = useProject();
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState(0);
  const [trimming, setTrimming] = useState<{ clipId: string; edge: 'start' | 'end' } | null>(null);

  const project = state.project;
  if (!project) return null;

  const totalWidth = secondsToPixels(project.duration, state.zoom);
  const playheadX = secondsToPixels(state.currentTime, state.zoom);

  // Time ruler marks
  const marks: number[] = [];
  const step = state.zoom >= 2 ? 1 : state.zoom >= 1 ? 2 : 5;
  for (let t = 0; t <= project.duration; t += step) {
    marks.push(t);
  }

  // Seek on timeline click
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    const time = x / (50 * state.zoom);
    dispatch({ type: 'SET_TIME', time: Math.max(0, Math.min(project.duration, time)) });
  }, [state.zoom, project.duration, dispatch]);

  // Clip drag
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_CLIP', clipId });
    setDragging(clipId);
    setDragStart(e.clientX);
  }, [dispatch]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging && scrollRef.current) {
      const dx = e.clientX - dragStart;
      const dt = dx / (50 * state.zoom);
      const clip = project.clips.find(c => c.id === dragging);
      if (clip) {
        const newStart = Math.max(0, clip.startTime + dt);
        dispatch({ type: 'UPDATE_CLIP', clipId: dragging, updates: { startTime: newStart } });
        setDragStart(e.clientX);
      }
    }
    if (trimming && scrollRef.current) {
      const dx = e.clientX - dragStart;
      const dt = dx / (50 * state.zoom);
      const clip = project.clips.find(c => c.id === trimming.clipId);
      if (clip) {
        if (trimming.edge === 'start') {
          const newTrim = Math.max(0, Math.min(clip.duration - 0.5, clip.trimStart + dt));
          const delta = newTrim - clip.trimStart;
          dispatch({
            type: 'UPDATE_CLIP',
            clipId: trimming.clipId,
            updates: {
              trimStart: newTrim,
              startTime: clip.startTime + delta,
              duration: clip.duration - delta,
            },
          });
        } else {
          const newTrim = Math.max(0, Math.min(clip.duration - 0.5, clip.trimEnd - dt));
          dispatch({
            type: 'UPDATE_CLIP',
            clipId: trimming.clipId,
            updates: {
              trimEnd: newTrim,
              duration: clip.duration + dt,
            },
          });
        }
        setDragStart(e.clientX);
      }
    }
  }, [dragging, trimming, dragStart, state.zoom, project.clips, dispatch]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setTrimming(null);
  }, []);

  // Auto-scroll to playhead when playing
  useEffect(() => {
    if (state.isPlaying && scrollRef.current) {
      const container = scrollRef.current;
      const viewWidth = container.clientWidth;
      if (playheadX > container.scrollLeft + viewWidth - 100) {
        container.scrollLeft = playheadX - viewWidth * 0.3;
      }
    }
  }, [state.currentTime, state.isPlaying]);

  const getClipColor = (type: string) => {
    switch (type) {
      case 'video': return 'clip-video';
      case 'audio': return 'clip-audio';
      case 'text': return 'clip-text';
      case 'sticker':
      case 'overlay': return 'clip-sticker';
      default: return 'clip-video';
    }
  };

  const getClipLabel = (clip: Clip) => {
    switch (clip.type) {
      case 'video': return '🎬 Video';
      case 'audio': return '🎵 Audio';
      case 'text': return clip.textConfig?.text?.slice(0, 12) || 'Text';
      case 'sticker':
      case 'overlay': return clip.stickerUrl || 'Sticker';
      default: return 'Clip';
    }
  };

  return (
    <div className="flex flex-col bg-timeline-bg border-t border-border">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 0.25 })}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-xs text-text-muted min-w-[36px] text-center">{Math.round(state.zoom * 100)}%</span>
          <button
            onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 0.25 })}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>

        <span className="text-xs font-mono text-text-secondary">
          {formatTimeShort(state.currentTime)} / {formatTimeShort(project.duration)}
        </span>
      </div>

      {/* Scrollable timeline area */}
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto relative"
        style={{ maxHeight: '200px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={timelineRef} style={{ width: Math.max(totalWidth, 800), minWidth: '100%' }}>
          {/* Time ruler */}
          <div className="relative h-6 border-b border-border bg-bg-secondary/50" onClick={handleTimelineClick}>
            {marks.map(t => (
              <div
                key={t}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: secondsToPixels(t, state.zoom) }}
              >
                <div className="w-px h-2 bg-border-light" />
                <span className="text-[9px] text-text-muted mt-0.5">{formatTimeShort(t)}</span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          {project.tracks.map((track, trackIndex) => {
            const trackClips = project.clips.filter(c => c.trackIndex === trackIndex);

            return (
              <div key={track.id} className="relative h-12 border-b border-border/50 group">
                {/* Track label */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-bg-secondary/80 z-10 flex items-center px-2 border-r border-border">
                  <span className="text-[10px] text-text-muted truncate">{track.name}</span>
                </div>

                {/* Track content area */}
                <div className="ml-16 h-full relative">
                  {/* Clips */}
                  {trackClips.map(clip => {
                    const left = secondsToPixels(clip.startTime, state.zoom);
                    const width = secondsToPixels(clip.duration, state.zoom);
                    const isSelected = clip.id === state.selectedClipId;

                    return (
                      <div
                        key={clip.id}
                        className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-shadow ${getClipColor(clip.type)} ${isSelected ? 'ring-2 ring-white shadow-lg' : 'hover:brightness-110'}`}
                        style={{ left, width: Math.max(width, 20), minWidth: 20 }}
                        onMouseDown={e => handleClipMouseDown(e, clip.id)}
                      >
                        {/* Clip label */}
                        <div className="px-1.5 py-0.5 text-[10px] text-white/90 truncate font-medium">
                          {getClipLabel(clip)}
                        </div>

                        {/* Speed indicator */}
                        {clip.speed !== 1 && (
                          <div className="absolute bottom-0.5 right-1 text-[8px] text-white/60">
                            {clip.speed}x
                          </div>
                        )}

                        {/* Reversed indicator */}
                        {clip.reversed && (
                          <div className="absolute bottom-0.5 left-1 text-[8px] text-white/60">
                            ⟲
                          </div>
                        )}

                        {/* Trim handles */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-l-md"
                          onMouseDown={e => {
                            e.stopPropagation();
                            setTrimming({ clipId: clip.id, edge: 'start' });
                            setDragStart(e.clientX);
                          }}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r-md"
                          onMouseDown={e => {
                            e.stopPropagation();
                            setTrimming({ clipId: clip.id, edge: 'end' });
                            setDragStart(e.clientX);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-playhead z-20 pointer-events-none"
            style={{ left: playheadX + 64 }}
          >
            <div className="w-3 h-3 bg-playhead rounded-full -ml-[5px] -mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
