import { useProjectStore } from '../../store/projectStore';

const ADJUSTMENTS = [
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, default: 0, unit: '' },
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, default: 0, unit: '%' },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, default: 0, unit: 'K' },
] as const;

export function AdjustPanel() {
  const { selectedClipId, updateClipEffects, getSelectedClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to adjust</p>;
  }

  return (
    <div className="space-y-3">
      {ADJUSTMENTS.map(({ key, label, min, max, default: def, unit }) => {
        const value = clip.effects[key as keyof typeof clip.effects] ?? def;
        return (
          <div key={key} className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-24 flex-shrink-0">{label}</label>
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={e => updateClipEffects(selectedClipId, { [key]: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-12 text-right font-mono">
              {value}{unit}
            </span>
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

      <button
        onClick={() => {
          ADJUSTMENTS.forEach(({ key, default: def }) => {
            updateClipEffects(selectedClipId, { [key]: def });
          });
        }}
        className="w-full py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors mt-2"
      >
        Reset All Adjustments
      </button>
    </div>
  );
}
