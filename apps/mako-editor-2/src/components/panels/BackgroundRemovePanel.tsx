import { useState, useRef, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Eraser, RotateCcw, Loader2, Check, Image, Palette, Sparkles } from 'lucide-react';
import type { BgReplacementType } from '../../types';

const PRESET_COLORS = [
  '#00ff00', '#ff0000', '#0000ff', '#ffffff', '#000000',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7',
  '#a8e6cf', '#ffd93d', '#ff8a5c', '#ea8685', '#778beb',
];

const PRESET_GRADIENTS = [
  { from: '#6366f1', to: '#ec4899', angle: 135, label: 'Indigo-Pink' },
  { from: '#f97316', to: '#ef4444', angle: 135, label: 'Sunset' },
  { from: '#06b6d4', to: '#3b82f6', angle: 135, label: 'Ocean' },
  { from: '#22c55e', to: '#16a34a', angle: 135, label: 'Forest' },
  { from: '#f59e0b', to: '#ef4444', angle: 90, label: 'Warm' },
  { from: '#8b5cf6', to: '#06b6d4', angle: 135, label: 'Cyber' },
];

export function BackgroundRemovePanel() {
  const { selectedClipId, getSelectedClip, updateBackgroundRemoval, resetBackgroundRemoval } = useProjectStore();
  const clip = getSelectedClip();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'remove' | 'replace'>('remove');

  const handleRemoveBackground = useCallback(() => {
    if (!selectedClipId) return;

    // Simulate AI processing with progress
    updateBackgroundRemoval(selectedClipId, { processing: true, progress: 0 });

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateBackgroundRemoval(selectedClipId, {
          processing: false,
          progress: 100,
          enabled: true,
          autoDetected: true,
        });
      } else {
        updateBackgroundRemoval(selectedClipId, { progress: Math.min(progress, 99) });
      }
    }, 200);
  }, [selectedClipId, updateBackgroundRemoval]);

  const handleReset = useCallback(() => {
    if (!selectedClipId) return;
    resetBackgroundRemoval(selectedClipId);
  }, [selectedClipId, resetBackgroundRemoval]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClipId) return;
    const url = URL.createObjectURL(file);
    updateBackgroundRemoval(selectedClipId, {
      replacementType: 'image',
      replacementImageUrl: url,
    });
  }, [selectedClipId, updateBackgroundRemoval]);

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to remove background</p>;
  }

  const bg = clip.backgroundRemoval;
  const isVideoOrImage = clip.type === 'video' || clip.type === 'image';

  if (!isVideoOrImage) {
    return <p className="text-xs text-text-muted text-center py-4">Background removal works on video and image clips</p>;
  }

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-bg-tertiary rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'remove' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Eraser size={12} /> Remove
        </button>
        <button
          onClick={() => setActiveTab('replace')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'replace' ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Palette size={12} /> Replace
        </button>
      </div>

      {activeTab === 'remove' ? (
        <>
          {/* AI Remove Button */}
          {bg.processing ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="relative">
                <Loader2 size={32} className="text-accent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-accent">{Math.round(bg.progress)}%</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary">Removing background...</p>
              <div className="w-full bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-200"
                  style={{ width: `${bg.progress}%` }}
                />
              </div>
            </div>
          ) : bg.enabled ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Check size={20} className="text-success" />
              </div>
              <p className="text-xs text-success font-medium">Background Removed</p>
              <p className="text-[10px] text-text-muted">AI detected and removed the background</p>
            </div>
          ) : (
            <button
              onClick={handleRemoveBackground}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Sparkles size={16} />
              Remove Background with AI
            </button>
          )}

          {/* Tolerance Control */}
          {bg.enabled && (
            <div className="space-y-2 pt-2 border-t border-border-primary">
              <div className="flex items-center gap-3">
                <label className="text-xs text-text-secondary w-20 flex-shrink-0">Tolerance</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bg.tolerance}
                  onChange={e => updateBackgroundRemoval(selectedClipId, { tolerance: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-[10px] text-text-muted w-8 text-right font-mono">{bg.tolerance}%</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-text-secondary w-20 flex-shrink-0">Edge Smooth</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bg.edgeSmoothing}
                  onChange={e => updateBackgroundRemoval(selectedClipId, { edgeSmoothing: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-[10px] text-text-muted w-8 text-right font-mono">{bg.edgeSmoothing}%</span>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {(bg.enabled || bg.processing) && (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-bg-tertiary hover:bg-bg-elevated text-text-secondary rounded-lg text-xs transition-colors"
            >
              <RotateCcw size={12} />
              Reset Background Removal
            </button>
          )}
        </>
      ) : (
        <>
          {/* Background Replacement Options */}
          <div className="space-y-3">
            {/* Replacement Type Selector */}
            <div className="grid grid-cols-4 gap-1">
              {([
                { type: 'transparent' as BgReplacementType, icon: '🔲', label: 'None' },
                { type: 'color' as BgReplacementType, icon: '🎨', label: 'Color' },
                { type: 'gradient' as BgReplacementType, icon: '🌈', label: 'Gradient' },
                { type: 'image' as BgReplacementType, icon: '🖼️', label: 'Image' },
              ]).map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => updateBackgroundRemoval(selectedClipId, { replacementType: type })}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] transition-colors ${
                    bg.replacementType === type
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Color Picker */}
            {bg.replacementType === 'color' && (
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Choose Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => updateBackgroundRemoval(selectedClipId, { replacementColor: color })}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        bg.replacementColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-[10px] text-text-muted">Custom:</label>
                  <input
                    type="color"
                    value={bg.replacementColor}
                    onChange={e => updateBackgroundRemoval(selectedClipId, { replacementColor: e.target.value })}
                    className="w-8 h-6 rounded cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] text-text-muted font-mono">{bg.replacementColor}</span>
                </div>
              </div>
            )}

            {/* Gradient Picker */}
            {bg.replacementType === 'gradient' && (
              <div className="space-y-2">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Choose Gradient</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      onClick={() => updateBackgroundRemoval(selectedClipId, {
                        replacementGradient: { from: grad.from, to: grad.to, angle: grad.angle },
                      })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        bg.replacementGradient.from === grad.from && bg.replacementGradient.to === grad.to
                          ? 'border-white scale-105'
                          : 'border-transparent'
                      }`}
                      style={{ background: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})` }}
                    >
                      <span className="text-[8px] text-white/80 font-medium drop-shadow">{grad.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <label className="text-[10px] text-text-muted">From:</label>
                  <input
                    type="color"
                    value={bg.replacementGradient.from}
                    onChange={e => updateBackgroundRemoval(selectedClipId, {
                      replacementGradient: { ...bg.replacementGradient, from: e.target.value },
                    })}
                    className="w-6 h-5 rounded cursor-pointer bg-transparent"
                  />
                  <label className="text-[10px] text-text-muted">To:</label>
                  <input
                    type="color"
                    value={bg.replacementGradient.to}
                    onChange={e => updateBackgroundRemoval(selectedClipId, {
                      replacementGradient: { ...bg.replacementGradient, to: e.target.value },
                    })}
                    className="w-6 h-5 rounded cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Image Upload */}
            {bg.replacementType === 'image' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-bg-tertiary hover:bg-bg-elevated border border-dashed border-border-primary rounded-lg text-xs text-text-secondary transition-colors"
                >
                  <Image size={14} />
                  {bg.replacementImageUrl ? 'Change Background Image' : 'Upload Background Image'}
                </button>
                {bg.replacementImageUrl && (
                  <div className="relative w-full h-16 rounded-lg overflow-hidden">
                    <img src={bg.replacementImageUrl} alt="BG" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
