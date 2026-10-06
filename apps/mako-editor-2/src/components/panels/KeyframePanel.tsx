import { useProjectStore } from '../../store/projectStore';
import { formatTimePrecise } from '../../utils/timeFormat';
import { Plus, Trash2 } from 'lucide-react';

export function KeyframePanel() {
  const { selectedClipId, getSelectedClip, currentTime, addKeyframe, removeKeyframe } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId) {
    return <p className="text-xs text-text-muted text-center py-4">Select a clip to add keyframes</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {clip.keyframes.length} keyframe{clip.keyframes.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => addKeyframe(selectedClipId, {
            time: currentTime,
            scale: 1,
            rotation: 0,
            opacity: 100,
          })}
          className="flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded text-[11px] hover:bg-accent/30 transition-colors"
        >
          <Plus size={12} />
          Add Here
        </button>
      </div>

      {/* Keyframe list */}
      {clip.keyframes.length > 0 ? (
        <div className="space-y-2">
          {clip.keyframes.map(kf => (
            <div key={kf.id} className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg">
              <span className="text-[10px] text-accent font-mono w-12">
                {formatTimePrecise(kf.time)}
              </span>
              <div className="flex-1 flex items-center gap-3 text-[10px] text-text-muted">
                {kf.scale !== undefined && <span>Scale: {kf.scale}</span>}
                {kf.rotation !== undefined && <span>Rot: {kf.rotation}°</span>}
                {kf.opacity !== undefined && <span>Op: {kf.opacity}%</span>}
              </div>
              <button
                onClick={() => removeKeyframe(selectedClipId, kf.id)}
                className="p-1 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center py-4">
          No keyframes yet. Move the playhead and tap "Add Here" to create one.
        </p>
      )}

      <p className="text-[10px] text-text-muted bg-bg-tertiary p-2 rounded-lg">
        💡 Keyframes animate position, scale, rotation and opacity over time. Applied during export.
      </p>
    </div>
  );
}
