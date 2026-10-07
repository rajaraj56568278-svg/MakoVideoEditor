import React, { useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import type { BeautySettings } from '../../types';
import { defaultBeautySettings } from '../../types';

interface Props { onClose: () => void; }

export default function BeautyPanel({ onClose }: Props) {
  const { state, dispatch, selectedClip } = useProject();
  const beauty = selectedClip?.beauty ?? defaultBeautySettings;

  const update = useCallback((updates: Partial<BeautySettings>) => {
    if (!selectedClip) return;
    dispatch({ type: 'UPDATE_CLIP', clipId: selectedClip.id, updates: { beauty: { ...beauty, ...updates } } });
  }, [selectedClip, beauty, dispatch]);

  const handleReset = () => update({ ...defaultBeautySettings, enabled: beauty.enabled });

  if (!selectedClip || selectedClip.type !== 'video') {
    return (
      <div className="flex flex-col h-full bg-bg-primary">
        <PanelHeader onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-text-muted text-center">Select a video clip to apply beauty effects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <PanelHeader onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Beauty Mode</span>
            {beauty.enabled && <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-pink-500/20 text-pink-400">ACTIVE</span>}
          </div>
          <button onClick={() => update({ enabled: !beauty.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${beauty.enabled ? 'bg-pink-500' : 'bg-bg-hover'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${beauty.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {beauty.enabled && (
          <>
            <SliderControl label="Skin Smooth" value={beauty.skinSmooth} onChange={v => update({ skinSmooth: v })} color="pink" />
            <SliderControl label="Brightness" value={beauty.brightness} onChange={v => update({ brightness: v })} color="pink" />
            <SliderControl label="Contrast" value={beauty.contrast} onChange={v => update({ contrast: v })} color="pink" />
            <SliderControl label="Sharpness" value={beauty.sharpness} onChange={v => update({ sharpness: v })} color="pink" />
            <SliderControl label="Skin Tone" value={beauty.skinTone} onChange={v => update({ skinTone: v })} color="pink" hint="Cool ← → Warm" />
            <SliderControl label="Face Light" value={beauty.faceLight} onChange={v => update({ faceLight: v })} color="pink" />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleReset} className="flex-1 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                Reset
              </button>
              <button onClick={() => update({ enabled: false })} className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
                Disable
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <span className="text-sm">💄</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Beauty</h3>
          <p className="text-[10px] text-text-muted">Skin & face enhancement</p>
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
        <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function SliderControl({ label, value, onChange, color, hint }: {
  label: string; value: number; onChange: (v: number) => void; color: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className={`text-xs font-mono text-${color}-400`}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full accent-${color}-500`} />
      {hint && <p className="text-[9px] text-text-muted">{hint}</p>}
    </div>
  );
}
