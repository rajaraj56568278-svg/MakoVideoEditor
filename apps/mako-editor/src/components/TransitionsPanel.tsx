import React from 'react';
import { useProject } from '../store/ProjectContext';
import type { Transition } from '../types';

interface TransitionsPanelProps {
  onClose: () => void;
}

const TRANSITIONS: { type: Transition['type']; label: string; icon: string }[] = [
  { type: 'none', label: 'None', icon: '⊘' },
  { type: 'fade', label: 'Fade', icon: '◐' },
  { type: 'dissolve', label: 'Dissolve', icon: '✦' },
  { type: 'slide-left', label: 'Slide Left', icon: '◀' },
  { type: 'slide-right', label: 'Slide Right', icon: '▶' },
  { type: 'slide-up', label: 'Slide Up', icon: '▲' },
  { type: 'wipe', label: 'Wipe', icon: '▸' },
  { type: 'zoom', label: 'Zoom', icon: '⊕' },
];

export default function TransitionsPanel({ onClose }: TransitionsPanelProps) {
  const { selectedClip, dispatch } = useProject();

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a clip to add transitions</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  function setTransition(type: Transition['type']) {
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

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Transitions</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Transition grid */}
        <div className="grid grid-cols-4 gap-2">
          {TRANSITIONS.map(t => (
            <button
              key={t.type}
              onClick={() => setTransition(t.type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                selectedClip.transition.type === t.type
                  ? 'bg-accent text-white ring-2 ring-accent-hover'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-[10px]">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Duration */}
        {selectedClip.transition.type !== 'none' && (
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">
              Duration: {selectedClip.transition.duration.toFixed(1)}s
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={selectedClip.transition.duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
