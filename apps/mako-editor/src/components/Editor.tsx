import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import VideoPreview from './VideoPreview';
import Timeline from './Timeline';
import ToolPanel from './ToolPanel';
import EffectsPanel from './EffectsPanel';
import TextEditor from './TextEditor';
import AudioPanel from './AudioPanel';
import TransitionsPanel from './TransitionsPanel';
import SpeedPanel from './SpeedPanel';
import CropPanel from './CropPanel';
import ChromaKeyPanel from './ChromaKeyPanel';
import KeyframePanel from './KeyframePanel';
import TrimPanel from './TrimPanel';
import FiltersPanel from './FiltersPanel';
import AiHdPanel from './panels/AiHdPanel';
import FaceSmoothPanel from './panels/FaceSmoothPanel';
import BeautyPanel from './panels/BeautyPanel';
import PortraitPanel from './panels/PortraitPanel';
import AutoCaptionsPanel from './panels/AutoCaptionsPanel';
import AiBackgroundPanel from './panels/AiBackgroundPanel';
import AvatarPanel from './panels/AvatarPanel';
import ExportModal from './ExportModal';
import { saveProject } from '../utils/db';
import type { BottomPanel } from '../types';

export default function Editor() {
  const { state, dispatch, selectedClip } = useProject();
  const [showToolPanel, setShowToolPanel] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const project = state.project;
  if (!project) return null;

  const bottomPanel = state.bottomPanel;

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
    dispatch({ type: 'SET_BOTTOM_PANEL', panel: state.bottomPanel === panel ? 'none' : panel });
  }, [state.bottomPanel, dispatch]);

  const handleClosePanel = useCallback(() => {
    dispatch({ type: 'SET_BOTTOM_PANEL', panel: 'none' });
  }, [dispatch]);

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
            <p className="text-[10px] text-text-muted flex items-center gap-1">
              {project.resolution} • {project.aspectRatio}
              {state.aiHd.enabled && (
                <span className="inline-flex items-center gap-0.5 px-1 py-px rounded bg-violet-500/20 text-violet-400 font-medium">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI HD
                </span>
              )}
            </p>
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
            {bottomPanel === 'filters' && <FiltersPanel onClose={handleClosePanel} />}
            {bottomPanel === 'text' && <TextEditor mode="text" onClose={handleClosePanel} />}
            {bottomPanel === 'stickers' && <TextEditor mode="stickers" onClose={handleClosePanel} />}
            {bottomPanel === 'audio' && <AudioPanel onClose={handleClosePanel} />}
            {bottomPanel === 'transitions' && <TransitionsPanel onClose={handleClosePanel} />}
            {bottomPanel === 'speed' && <SpeedPanel onClose={handleClosePanel} />}
            {bottomPanel === 'crop' && <CropPanel onClose={handleClosePanel} />}
            {bottomPanel === 'chroma' && <ChromaKeyPanel onClose={handleClosePanel} />}
            {bottomPanel === 'keyframe' && <KeyframePanel onClose={handleClosePanel} />}
            {bottomPanel === 'trim' && <TrimPanel onClose={handleClosePanel} />}
            {bottomPanel === 'aihd' && <AiHdPanel onClose={handleClosePanel} />}
            {bottomPanel === 'facesmooth' && <FaceSmoothPanel onClose={handleClosePanel} />}
            {bottomPanel === 'beauty' && <BeautyPanel onClose={handleClosePanel} />}
            {bottomPanel === 'portrait' && <PortraitPanel onClose={handleClosePanel} />}
            {bottomPanel === 'captions' && <AutoCaptionsPanel onClose={handleClosePanel} />}
            {bottomPanel === 'bgRemove' && <AiBackgroundPanel onClose={handleClosePanel} />}
            {bottomPanel === 'avatar' && <AvatarPanel onClose={handleClosePanel} />}
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
                const trackIndex = media.type === 'audio' ? 3 : media.type === 'image' ? 1 : 0;
                const lastEnd = project.clips
                  .filter(c => c.trackIndex === trackIndex)
                  .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
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
                  activeFilter: 'original' as const,
                  filterIntensity: 100,
                  faceSmooth: { enabled: false, smoothness: 30, skinDetail: 50 },
                  beauty: { enabled: false, skinSmooth: 0, brightness: 50, contrast: 50, sharpness: 0, skinTone: 50, faceLight: 0 },
                  portrait: { enabled: false, faceLight: 0, smooth: 0, detail: 0, bgBlur: 0, focus: 0 },
                  bgRemovalSettings: { enabled: false, mode: 'transparent' as const, blurAmount: 50, customImageUrl: null, customVideoUrl: null, processing: false, progress: 0 },
                };
                dispatch({ type: 'ADD_CLIP', clip });
              }
            };
            input.click();
          }}
        />
        <NavButton
          icon={<span className="text-lg">🔄</span>}
          label="Transition"
          active={bottomPanel === 'transitions'}
          onClick={() => handleOpenPanel('transitions')}
        />
        <NavButton
          icon={<span className="text-lg">️</span>}
          label="Trim"
          active={bottomPanel === 'trim'}
          onClick={() => handleOpenPanel('trim')}
        />
        <NavButton
          icon={<span className="text-lg"></span>}
          label="Speed"
          active={bottomPanel === 'speed'}
          onClick={() => handleOpenPanel('speed')}
        />
        <NavButton
          icon={<span className="text-lg">T</span>}
          label="Text"
          active={bottomPanel === 'text'}
          onClick={() => handleOpenPanel('text')}
        />
        <NavButton
          icon={<span className="text-lg">✨</span>}
          label="Effects"
          active={bottomPanel === 'effects' || bottomPanel === 'adjustments'}
          onClick={() => handleOpenPanel('effects')}
        />
        <NavButton
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.828 2.828a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
          label="Filters"
          active={bottomPanel === 'filters'}
          onClick={() => handleOpenPanel('filters')}
        />
        <NavButton
          icon={
            <span className="relative">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {state.aiHd.enabled && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              )}
            </span>
          }
          label="AI HD"
          active={bottomPanel === 'aihd'}
          onClick={() => handleOpenPanel('aihd')}
          highlight={state.aiHd.enabled}
        />
      </nav>

      {/* Export Modal */}
      {state.showExportModal && <ExportModal />}
    </div>
  );
}

function NavButton({ icon, label, active, onClick, highlight }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
        active ? 'text-accent' : highlight ? 'text-violet-400' : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {icon}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}
