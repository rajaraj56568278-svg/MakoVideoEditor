import { useProjectStore } from '../../store/projectStore';

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

export function SpeedPanel() {
  const { selectedClipId, getSelectedClip, updateClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId || (clip.type !== 'video' && clip.type !== 'image')) {
    return <p className="text-xs text-text-muted text-center py-4">Select a video or image clip</p>;
  }

  return (
    <div className="space-y-4">
      {/* Speed presets */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Speed</label>
        <div className="flex flex-wrap gap-1.5">
          {SPEED_PRESETS.map(speed => (
            <button
              key={speed}
              onClick={() => {
                const durationRatio = clip.speed / speed;
                const newDuration = clip.duration * durationRatio;
                updateClip(selectedClipId, { speed, duration: newDuration });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                clip.speed === speed
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Custom speed */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-secondary w-16">Custom</label>
        <input
          type="range" min={0.25} max={4} step={0.05}
          value={clip.speed}
          onChange={e => {
            const newSpeed = Number(e.target.value);
            const durationRatio = clip.speed / newSpeed;
            updateClip(selectedClipId, { speed: newSpeed, duration: clip.duration * durationRatio });
          }}
          className="flex-1"
        />
        <span className="text-[10px] text-text-muted w-10 text-right font-mono">{clip.speed.toFixed(2)}x</span>
      </div>

      {/* Reverse */}
      <div className="flex items-center justify-between pt-2 border-t border-border-primary">
        <div>
          <p className="text-xs text-text-secondary">Reverse Video</p>
          <p className="text-[10px] text-text-muted">Play clip backwards</p>
        </div>
        <button
          onClick={() => updateClip(selectedClipId, { reverse: !clip.reverse })}
          className={`w-10 h-5 rounded-full transition-colors ${clip.reverse ? 'bg-accent' : 'bg-bg-elevated'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${clip.reverse ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {clip.reverse && (
        <p className="text-[10px] text-warning bg-warning/10 p-2 rounded-lg">
          ⚠️ Reverse playback will be applied during export
        </p>
      )}
    </div>
  );
}
