import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { X, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { FX_DEFINITIONS } from '../../types';
import type { FxType, FxInstance } from '../../types';

export function EffectsPanel() {
  const { selectedClipId, getSelectedClip, addFxInstance, removeFxInstance, updateFxInstance, clearAllFx } = useProjectStore();
  const clip = getSelectedClip();
  const [showFxGrid, setShowFxGrid] = useState(false);

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to apply FX effects</p>;
  }

  const activeFx = clip.fxInstances;

  const handleAddFx = (type: FxType) => {
    const def = FX_DEFINITIONS.find(d => d.type === type);
    if (!def) return;
    addFxInstance(selectedClipId, {
      type,
      intensity: def.defaultIntensity,
      duration: clip.duration,
      startTime: 0,
      enabled: true,
    });
    setShowFxGrid(false);
  };

  const handleResetFx = (fxId: string) => {
    const fx = activeFx.find(f => f.id === fxId);
    if (!fx) return;
    const def = FX_DEFINITIONS.find(d => d.type === fx.type);
    if (def) {
      updateFxInstance(selectedClipId, fxId, { intensity: def.defaultIntensity });
    }
  };

  return (
    <div className="space-y-3">
      {/* Active FX List */}
      {activeFx.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">
              Active Effects ({activeFx.length})
            </p>
            <button
              onClick={() => clearAllFx(selectedClipId)}
              className="flex items-center gap-1 text-[10px] text-danger hover:text-danger/80 transition-colors"
            >
              <Trash2 size={10} /> Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {activeFx.map((fx) => {
              const def = FX_DEFINITIONS.find(d => d.type === fx.type);
              if (!def) return null;
              return (
                <FxItem
                  key={fx.id}
                  fx={fx}
                  label={def.label}
                  icon={def.icon}
                  clipDuration={clip.duration}
                  onUpdate={(updates) => updateFxInstance(selectedClipId, fx.id, updates)}
                  onRemove={() => removeFxInstance(selectedClipId, fx.id)}
                  onReset={() => handleResetFx(fx.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add FX Button / Grid */}
      {!showFxGrid ? (
        <button
          onClick={() => setShowFxGrid(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent rounded-xl text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          Add FX Effect
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Choose Effect</p>
            <button
              onClick={() => setShowFxGrid(false)}
              className="text-[10px] text-text-muted hover:text-text-secondary"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {FX_DEFINITIONS.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => handleAddFx(type)}
                className="flex flex-col items-center gap-0.5 px-1.5 py-2 bg-bg-tertiary hover:bg-accent/20 hover:border-accent/30 border border-transparent rounded-lg text-[10px] text-text-muted hover:text-accent transition-all"
              >
                <span className="text-base">{icon}</span>
                <span className="leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick presets */}
      <div className="pt-2 border-t border-border-primary">
        <p className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">Quick Presets</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { name: '📼 VHS', fx: [{ type: 'vhs' as FxType, intensity: 60 }, { type: 'noise' as FxType, intensity: 25 }] },
            { name: '⚡ Glitch', fx: [{ type: 'glitch' as FxType, intensity: 50 }, { type: 'rgbSplit' as FxType, intensity: 30 }] },
            { name: '🎞️ Film', fx: [{ type: 'film' as FxType, intensity: 50 }, { type: 'vignette' as FxType, intensity: 40 }] },
            { name: '🌊 Dreamy', fx: [{ type: 'blur' as FxType, intensity: 20 }, { type: 'glow' as FxType, intensity: 40 }] },
            { name: '🔮 Warp', fx: [{ type: 'distortion' as FxType, intensity: 50 }, { type: 'chromaticAberration' as FxType, intensity: 40 }] },
            { name: '🪞 Mirror', fx: [{ type: 'mirror' as FxType, intensity: 100 }] },
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                clearAllFx(selectedClipId);
                preset.fx.forEach(f => {
                  const def = FX_DEFINITIONS.find(d => d.type === f.type);
                  addFxInstance(selectedClipId, {
                    type: f.type,
                    intensity: f.intensity,
                    duration: clip.duration,
                    startTime: 0,
                    enabled: true,
                  });
                });
              }}
              className="px-2.5 py-1.5 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-[11px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Individual FX Item ──────────────────────────────────────

interface FxItemProps {
  fx: FxInstance;
  label: string;
  icon: string;
  clipDuration: number;
  onUpdate: (updates: Partial<FxInstance>) => void;
  onRemove: () => void;
  onReset: () => void;
}

function FxItem({ fx, label, icon, clipDuration, onUpdate, onRemove, onReset }: FxItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`bg-bg-tertiary rounded-lg border ${fx.enabled ? 'border-accent/20' : 'border-border-primary'} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-text-primary font-medium flex-1">{label}</span>
        <button
          onClick={() => onUpdate({ enabled: !fx.enabled })}
          className={`w-8 h-4 rounded-full transition-colors relative ${fx.enabled ? 'bg-accent' : 'bg-bg-elevated'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${fx.enabled ? 'left-4.5' : 'left-0.5'}`}
            style={{ left: fx.enabled ? '18px' : '2px' }}
          />
        </button>
        <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-secondary">
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button onClick={onRemove} className="text-text-muted hover:text-danger transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* Controls */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          {/* Intensity */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-muted w-14">Intensity</label>
            <input
              type="range"
              min={0}
              max={100}
              value={fx.intensity}
              onChange={e => onUpdate({ intensity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">{fx.intensity}%</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-muted w-14">Duration</label>
            <input
              type="range"
              min={0.1}
              max={clipDuration}
              step={0.1}
              value={fx.duration}
              onChange={e => onUpdate({ duration: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">{fx.duration.toFixed(1)}s</span>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-accent transition-colors"
          >
            <RotateCcw size={9} /> Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
