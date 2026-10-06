import { useProjectStore } from '../../store/projectStore';
import { formatTimePrecise } from '../../utils/timeFormat';

export function TrimPanel() {
  const { selectedClipId, getSelectedClip, updateClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId || clip.type !== 'video') {
    return <p className="text-xs text-text-muted text-center py-4">Select a video clip to trim</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-secondary w-16">Start</label>
        <input
          type="range"
          min={0}
          max={clip.originalDuration - 0.5}
          step={0.1}
          value={clip.trimStart}
          onChange={e => {
            const newStart = Number(e.target.value);
            const newDuration = (clip.trimEnd - newStart) * clip.speed;
            updateClip(selectedClipId, { trimStart: newStart, duration: newDuration });
          }}
          className="flex-1"
        />
        <span className="text-[10px] text-text-muted w-14 text-right font-mono">
          {formatTimePrecise(clip.trimStart)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-text-secondary w-16">End</label>
        <input
          type="range"
          min={clip.trimStart + 0.5}
          max={clip.originalDuration}
          step={0.1}
          value={clip.trimEnd}
          onChange={e => {
            const newEnd = Number(e.target.value);
            const newDuration = (newEnd - clip.trimStart) * clip.speed;
            updateClip(selectedClipId, { trimEnd: newEnd, duration: newDuration });
          }}
          className="flex-1"
        />
        <span className="text-[10px] text-text-muted w-14 text-right font-mono">
          {formatTimePrecise(clip.trimEnd)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">Duration: {formatTimePrecise(clip.duration)}</span>
        <span className="text-text-muted">Original: {formatTimePrecise(clip.originalDuration)}</span>
      </div>

      <button
        onClick={() => updateClip(selectedClipId, { trimStart: 0, trimEnd: clip.originalDuration, duration: clip.originalDuration * clip.speed })}
        className="w-full py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
      >
        Reset Trim
      </button>
    </div>
  );
}
