import React, { useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import type { PortraitSettings } from '../../types';
import { defaultPortraitSettings } from '../../types';

interface Props { onClose: () => void; }

export default function PortraitPanel({ onClose }: Props) {
  const { state, dispatch, selectedClip } = useProject();
  const portrait = selectedClip?.portrait ?? defaultPortraitSettings;

  const update = useCallback((updates: Partial<PortraitSettings>) => {
    if (!selectedClip) return;
    dispatch({ type: 'UPDATE_CLIP', clipId: selectedClip.id, updates: { portrait: { ...portrait, ...updates } } });
  }, [selectedClip, portrait, dispatch]);

  const handleReset = () => update({ ...defaultPortraitSettings, enabled: portrait.enabled });

  if (!selectedClip || selectedClip.type !== 'video') {
    return (
      <div className="flex flex-col h-full bg-bg-primary">
        <PanelHeader onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-text-muted text-center">Select a video clip for portrait enhancement</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      <PanelHeader onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Portrait Mode</span>
            {portrait.enabled && <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-amber-500/20 text-amber-400">ACTIVE</span>}
          </div>
          <button onClick={() => update({ enabled: !portrait.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${portrait.enabled ? 'bg-amber-500' : 'bg-bg-hover'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${portrait.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {portrait.enabled && (
          <>
            <Slider label="Face Light" value={portrait.faceLight} onChange={v => update({ faceLight: v })} color="amber" />
            <Slider label="Smooth" value={portrait.smooth} onChange={v => update({ smooth: v })} color="amber" />
            <Slider label="Detail" value={portrait.detail} onChange={v => update({ detail: v })} color="amber" />
            <Slider label="Background Blur" value={portrait.bgBlur} onChange={v => update({ bgBlur: v })} color="amber" hint="Blurs background behind face" />
            <Slider label="Portrait Focus" value={portrait.focus} onChange={v => update({ focus: v })} color="amber" hint="Enhances subject separation" />

            <div className="flex gap-2 pt-2">
              <button onClick={handleReset} className="flex-1 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">Reset</button>
              <button onClick={() => update({ enabled: false })} className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">Disable</button>
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
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <span className="text-sm">📸</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Portrait</h3>
          <p className="text-[10px] text-text-muted">Face-aware portrait enhancement</p>
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

function Slider({ label, value, onChange, color, hint }: {
  label: string; value: number; onChange: (v: number) => void; color: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className={`text-xs font-mono text-${color}-400`}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" step="1" value={value}
        onChange={e => onChange(Number(e.target.value))} className={`w-full accent-${color}-500`} />
      {hint && <p className="text-[9px] text-text-muted">{hint}</p>}
    </div>
  );
}
