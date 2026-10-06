import { useRef, useCallback, useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { MediaPicker } from './MediaPicker';
import { formatTime } from '../utils/timeFormat';
import { Plus, Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import type { Clip, Track } from '../types';

const TRACK_COLORS: Record<string, string> = {
  video: 'bg-track-video',
  audio: 'bg-track-audio',
  text: 'bg-track-text',
  sticker: 'bg-track-sticker',
  overlay: 'bg-track-overlay',
};

const TRACK_HEIGHT = 48;
const PIXELS_PER_SECOND_BASE = 60;

export function Timeline() {
  const {
    project, currentTime, selectedClipId, timelineZoom,
    setCurrentTime, selectClip, setTimelineZoom, addClip,
    removeClip, splitClip, toggleTrackMute, toggleTrackLock, toggleTrackVisibility,
    getProjectDuration,
  } = useProjectStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ clipId: string; type: 'move' | 'trimLeft' | 'trimRight'; startX: number; startVal: number } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const duration = getProjectDuration();
  const totalWidth = Math.max(duration * PIXELS_PER_SECOND_BASE * timelineZoom, 600);
  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * timelineZoom;

  // Playhead position
  const playheadX = currentTime * pixelsPerSecond;

  // Scroll to keep playhead visible
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const visible = el.clientWidth;
    if (playheadX < el.scrollLeft + 50) {
      el.scrollLeft = playheadX - 50;
    } else if (playheadX > el.scrollLeft + visible - 50) {
      el.scrollLeft = playheadX - visible + 50;
    }
  }, [playheadX]);

  // Click on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    setCurrentTime(x / pixelsPerSecond);
  }, [pixelsPerSecond, setCurrentTime, dragging]);

  // Clip drag handlers
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: string, type: 'move' | 'trimLeft' | 'trimRight') => {
    e.stopPropagation();
    e.preventDefault();
    selectClip(clipId);
    const clip = project?.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
    if (!clip) return;

    if (type === 'move') {
      setDragging({ clipId, type, startX: e.clientX, startVal: clip.startTime });
    } else if (type === 'trimLeft') {
      setDragging({ clipId, type, startX: e.clientX, startVal: clip.trimStart });
    } else {
      setDragging({ clipId, type, startX: e.clientX, startVal: clip.trimEnd });
    }
  }, [project, selectClip]);

  // Mouse move for drag
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dt = dx / pixelsPerSecond;

      if (dragging.type === 'move') {
        const newStart = Math.max(0, dragging.startVal + dt);
        useProjectStore.getState().updateClip(dragging.clipId, { startTime: newStart });
      } else if (dragging.type === 'trimLeft') {
        const clip = project?.tracks.flatMap(t => t.clips).find(c => c.id === dragging.clipId);
        if (!clip) return;
        const newTrimStart = Math.max(0, Math.min(clip.originalDuration - 0.5, dragging.startVal + dt / clip.speed));
        const newDuration = (clip.trimEnd - newTrimStart) * clip.speed;
        useProjectStore.getState().updateClip(dragging.clipId, { trimStart: newTrimStart, duration: newDuration });
      } else {
        const clip = project?.tracks.flatMap(t => t.clips).find(c => c.id === dragging.clipId);
        if (!clip) return;
        const newTrimEnd = Math.max(clip.trimStart + 0.5, Math.min(clip.originalDuration, dragging.startVal + dt / clip.speed));
        const newDuration = (newTrimEnd - clip.trimStart) * clip.speed;
        useProjectStore.getState().updateClip(dragging.clipId, { trimEnd: newTrimEnd, duration: newDuration });
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, pixelsPerSecond, project]);

  // Touch support for timeline seek
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.touches[0].clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    setCurrentTime(Math.max(0, x / pixelsPerSecond));
  }, [pixelsPerSecond, setCurrentTime]);

  if (!project) return null;

  // Time ruler markers
  const markers: number[] = [];
  const step = timelineZoom >= 2 ? 1 : timelineZoom >= 1 ? 2 : 5;
  for (let t = 0; t <= duration + step; t += step) {
    markers.push(t);
  }

  return (
    <div className="flex flex-col h-full bg-bg-secondary">
      {/* Timeline toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-primary flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimelineZoom(timelineZoom - 0.25)}
            className="p-1 rounded hover:bg-bg-tertiary text-text-muted transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] text-text-muted font-mono w-8 text-center">
            {timelineZoom.toFixed(1)}x
          </span>
          <button
            onClick={() => setTimelineZoom(timelineZoom + 0.25)}
            className="p-1 rounded hover:bg-bg-tertiary text-text-muted transition-colors"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedClipId && (
            <>
              <button
                onClick={() => splitClip(selectedClipId, currentTime)}
                className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
              >
                Split
              </button>
              <button
                onClick={() => removeClip(selectedClipId)}
                className="p-1 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-[10px]"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>

      {/* Timeline scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
        <div ref={timelineRef} className="relative" style={{ width: totalWidth, minHeight: project.tracks.length * TRACK_HEIGHT + 30 }}>
          {/* Time ruler */}
          <div className="sticky top-0 z-20 h-6 bg-bg-tertiary border-b border-border-primary flex items-end">
            {markers.map(t => (
              <div
                key={t}
                className="absolute bottom-0 flex flex-col items-center"
                style={{ left: t * pixelsPerSecond }}
              >
                <span className="text-[9px] text-text-muted font-mono mb-0.5">
                  {formatTime(t)}
                </span>
                <div className="w-px h-2 bg-border-primary" />
              </div>
            ))}
          </div>

          {/* Tracks */}
          {project.tracks.map((track, trackIndex) => (
            <div
              key={track.id}
              className="relative border-b border-border-primary"
              style={{ height: TRACK_HEIGHT }}
            >
              {/* Track label */}
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-bg-secondary/90 z-10 flex items-center justify-center gap-1 border-r border-border-primary">
                <span className="text-[9px] text-text-muted uppercase font-medium">
                  {track.type}
                </span>
                <button
                  onClick={() => track.type === 'video' ? toggleTrackMute(track.id) : toggleTrackVisibility(track.id)}
                  className="p-0.5 rounded hover:bg-bg-tertiary text-text-muted"
                >
                  {track.type === 'video' ? (
                    track.muted ? <VolumeX size={10} /> : <Volume2 size={10} />
                  ) : (
                    track.visible ? <Eye size={10} /> : <EyeOff size={10} />
                  )}
                </button>
              </div>

              {/* Clips */}
              <div className="absolute left-16 right-0 top-0 bottom-0">
                {track.clips.map(clip => {
                  const left = clip.startTime * pixelsPerSecond;
                  const width = clip.duration * pixelsPerSecond;
                  const isSelected = clip.id === selectedClipId;

                  return (
                    <div
                      key={clip.id}
                      className={`absolute top-1 bottom-1 rounded-md cursor-pointer transition-shadow ${TRACK_COLORS[clip.type] || 'bg-bg-elevated'} ${
                        isSelected ? 'ring-2 ring-white shadow-lg' : 'hover:ring-1 hover:ring-white/30'
                      } ${track.locked ? 'opacity-60' : ''}`}
                      style={{ left, width: Math.max(width, 20) }}
                      onMouseDown={(e) => !track.locked && handleClipMouseDown(e, clip.id, 'move')}
                    >
                      {/* Clip content */}
                      <div className="h-full flex items-center px-2 overflow-hidden">
                        <span className="text-[10px] text-white/90 font-medium truncate">
                          {clip.type === 'text' ? clip.textOverlay?.text : clip.fileName}
                        </span>
                      </div>

                      {/* Trim handles */}
                      {!track.locked && (
                        <>
                          <div
                            className="clip-handle clip-handle-left"
                            onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'trimLeft')}
                          />
                          <div
                            className="clip-handle clip-handle-right"
                            onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'trimRight')}
                          />
                        </>
                      )}

                      {/* Speed indicator */}
                      {clip.speed !== 1 && (
                        <div className="absolute bottom-0.5 right-1 text-[8px] text-white/60 bg-black/40 px-1 rounded">
                          {clip.speed}x
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Audio tracks */}
          {project.audioTracks.map(audio => (
            <div
              key={audio.id}
              className="relative border-b border-border-primary"
              style={{ height: TRACK_HEIGHT }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-bg-secondary/90 z-10 flex items-center justify-center border-r border-border-primary">
                <span className="text-[9px] text-track-audio uppercase font-medium">audio</span>
              </div>
              <div className="absolute left-16 right-0 top-0 bottom-0">
                <div
                  className="absolute top-1 bottom-1 rounded-md bg-track-audio/80 flex items-center px-2"
                  style={{ left: audio.startTime * pixelsPerSecond, width: audio.duration * pixelsPerSecond }}
                >
                  <span className="text-[10px] text-white/90 truncate">{audio.name}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: playheadX }}
          >
            <div className="w-0.5 h-full bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full border-2 border-white" />
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {showPicker && (
        <MediaPicker onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
