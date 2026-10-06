import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import VideoPreview from './VideoPreview';
import Timeline from './Timeline';
import ToolPanel from './ToolPanel';
import EffectsPanel from './EffectsPanel';
import TextEditor from './TextEditor';
import AudioPanel from './AudioPanel';
import TransitionsPanel from './TransitionsPanel';
import ExportModal from './ExportModal';
import { saveProject } from '../utils/db';
import type { BottomPanel } from '../types';

export default function Editor() {
  const { state, dispatch, selectedClip } = useProject();
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('none');
  const [showToolPanel, setShowToolPanel] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const project = state.project;
  if (!project) return null;

  // Auto-save project
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject(project).catch(console.error);
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [project]);

  const handleOpenPanel = useCallback((panel: BottomPanel) => {
    setBottomPanel(prev => prev === panel ? 'none' : panel);
  }, []);

  const handleClosePanel = useCallback(() => {
    setBottomPanel('none');
  }, []);

  function handleGoHome() {
    // Save before leaving
    saveProject(project).catch(console.error);
    dispatch({ type: 'SET_VIEW', view: 'home' });
  }

  function handleExport() {
    dispatch({ type: 'SET_EXPORT_MODAL', show: true });
  }

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-secondary/50 glass">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoHome}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-semibold text-text-primary truncate max-w-[140px]">{project.name}</h1>
            <p className="text-[10px] text-text-muted">{project.resolution} • {project.aspectRatio}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <button
            onClick={() => dispatch({ type: 'UNDO' })}
            disabled={state.historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-30"
            title="Undo"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => dispatch({ type: 'REDO' })}
            disabled={state.historyIndex >= state.history.length - 1}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-30"
            title="Redo"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="ml-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Preview */}
        <div className="flex-shrink-0 px-3 pt-3">
          <VideoPreview />
        </div>

        {/* Tool Panel (collapsible) */}
        {bottomPanel === 'none' && (
          <div className="flex-shrink-0 border-t border-border">
            <ToolPanel onOpenPanel={handleOpenPanel} />
          </div>
        )}

        {/* Bottom Panels */}
        {bottomPanel !== 'none' && (
          <div className="flex-1 min-h-0 border-t border-border overflow-hidden">
            {bottomPanel === 'effects' && <EffectsPanel mode="effects" onClose={handleClosePanel} />}
            {bottomPanel === 'adjustments' && <EffectsPanel mode="adjustments" onClose={handleClosePanel} />}
            {bottomPanel === 'filters' && <EffectsPanel mode="filters" onClose={handleClosePanel} />}
            {bottomPanel === 'text' && <TextEditor mode="text" onClose={handleClosePanel} />}
            {bottomPanel === 'stickers' && <TextEditor mode="stickers" onClose={handleClosePanel} />}
            {bottomPanel === 'audio' && <AudioPanel onClose={handleClosePanel} />}
            {bottomPanel === 'transitions' && <TransitionsPanel onClose={handleClosePanel} />}
          </div>
        )}

        {/* Timeline */}
        <div className="flex-shrink-0">
          <Timeline />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-2 py-1.5 border-t border-border bg-bg-secondary/80 glass">
        <NavButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
          label="Import"
          active={false}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*,image/*,audio/*';
            input.multiple = true;
            input.onchange = async (e: any) => {
              const files = e.target.files;
              if (!files) return;
              const { loadMediaFile } = await import('../utils/mediaUtils');
              for (let i = 0; i < files.length; i++) {
                const media = await loadMediaFile(files[i]);
                dispatch({
                  type: 'UPDATE_PROJECT',
                  updates: { mediaLibrary: [...project.mediaLibrary, media] },
                });
                const trackIndex = media.type === 'audio' ? 3 : 0;
                const lastEnd = project.clips
                  .filter(c => c.trackIndex === trackIndex)
                  .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
                const { addClip } = await import('../store/ProjectContext').then(m => ({ addClip: null }));
                // Use dispatch directly
                const clip = {
                  id: crypto.randomUUID(),
                  type: media.type === 'audio' ? 'audio' as const : 'video' as const,
                  trackIndex,
                  startTime: lastEnd,
                  duration: media.duration,
                  trimStart: 0,
                  trimEnd: 0,
                  speed: 1,
                  reversed: false,
                  volume: 1,
                  fadeIn: 0,
                  fadeOut: 0,
                  effects: { blur: 0, brightness: 0, contrast: 0, saturation: 0, grayscale: 0, sepia: 0, vignette: 0, exposure: 0, sharpness: 0, temperature: 0 },
                  keyframes: [],
                  transition: { type: 'none' as const, duration: 0.5 },
                  mediaId: media.id,
                  mediaUrl: media.url,
                  position: { x: 50, y: 50 },
                  scale: 1,
                  rotation: 0,
                  opacity: 1,
                  chromaKey: { enabled: false, color: '#00ff00', tolerance: 30 },
                  bgRemoval: false,
                };
                dispatch({ type: 'ADD_CLIP', clip });
              }
            };
            input.click();
          }}
        />
        <NavButton
          icon={<span className="text-lg">T</span>}
          label="Text"
          active={bottomPanel === 'text'}
          onClick={() => handleOpenPanel('text')}
        />
        <NavButton
          icon={<span className="text-lg">😀</span>}
          label="Stickers"
          active={bottomPanel === 'stickers'}
          onClick={() => handleOpenPanel('stickers')}
        />
        <NavButton
          icon={<span className="text-lg">🎵</span>}
          label="Audio"
          active={bottomPanel === 'audio'}
          onClick={() => handleOpenPanel('audio')}
        />
        <NavButton
          icon={<span className="text-lg">✨</span>}
          label="Effects"
          active={bottomPanel === 'effects' || bottomPanel === 'adjustments' || bottomPanel === 'filters'}
          onClick={() => handleOpenPanel('effects')}
        />
      </nav>

      {/* Export Modal */}
      {state.showExportModal && <ExportModal />}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
        active ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}
