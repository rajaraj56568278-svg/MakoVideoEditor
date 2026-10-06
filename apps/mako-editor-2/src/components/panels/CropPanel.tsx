import { useProjectStore } from '../../store/projectStore';

const ROTATION_OPTIONS = [0, 90, 180, 270];

export function CropPanel() {
  const { selectedClipId, getSelectedClip, updateClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId || clip.type !== 'video') {
    return <p className="text-xs text-text-muted text-center py-4">Select a video clip to crop/rotate</p>;
  }

  return (
    <div className="space-y-4">
      {/* Rotation */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Rotate</label>
        <div className="flex gap-2">
          {ROTATION_OPTIONS.map(deg => (
            <button
              key={deg}
              onClick={() => updateClip(selectedClipId, { rotation: deg })}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                clip.rotation === deg
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Crop presets */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Free', value: null },
            { label: '16:9', value: { x: 0, y: 0, width: 100, height: 100 } },
            { label: '9:16', value: { x: 25, y: 0, width: 50, height: 100 } },
            { label: '1:1', value: { x: 12.5, y: 0, width: 75, height: 100 } },
            { label: '4:3', value: { x: 0, y: 6.25, width: 100, height: 87.5 } },
            { label: '3:4', value: { x: 12.5, y: 0, width: 75, height: 100 } },
          ].map(preset => (
            <button
              key={preset.label}
              onClick={() => updateClip(selectedClipId, { crop: preset.value || undefined })}
              className={`py-2 rounded-lg text-xs transition-colors ${
                (!preset.value && !clip.crop) || (preset.value && clip.crop?.width === preset.value.width)
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flip */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            // Flip horizontal - we can simulate with CSS transform
            updateClip(selectedClipId, { rotation: clip.rotation });
          }}
          className="flex-1 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
        >
          ↔ Flip Horizontal
        </button>
        <button
          onClick={() => {
            updateClip(selectedClipId, { rotation: clip.rotation });
          }}
          className="flex-1 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
        >
          ↕ Flip Vertical
        </button>
      </div>

      <button
        onClick={() => updateClip(selectedClipId, { crop: undefined, rotation: 0 })}
        className="w-full py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
      >
        Reset Crop & Rotation
      </button>
    </div>
  );
}
