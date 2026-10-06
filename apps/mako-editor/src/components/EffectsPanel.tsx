import React from 'react';
import { useProject } from '../store/ProjectContext';
import type { Effects } from '../types';
import { defaultEffects } from '../types';

interface EffectsPanelProps {
  mode: 'effects' | 'adjustments' | 'filters';
  onClose: () => void;
}

export default function EffectsPanel({ mode, onClose }: EffectsPanelProps) {
  const { state, dispatch, selectedClip } = useProject();

  if (!selectedClip) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-text-secondary">Select a clip to apply effects</p>
        <button onClick={onClose} className="mt-3 text-accent text-sm">Close</button>
      </div>
    );
  }

  const effects = selectedClip.effects;

  function updateEffect(key: keyof Effects, value: number) {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        effects: { ...effects, [key]: value },
      },
    });
  }

  function resetEffects() {
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: { effects: { ...defaultEffects } },
    });
  }

  // Preset filters
  const presets = [
    { name: 'None', effects: { ...defaultEffects } },
    { name: 'Vivid', effects: { ...defaultEffects, saturation: 40, contrast: 20, brightness: 10 } },
    { name: 'Warm', effects: { ...defaultEffects, temperature: 30, saturation: 15, brightness: 5 } },
    { name: 'Cool', effects: { ...defaultEffects, temperature: -30, saturation: -10 } },
    { name: 'B&W', effects: { ...defaultEffects, grayscale: 100, contrast: 20 } },
    { name: 'Sepia', effects: { ...defaultEffects, sepia: 80, contrast: 10 } },
    { name: 'Vintage', effects: { ...defaultEffects, sepia: 40, contrast: -10, saturation: -20, vignette: 40 } },
    { name: 'Drama', effects: { ...defaultEffects, contrast: 40, saturation: -20, vignette: 60, sharpness: 30 } },
    { name: 'Fade', effects: { ...defaultEffects, brightness: 15, contrast: -20, saturation: -30 } },
    { name: 'Sharp', effects: { ...defaultEffects, sharpness: 60, contrast: 15 } },
  ];

  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          {mode === 'effects' ? 'Video Effects' : mode === 'adjustments' ? 'Adjustments' : 'Filter Presets'}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={resetEffects} className="text-xs text-accent">Reset</button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === 'filters' ? (
          /* Filter Presets */
          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => dispatch({
                  type: 'UPDATE_CLIP',
                  clipId: selectedClip.id,
                  updates: { effects: preset.effects },
                })}
                className="p-3 rounded-xl bg-bg-tertiary hover:bg-bg-hover active:scale-95 transition-all text-center"
              >
                <div
                  className="w-full h-12 rounded-lg mb-2"
                  style={{
                    background: `linear-gradient(135deg,
                      hsl(${200 + preset.effects.temperature}, ${50 + preset.effects.saturation}%, ${50 + preset.effects.brightness}%),
                      hsl(${280 + preset.effects.sepia}, ${40 + preset.effects.contrast}%, ${40 + preset.effects.grayscale * 0.3}%))`,
                    filter: `blur(${preset.effects.blur}px) grayscale(${preset.effects.grayscale}%) sepia(${preset.effects.sepia}%)`,
                  }}
                />
                <span className="text-xs text-text-secondary">{preset.name}</span>
              </button>
            ))}
          </div>
        ) : mode === 'effects' ? (
          /* Video Effects */
          <div className="space-y-4">
            <EffectSlider label="Blur" value={effects.blur} min={0} max={20} onChange={v => updateEffect('blur', v)} />
            <EffectSlider label="Grayscale" value={effects.grayscale} min={0} max={100} onChange={v => updateEffect('grayscale', v)} unit="%" />
            <EffectSlider label="Sepia" value={effects.sepia} min={0} max={100} onChange={v => updateEffect('sepia', v)} unit="%" />
            <EffectSlider label="Vignette" value={effects.vignette} min={0} max={100} onChange={v => updateEffect('vignette', v)} unit="%" />
            <EffectSlider label="Sharpness" value={effects.sharpness} min={0} max={100} onChange={v => updateEffect('sharpness', v)} unit="%" />
          </div>
        ) : (
          /* Adjustments */
          <div className="space-y-4">
            <EffectSlider label="Brightness" value={effects.brightness} min={-100} max={100} onChange={v => updateEffect('brightness', v)} />
            <EffectSlider label="Contrast" value={effects.contrast} min={-100} max={100} onChange={v => updateEffect('contrast', v)} />
            <EffectSlider label="Saturation" value={effects.saturation} min={-100} max={100} onChange={v => updateEffect('saturation', v)} />
            <EffectSlider label="Exposure" value={effects.exposure} min={-100} max={100} onChange={v => updateEffect('exposure', v)} />
            <EffectSlider label="Temperature" value={effects.temperature} min={-100} max={100} onChange={v => updateEffect('temperature', v)} />
          </div>
        )}
      </div>
    </div>
  );
}

function EffectSlider({ label, value, min, max, onChange, unit = '' }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <label className="text-xs text-text-secondary">{label}</label>
        <span className="text-xs text-text-muted">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
