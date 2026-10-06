import { useProjectStore } from '../../store/projectStore';

const EFFECTS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 20, default: 0 },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, default: 0 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, default: 0 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100, default: 0 },
] as const;

export function EffectsPanel() {
  const { selectedClipId, updateClipEffects, getSelectedClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to apply effects</p>;
  }

  return (
    <div className="space-y-3">
      {EFFECTS.map(({ key, label, min, max, default: def }) => {
        const value = clip.effects[key as keyof typeof clip.effects] ?? def;
        return (
          <div key={key} className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-20 flex-shrink-0">{label}</label>
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={e => updateClipEffects(selectedClipId, { [key]: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">{value}</span>
            {value !== def && (
              <button
                onClick={() => updateClipEffects(selectedClipId, { [key]: def })}
                className="text-[10px] text-accent hover:text-accent-hover"
              >
                ↺
              </button>
            )}
          </div>
        );
      })}

      {/* Quick presets */}
      <div className="pt-2 border-t border-border-primary">
        <p className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">Presets</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Reset', effects: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, vignette: 0 } },
            { name: 'Vintage', effects: { brightness: 110, contrast: 90, saturation: 70, sepia: 40, vignette: 30, blur: 0, grayscale: 0 } },
            { name: 'B&W', effects: { brightness: 100, contrast: 120, saturation: 0, blur: 0, grayscale: 100, sepia: 0, vignette: 20 } },
            { name: 'Warm', effects: { brightness: 105, contrast: 105, saturation: 130, blur: 0, grayscale: 0, sepia: 15, vignette: 0 } },
            { name: 'Cool', effects: { brightness: 95, contrast: 110, saturation: 80, blur: 0, grayscale: 0, sepia: 0, vignette: 10 } },
            { name: 'Dreamy', effects: { brightness: 115, contrast: 90, saturation: 120, blur: 1, grayscale: 0, sepia: 0, vignette: 0 } },
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                Object.entries(preset.effects).forEach(([key, value]) => {
                  updateClipEffects(selectedClipId, { [key]: value });
                });
              }}
              className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-[11px] text-text-secondary hover:text-text-primary transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
