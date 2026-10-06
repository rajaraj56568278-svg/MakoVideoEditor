import React, { useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { loadMediaFile, getMediaAccept } from '../utils/mediaUtils';
import type { BottomPanel } from '../types';

interface ToolPanelProps {
  onOpenPanel: (panel: BottomPanel) => void;
}

export default function ToolPanel({ onOpenPanel }: ToolPanelProps) {
  const { state, dispatch, selectedClip, deleteClip, splitClip, addClip } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = state.project;
  if (!project) return null;

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const media = await loadMediaFile(file);
        // Add to library
        dispatch({
          type: 'UPDATE_PROJECT',
          updates: {
            mediaLibrary: [...project.mediaLibrary, media],
          },
        });

        // Add clip to timeline
        const trackIndex = media.type === 'audio' ? 3 : media.type === 'image' ? 1 : 0;
        const lastClipEnd = project.clips
          .filter(c => c.trackIndex === trackIndex)
          .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

        addClip({
          type: media.type === 'audio' ? 'audio' : 'video',
          trackIndex,
          startTime: lastClipEnd,
          duration: media.duration,
          mediaId: media.id,
          mediaUrl: media.url,
        });
      } catch (err) {
        console.error('Failed to import:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSplit() {
    if (selectedClip) {
      splitClip(selectedClip.id);
    }
  }

  function handleDelete() {
    if (selectedClip) {
      deleteClip(selectedClip.id);
    }
  }

  function handleSpeedChange(speed: number) {
    if (selectedClip) {
      dispatch({
        type: 'UPDATE_CLIP',
        clipId: selectedClip.id,
        updates: { speed },
      });
    }
  }

  function handleReverse() {
    if (selectedClip) {
      dispatch({
        type: 'UPDATE_CLIP',
        clipId: selectedClip.id,
        updates: { reversed: !selectedClip.reversed },
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions Bar */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-border overflow-x-auto">
        {/* Import */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors min-w-[56px]"
        >
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[9px] text-text-secondary">Import</span>
        </button>

        {/* Split */}
        <button
          onClick={handleSplit}
          disabled={!selectedClip}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors min-w-[56px] disabled:opacity-30"
        >
          <svg className="w-5 h-5 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-[9px] text-text-secondary">Split</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={!selectedClip}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors min-w-[56px] disabled:opacity-30"
        >
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-[9px] text-text-secondary">Delete</span>
        </button>

        {/* Speed */}
        <button
          onClick={() => {
            if (selectedClip) {
              const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
              const idx = speeds.indexOf(selectedClip.speed);
              const next = speeds[(idx + 1) % speeds.length];
              handleSpeedChange(next);
            }
          }}
          disabled={!selectedClip}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors min-w-[56px] disabled:opacity-30"
        >
          <span className="text-sm font-bold text-text-primary">{selectedClip?.speed ?? 1}x</span>
          <span className="text-[9px] text-text-secondary">Speed</span>
        </button>

        {/* Reverse */}
        <button
          onClick={handleReverse}
          disabled={!selectedClip}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors min-w-[56px] disabled:opacity-30"
        >
          <svg className={`w-5 h-5 ${selectedClip?.reversed ? 'text-accent' : 'text-text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-[9px] text-text-secondary">Reverse</span>
        </button>

        {/* Undo / Redo */}
        <div className="w-px h-8 bg-border mx-1" />
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.historyIndex <= 0}
          className="p-2 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-30"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={state.historyIndex >= state.history.length - 1}
          className="p-2 rounded-lg hover:bg-bg-hover transition-colors disabled:opacity-30"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      {/* Bottom Tool Tabs */}
      <div className="flex-1 overflow-y-auto">
        {selectedClip ? (
          <SelectedClipTools selectedClip={selectedClip} onOpenPanel={onOpenPanel} />
        ) : (
          <NoSelectionTools onOpenPanel={onOpenPanel} />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={getMediaAccept()}
        multiple
        className="hidden"
        onChange={handleImport}
      />
    </div>
  );
}

function SelectedClipTools({ selectedClip, onOpenPanel }: { selectedClip: any; onOpenPanel: (p: BottomPanel) => void }) {
  const { dispatch } = useProject();
  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-text-secondary font-medium">
        Editing: <span className="text-text-primary">{selectedClip.type} clip</span>
      </p>

      {/* Row 1: Core editing */}
      <div className="grid grid-cols-4 gap-2">
        <ToolButton icon="✂️" label="Trim" onClick={() => onOpenPanel('trim')} />
        <ToolButton icon="" label="Speed" onClick={() => onOpenPanel('speed')} />
        <ToolButton icon="📐" label="Crop" onClick={() => onOpenPanel('crop')} />
        <ToolButton icon="🔄" label="Transition" onClick={() => onOpenPanel('transitions')} />
      </div>

      {/* Row 2: Visual */}
      <div className="grid grid-cols-5 gap-2">
        <ToolButton icon="✨" label="Effects" onClick={() => onOpenPanel('effects')} />
        <ToolButton icon="🎨" label="Adjust" onClick={() => onOpenPanel('adjustments')} />
        <ToolButton icon="🎬" label="Filters" onClick={() => onOpenPanel('filters')} />
        <ToolButton icon="" label="Chroma" onClick={() => onOpenPanel('chroma')} />
        <ToolButton icon="📊" label="Keyframe" onClick={() => onOpenPanel('keyframe')} />
      </div>

      {/* Volume slider for video/audio clips */}
      {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Volume: {Math.round(selectedClip.volume * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedClip.volume}
            onChange={e => dispatch({
              type: 'UPDATE_CLIP',
              clipId: selectedClip.id,
              updates: { volume: Number(e.target.value) },
            })}
            className="w-full"
          />
        </div>
      )}

      {/* Fade controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Fade In: {selectedClip.fadeIn.toFixed(1)}s</label>
          <input type="range" min="0" max="3" step="0.1" value={selectedClip.fadeIn} className="w-full" onChange={e => dispatch({
            type: 'UPDATE_CLIP',
            clipId: selectedClip.id,
            updates: { fadeIn: Number(e.target.value) },
          })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Fade Out: {selectedClip.fadeOut.toFixed(1)}s</label>
          <input type="range" min="0" max="3" step="0.1" value={selectedClip.fadeOut} className="w-full" onChange={e => dispatch({
            type: 'UPDATE_CLIP',
            clipId: selectedClip.id,
            updates: { fadeOut: Number(e.target.value) },
          })} />
        </div>
      </div>
    </div>
  );
}

function NoSelectionTools({ onOpenPanel }: { onOpenPanel: (p: BottomPanel) => void }) {
  return (
    <div className="p-3 space-y-3">
      <p className="text-xs text-text-secondary">Select a clip to edit, or add new content:</p>
      <div className="grid grid-cols-4 gap-2">
        <ToolButton icon="T" label="Text" onClick={() => onOpenPanel('text')} />
        <ToolButton icon="😀" label="Stickers" onClick={() => onOpenPanel('stickers')} />
        <ToolButton icon="🎵" label="Audio" onClick={() => onOpenPanel('audio')} />
        <ToolButton icon="✨" label="Effects" onClick={() => onOpenPanel('effects')} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <ToolButton icon="" label="Crop" onClick={() => onOpenPanel('crop')} />
        <ToolButton icon="🔄" label="Speed" onClick={() => onOpenPanel('speed')} />
        <ToolButton icon="" label="Chroma" onClick={() => onOpenPanel('chroma')} />
        <ToolButton icon="" label="AI Remove" onClick={() => {}} comingSoon />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <ToolButton icon="" label="Captions" onClick={() => {}} comingSoon />
        <ToolButton icon="📊" label="Keyframe" onClick={() => onOpenPanel('keyframe')} />
        <ToolButton icon="🎬" label="Filters" onClick={() => onOpenPanel('filters')} />
        <ToolButton icon="" label="Adjust" onClick={() => onOpenPanel('adjustments')} />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, comingSoon }: { icon: string; label: string; onClick: () => void; comingSoon?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-xl bg-bg-tertiary hover:bg-bg-hover active:scale-95 transition-all relative"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-text-secondary">{label}</span>
      {comingSoon && (
        <span className="absolute -top-1 -right-1 text-[7px] bg-warning/20 text-warning px-1 rounded">Soon</span>
      )}
    </button>
  );
}
