import React from 'react';
import { useProject } from '../store/ProjectContext';

interface SpeedPanelProps {
  onClose: () => void;
}

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export default function SpeedPanel({ onClose }: SpeedPanelProps) {
  const { selectedClip, dispatch } = useProject();

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a clip to change speed</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  function setSpeed(speed: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { speed },
    });
  }

  function toggleReverse() {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { reversed: !selectedClip.reversed },
    });
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Speed</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Current speed display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-accent">{selectedClip.speed}x</div>
          {selectedClip.reversed && (
            <span className="text-xs text-warning mt-1 inline-block">⟲ Reversed</span>
          )}
        </div>

        {/* Speed slider */}
        <div className="space-y-2">
          <label className="text-xs text-text-secondary">Fine Control</label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.05"
            value={selectedClip.speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>0.25x</span>
            <span>1x</span>
            <span>2x</span>
            <span>4x</span>
          </div>
        </div>

        {/* Speed presets */}
        <div>
          <label className="text-xs text-text-secondary mb-2 block">Presets</label>
          <div className="grid grid-cols-5 gap-2">
            {SPEED_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedClip.speed === s
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Reverse toggle */}
        <button
          onClick={toggleReverse}
          className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
            selectedClip.reversed
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          <svg className={`w-5 h-5 ${selectedClip.reversed ? 'text-accent' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-sm font-medium">{selectedClip.reversed ? 'Reversed' : 'Reverse Video'}</span>
        </button>

        {/* Info */}
        <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border">
          <p className="text-[10px] text-text-muted leading-relaxed">
            💡 Speed changes affect playback only. Export will render at the selected speed.
            Reverse plays the clip backwards. Speeds below 1x create slow motion; above 1x create fast motion.
          </p>
        </div>
      </div>
    </div>
  );
}
