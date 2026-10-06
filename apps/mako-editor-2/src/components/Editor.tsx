import { useCallback, useEffect, useRef } from 'react';
import {
  ArrowLeft, Undo2, Redo2, Download, Play, Pause,
  SkipBack, SkipForward, Scissors, Type, Image, Music,
  Sparkles, Sliders, Layers, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { useHistoryStore } from '../store/historyStore';
import { VideoPreview } from './VideoPreview';
import { Timeline } from './Timeline';
import { ToolPanel } from './ToolPanel';
import { ExportDialog } from './ExportDialog';
import { MediaPicker } from './MediaPicker';
import { formatTime } from '../utils/timeFormat';
import { saveProject } from '../utils/storage';
import type { ToolType } from '../types';

interface Props {
  onBack: () => void;
}

const TOOL_BUTTONS: { tool: ToolType; icon: React.ElementType; label: string }[] = [
  { tool: 'trim', icon: Scissors, label: 'Trim' },
  { tool: 'speed', icon: SkipForward, label: 'Speed' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'sticker', icon: Image, label: 'Sticker' },
  { tool: 'audio', icon: Music, label: 'Audio' },
  { tool: 'effects', icon: Sparkles, label: 'Effects' },
  { tool: 'adjust', icon: Sliders, label: 'Adjust' },
  { tool: 'transition', icon: Layers, label: 'Transition' },
];

export function Editor({ onBack }: Props) {
  const {
    project, currentTime, isPlaying, activeTool, timelineZoom,
    setIsPlaying, setCurrentTime, setActiveTool, setTimelineZoom,
    getProjectDuration, showExportDialog, updateProject,
  } = useProjectStore();

  const { undo, redo, canUndo, canRedo, pushHistory } = useHistoryStore();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save
  useEffect(() => {
    if (!project) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject(project).catch(console.error);
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [project]);

  // Update project duration
  useEffect(() => {
    if (project) {
      const duration = getProjectDuration();
      if (Math.abs(duration - project.duration) > 0.1) {
        updateProject({ duration });
      }
    }
  }, [project?.tracks, project?.audioTracks]);

  // Push history on significant changes
  const pushHistoryRef = useRef(pushHistory);
  pushHistoryRef.current = pushHistory;
  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => {
      pushHistoryRef.current(project, 'Edit');
    }, 1000);
    return () => clearTimeout(timer);
  }, [project?.tracks, project?.audioTracks, project?.transitions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(!isPlaying); }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) { const p = redo(); if (p) useProjectStore.getState().loadProject(p); }
        else { const p = undo(); if (p) useProjectStore.getState().loadProject(p); }
      }
      if (e.code === 'ArrowLeft') setCurrentTime(currentTime - 1);
      if (e.code === 'ArrowRight') setCurrentTime(currentTime + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, currentTime, setIsPlaying, setCurrentTime, undo, redo]);

  const handleUndo = useCallback(() => {
    const p = undo();
    if (p) useProjectStore.getState().loadProject(p);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const p = redo();
    if (p) useProjectStore.getState().loadProject(p);
  }, [redo]);

  if (!project) return null;

  return (
    <div className="h-full w-full flex flex-col bg-bg-primary">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border-primary bg-bg-secondary flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-sm font-semibold text-text-primary truncate max-w-[120px]">
            {project.name}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo()}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo()}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
          <div className="w-px h-5 bg-border-primary mx-1" />
          <button
            onClick={() => useProjectStore.setState({ showExportDialog: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </header>

      {/* Video Preview */}
      <div className="flex-shrink-0">
        <VideoPreview />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border-primary flex-shrink-0">
        <button
          onClick={() => setCurrentTime(0)}
          className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-secondary transition-colors"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center transition-colors"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <span className="text-xs text-text-secondary font-mono min-w-[80px] text-center">
          {formatTime(currentTime)} / {formatTime(getProjectDuration())}
        </span>
      </div>

      {/* Tool Buttons */}
      <div className="flex items-center gap-1 px-2 py-2 bg-bg-secondary border-t border-border-primary overflow-x-auto flex-shrink-0">
        {TOOL_BUTTONS.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => setActiveTool(activeTool === tool ? 'none' : tool)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 ${
              activeTool === tool
                ? 'bg-accent/20 text-accent'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <Icon size={16} />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>

      {/* Tool Panel */}
      {activeTool !== 'none' && (
        <div className="flex-shrink-0">
          <ToolPanel />
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-border-primary">
        <Timeline />
      </div>

      {/* Export Dialog */}
      {showExportDialog && <ExportDialog />}
    </div>
  );
}
