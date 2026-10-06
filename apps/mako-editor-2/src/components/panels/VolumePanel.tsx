import { useProjectStore } from '../../store/projectStore';

export function VolumePanel() {
  const { selectedClipId, getSelectedClip, updateClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to adjust volume</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-secondary w-16">Volume</label>
        <input
          type="range" min={0} max={200}
          value={clip.volume}
          onChange={e => updateClip(selectedClipId, { volume: Number(e.target.value) })}
          className="flex-1"
        />
        <span className="text-[10px] text-text-muted w-10 text-right font-mono">{clip.volume}%</span>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {[
          { label: 'Mute', value: 0 },
          { label: '25%', value: 25 },
          { label: '50%', value: 50 },
          { label: '100%', value: 100 },
          { label: '150%', value: 150 },
          { label: '200%', value: 200 },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => updateClip(selectedClipId, { volume: preset.value })}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition-colors ${
              clip.volume === preset.value
                ? 'bg-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
