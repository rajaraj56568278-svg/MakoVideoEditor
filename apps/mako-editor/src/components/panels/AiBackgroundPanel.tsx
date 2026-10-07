import React, { useState, useCallback, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import type { BgRemovalSettings, BgRemovalMode } from '../../types';
import { defaultBgRemovalSettings } from '../../types';

interface Props { onClose: () => void; }

const BG_MODES: { value: BgRemovalMode; label: string; icon: string; desc: string }[] = [
  { value: 'transparent', label: 'Transparent', icon: '🔲', desc: 'Remove background' },
  { value: 'blur', label: 'Blur', icon: '💨', desc: 'Blur background' },
  { value: 'image', label: 'Custom Image', icon: '🖼️', desc: 'Replace with image' },
  { value: 'video', label: 'Custom Video', icon: '🎬', desc: 'Replace with video' },
  { value: 'original', label: 'Original', icon: '📷', desc: 'Keep background' },
];

export default function AiBackgroundPanel({ onClose }: Props) {
  const { state, dispatch, selectedClip } = useProject();
  const bgSettings = selectedClip?.bgRemovalSettings ?? defaultBgRemovalSettings;
  const [cancelling, setCancelling] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((updates: Partial<BgRemovalSettings>) => {
    if (!selectedClip) return;
    dispatch({ type: 'UPDATE_CLIP', clipId: selectedClip.id, updates: { bgRemovalSettings: { ...bgSettings, ...updates } } });
  }, [selectedClip, bgSettings, dispatch]);

  const handleEnable = () => {
    if (!selectedClip) return;
    update({ enabled: !bgSettings.enabled });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      update({ customImageUrl: url, mode: 'image', enabled: true });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      update({ customVideoUrl: url, mode: 'video', enabled: true });
    }
  };

  const handleCancel = () => {
    setCancelling(true);
    update({ processing: false, progress: 0 });
    setCancelling(false);
  };

  if (!selectedClip || selectedClip.type !== 'video') {
    return (
      <div className="flex flex-col h-full bg-bg-primary">
        <PanelHeader onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-text-muted text-center">Select a video clip to remove its background</p>
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
            <span className="text-sm font-medium text-text-primary">Background Removal</span>
            {bgSettings.enabled && <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400">ACTIVE</span>}
          </div>
          <button onClick={handleEnable}
            className={`relative w-11 h-6 rounded-full transition-colors ${bgSettings.enabled ? 'bg-emerald-500' : 'bg-bg-hover'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${bgSettings.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {bgSettings.enabled && (
          <>
            {/* Background Mode Selection */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-text-secondary">Background Mode</span>
              <div className="grid grid-cols-1 gap-2">
                {BG_MODES.map(mode => (
                  <button key={mode.value} onClick={() => update({ mode: mode.value })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      bgSettings.mode === mode.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-border bg-bg-tertiary hover:border-border-light'
                    }`}>
                    <span className="text-lg">{mode.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-primary">{mode.label}</p>
                      <p className="text-[10px] text-text-muted">{mode.desc}</p>
                    </div>
                    {bgSettings.mode === mode.value && (
                      <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Blur Amount (for blur mode) */}
            {bgSettings.mode === 'blur' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Blur Amount</span>
                  <span className="text-xs font-mono text-emerald-400">{bgSettings.blurAmount}%</span>
                </div>
                <input type="range" min="0" max="100" step="1" value={bgSettings.blurAmount}
                  onChange={e => update({ blurAmount: Number(e.target.value) })} className="w-full accent-emerald-500" />
              </div>
            )}

            {/* Custom Image Upload */}
            {bgSettings.mode === 'image' && (
              <div className="space-y-2">
                <button onClick={() => imageInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-border text-xs text-text-secondary hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                  {bgSettings.customImageUrl ? '✅ Image loaded — tap to change' : '📁 Choose background image'}
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            )}

            {/* Custom Video Upload */}
            {bgSettings.mode === 'video' && (
              <div className="space-y-2">
                <button onClick={() => videoInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-border text-xs text-text-secondary hover:border-emerald-500/50 hover:text-emerald-400 transition-colors">
                  {bgSettings.customVideoUrl ? '✅ Video loaded — tap to change' : '📁 Choose background video'}
                </button>
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
              </div>
            )}

            {/* Processing Progress */}
            {bgSettings.processing && (
              <div className="p-3 rounded-xl bg-bg-tertiary border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Processing...</span>
                  <span className="text-xs font-mono text-emerald-400">{bgSettings.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-bg-hover overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${bgSettings.progress}%` }} />
                </div>
                <button onClick={handleCancel} disabled={cancelling}
                  className="w-full py-1.5 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition-colors">
                  Cancel
                </button>
              </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-300 mb-1">💡 How it works</p>
              <ul className="text-[10px] text-text-muted space-y-1">
                <li>• Detects person using skin-tone & edge analysis</li>
                <li>• Separates foreground from background</li>
                <li>• Applied during preview and final export</li>
                <li>• Best results with clear subject separation</li>
              </ul>
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
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-sm">🧹</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">AI Background</h3>
          <p className="text-[10px] text-text-muted">Remove or replace background</p>
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
