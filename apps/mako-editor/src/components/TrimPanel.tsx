import React from 'react';
import { useProject } from '../store/ProjectContext';
import { formatTimeShort } from '../utils/timeUtils';

interface TrimPanelProps {
  onClose: () => void;
}

export default function TrimPanel({ onClose }: TrimPanelProps) {
  const { selectedClip, dispatch } = useProject();

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a clip to trim</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  function setTrimStart(val: number) {
    const maxTrim = selectedClip.duration - 0.5;
    const newTrim = Math.max(0, Math.min(maxTrim, val));
    const delta = newTrim - selectedClip.trimStart;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        trimStart: newTrim,
        startTime: selectedClip.startTime + delta,
        duration: selectedClip.duration - delta,
      },
    });
  }

  function setTrimEnd(val: number) {
    const maxTrim = selectedClip.duration - 0.5;
    const newTrim = Math.max(0, Math.min(maxTrim, val));
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        trimEnd: newTrim,
        duration: selectedClip.duration + (selectedClip.trimEnd - newTrim),
      },
    });
  }

  const effectiveDuration = selectedClip.duration - selectedClip.trimStart - selectedClip.trimEnd;

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Trim Clip</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Clip info */}
        <div className="p-3 rounded-xl bg-bg-tertiary border border-border space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Type</span>
            <span className="text-text-secondary capitalize">{selectedClip.type}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Total Duration</span>
            <span className="text-text-secondary">{formatTimeShort(selectedClip.duration)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Trim Start</span>
            <span className="text-text-secondary">{formatTimeShort(selectedClip.trimStart)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Trim End</span>
            <span className="text-text-secondary">{formatTimeShort(selectedClip.trimEnd)}</span>
          </div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-text-muted">Effective</span>
            <span className="text-accent">{formatTimeShort(Math.max(0, effectiveDuration))}</span>
          </div>
        </div>

        {/* Trim Start */}
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">
            Trim Start: {formatTimeShort(selectedClip.trimStart)}
          </label>
          <input
            type="range"
            min="0"
            max={selectedClip.duration - 0.5}
            step="0.1"
            value={selectedClip.trimStart}
            onChange={e => setTrimStart(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Trim End */}
        <div className="space-y-1">
          <label className="text-xs text-text-secondary">
            Trim End: {formatTimeShort(selectedClip.trimEnd)}
          </label>
          <input
            type="range"
            min="0"
            max={selectedClip.duration - 0.5}
            step="0.1"
            value={selectedClip.trimEnd}
            onChange={e => setTrimEnd(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Reset */}
        <button
          onClick={() => dispatch({
            type: 'UPDATE_CLIP',
            clipId: selectedClip.id,
            updates: { trimStart: 0, trimEnd: 0 },
          })}
          className="w-full py-2.5 rounded-xl bg-bg-tertiary text-text-secondary text-sm hover:bg-bg-hover transition-colors"
        >
          Reset Trim
        </button>
      </div>
    </div>
  );
}
