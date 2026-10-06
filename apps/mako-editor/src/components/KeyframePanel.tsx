import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import type { Keyframe } from '../types';

interface KeyframePanelProps {
  onClose: () => void;
}

export default function KeyframePanel({ onClose }: KeyframePanelProps) {
  const { state, dispatch, selectedClip } = useProject();
  const [newKeyframe, setNewKeyframe] = useState(false);

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a clip to add keyframes</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  const keyframes = selectedClip.keyframes || [];

  function addKeyframe() {
    const kf: Keyframe = {
      time: state.currentTime,
      x: selectedClip.position.x,
      y: selectedClip.position.y,
      scale: selectedClip.scale,
      rotation: selectedClip.rotation,
      opacity: selectedClip.opacity,
    };
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        keyframes: [...keyframes, kf].sort((a, b) => a.time - b.time),
      },
    });
    setNewKeyframe(false);
  }

  function removeKeyframe(index: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        keyframes: keyframes.filter((_, i) => i !== index),
      },
    });
  }

  function updatePosition(x: number, y: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { position: { x, y } },
    });
  }

  function updateScale(scale: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { scale },
    });
  }

  function updateRotation(rotation: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { rotation },
    });
  }

  function updateOpacity(opacity: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { opacity },
    });
  }

  function formatTime(t: number): string {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Keyframes</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Add keyframe button */}
        <button
          onClick={addKeyframe}
          className="w-full py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Keyframe at {formatTime(state.currentTime)}
        </button>

        {/* Current transform controls */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Current Values</h4>

          {/* Position */}
          <div className="space-y-2">
            <label className="text-xs text-text-secondary">Position</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-text-muted">X: {selectedClip.position.x.toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={selectedClip.position.x}
                  onChange={e => updatePosition(Number(e.target.value), selectedClip.position.y)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted">Y: {selectedClip.position.y.toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={selectedClip.position.y}
                  onChange={e => updatePosition(selectedClip.position.x, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Scale: {selectedClip.scale.toFixed(2)}x</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.05"
              value={selectedClip.scale}
              onChange={e => updateScale(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Rotation: {selectedClip.rotation}°</label>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={selectedClip.rotation}
              onChange={e => updateRotation(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Opacity: {Math.round(selectedClip.opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedClip.opacity}
              onChange={e => updateOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Keyframe list */}
        {keyframes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Keyframes ({keyframes.length})
            </h4>
            <div className="space-y-1.5">
              {keyframes.map((kf, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-tertiary border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-xs text-text-primary font-mono">{formatTime(kf.time)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>pos: ({kf.x.toFixed(0)}, {kf.y.toFixed(0)})</span>
                    <span>scale: {kf.scale.toFixed(1)}x</span>
                    <span>rot: {kf.rotation}°</span>
                  </div>
                  <button
                    onClick={() => removeKeyframe(i)}
                    className="p-1 rounded hover:bg-danger/10"
                  >
                    <svg className="w-3.5 h-3.5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border">
          <p className="text-[10px] text-text-muted leading-relaxed">
             Keyframes animate properties over time. Set a keyframe at the start, move the playhead,
            change values, and set another keyframe. The app interpolates between them.
          </p>
        </div>
      </div>
    </div>
  );
}
