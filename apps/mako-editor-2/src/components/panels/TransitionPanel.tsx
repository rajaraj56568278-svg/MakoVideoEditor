import { useProjectStore } from '../../store/projectStore';
import { TRANSITION_TYPES } from '../../types';

export function TransitionPanel() {
  const { project, selectedClipId, getSelectedClip, addTransition, removeTransition } = useProjectStore();
  const clip = getSelectedClip();

  const existingTransition = project?.transitions.find(t => t.afterClipId === selectedClipId);

  if (!clip || !selectedClipId || clip.type !== 'video') {
    return <p className="text-xs text-text-muted text-center py-4">Select a video clip to add transitions</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Transition Type</label>
        <div className="grid grid-cols-4 gap-1.5">
          {TRANSITION_TYPES.filter(t => t.value !== 'none').map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                if (existingTransition) {
                  removeTransition(existingTransition.id);
                }
                addTransition({ type: value, duration: 0.5, afterClipId: selectedClipId });
              }}
              className={`px-2 py-2 rounded-lg text-[11px] transition-colors ${
                existingTransition?.type === value
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      {existingTransition && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-secondary w-20">Duration</label>
          <input
            type="range" min={0.1} max={2} step={0.1}
            value={existingTransition.duration}
            onChange={e => {
              removeTransition(existingTransition.id);
              addTransition({ type: existingTransition.type, duration: Number(e.target.value), afterClipId: selectedClipId });
            }}
            className="flex-1"
          />
          <span className="text-[10px] text-text-muted w-8 text-right font-mono">{existingTransition.duration}s</span>
        </div>
      )}

      {/* Remove */}
      {existingTransition && (
        <button
          onClick={() => removeTransition(existingTransition.id)}
          className="w-full py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg text-xs transition-colors"
        >
          Remove Transition
        </button>
      )}
    </div>
  );
}
