import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import type { Project } from '../types';

interface CropPanelProps {
  onClose: () => void;
}

const ASPECT_RATIOS: { label: string; value: string; icon: string }[] = [
  { label: 'Free', value: 'free', icon: '⊞' },
  { label: '16:9', value: '16:9', icon: '▭' },
  { label: '9:16', value: '9:16', icon: '▯' },
  { label: '1:1', value: '1:1', icon: '□' },
  { label: '4:3', value: '4:3', icon: '▢' },
  { label: '3:4', value: '3:4', icon: '▃' },
];

const ROTATION_PRESETS = [0, 90, 180, 270];

export default function CropPanel({ onClose }: CropPanelProps) {
  const { state, dispatch, selectedClip } = useProject();
  const [rotation, setRotation] = useState(selectedClip?.rotation ?? 0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const project = state.project;
  if (!project) return null;

  function setAspectRatio(ratio: string) {
    if (ratio === 'free') return;
    dispatch({
      type: 'UPDATE_PROJECT',
      updates: { aspectRatio: ratio as Project['aspectRatio'] },
    });
  }

  function applyRotation(deg: number) {
    setRotation(deg);
    if (selectedClip) {
      dispatch({
        type: 'UPDATE_CLIP',
        clipId: selectedClip.id,
        updates: { rotation: deg },
      });
    }
  }

  function rotateBy(delta: number) {
    const newRot = (rotation + delta + 360) % 360;
    applyRotation(newRot);
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Crop & Rotate</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Aspect Ratio */}
        <div>
          <label className="text-xs text-text-secondary mb-2 block">Project Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map(r => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={`py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                  project.aspectRatio === r.value
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <span className="text-lg">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="text-xs text-text-secondary mb-2 block">Rotation: {rotation}°</label>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => rotateBy(-90)}
              className="flex-1 py-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-hover transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="text-xs text-text-secondary">-90°</span>
            </button>
            <button
              onClick={() => rotateBy(90)}
              className="flex-1 py-2.5 rounded-xl bg-bg-tertiary hover:bg-bg-hover transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
              <span className="text-xs text-text-secondary">+90°</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ROTATION_PRESETS.map(deg => (
              <button
                key={deg}
                onClick={() => applyRotation(deg)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  rotation === deg
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Fine rotation slider */}
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">Fine Rotation: {rotation}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation}
            onChange={e => applyRotation(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Flip */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setFlipH(!flipH)}
            className={`py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              flipH ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
            }`}
          >
            ↔ Flip Horizontal
          </button>
          <button
            onClick={() => setFlipV(!flipV)}
            className={`py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              flipV ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
            }`}
          >
             Flip Vertical
          </button>
        </div>
      </div>
    </div>
  );
}
