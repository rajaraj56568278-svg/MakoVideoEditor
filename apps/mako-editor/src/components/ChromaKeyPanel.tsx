import React from 'react';
import { useProject } from '../store/ProjectContext';

interface ChromaKeyPanelProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Green', color: '#00ff00' },
  { name: 'Blue', color: '#0000ff' },
  { name: 'Red', color: '#ff0000' },
  { name: 'White', color: '#ffffff' },
  { name: 'Black', color: '#000000' },
  { name: 'Yellow', color: '#ffff00' },
];

export default function ChromaKeyPanel({ onClose }: ChromaKeyPanelProps) {
  const { selectedClip, dispatch } = useProject();

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a video clip for chroma key</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  const ck = selectedClip.chromaKey;

  function toggleEnabled() {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { chromaKey: { ...ck, enabled: !ck.enabled } },
    });
  }

  function setColor(color: string) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { chromaKey: { ...ck, color } },
    });
  }

  function setTolerance(tolerance: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { chromaKey: { ...ck, tolerance } },
    });
  }

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Chroma Key</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Toggle */}
        <button
          onClick={toggleEnabled}
          className={`w-full py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
            ck.enabled
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
          }`}
        >
          <div className={`w-10 h-6 rounded-full transition-colors relative ${ck.enabled ? 'bg-accent' : 'bg-bg-hover'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${ck.enabled ? 'left-5' : 'left-1'}`} />
          </div>
          <span className="text-sm font-medium">{ck.enabled ? 'Chroma Key On' : 'Chroma Key Off'}</span>
        </button>

        {ck.enabled && (
          <>
            {/* Key Color */}
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Key Color</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_COLORS.map(p => (
                  <button
                    key={p.color}
                    onClick={() => setColor(p.color)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                      ck.color === p.color
                        ? 'ring-2 ring-accent bg-bg-tertiary'
                        : 'bg-bg-tertiary hover:bg-bg-hover'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: p.color }} />
                    <span className="text-text-secondary">{p.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-text-muted">Custom:</label>
                <input
                  type="color"
                  value={ck.color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-8 rounded border-0 cursor-pointer"
                />
                <span className="text-xs text-text-muted font-mono">{ck.color}</span>
              </div>
            </div>

            {/* Tolerance */}
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">
                Tolerance: {ck.tolerance}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={ck.tolerance}
                onChange={e => setTolerance(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Precise</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-3 rounded-xl bg-bg-tertiary/50 border border-border">
              <p className="text-[10px] text-text-muted leading-relaxed">
                🎬 Chroma key removes the selected color from the video, making it transparent.
                Works best with evenly lit green/blue screens. Adjust tolerance to fine-tune the edge.
              </p>
            </div>

            {/* AI Background Removal */}
            <div className="p-4 rounded-xl border border-border bg-bg-tertiary/30 text-center">
              <p className="text-sm font-medium text-text-primary mb-1">AI Background Removal</p>
              <p className="text-xs text-text-muted mb-3">Automatically detect and remove background without a green screen</p>
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-bg-hover text-text-muted text-xs cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
