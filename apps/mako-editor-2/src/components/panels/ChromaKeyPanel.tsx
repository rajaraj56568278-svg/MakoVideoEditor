import { useProjectStore } from '../../store/projectStore';

const CHROMA_COLORS = [
  { label: 'Green', color: '#00ff00' },
  { label: 'Blue', color: '#0000ff' },
  { label: 'Red', color: '#ff0000' },
];

export function ChromaKeyPanel() {
  const { selectedClipId, getSelectedClip, updateClip } = useProjectStore();
  const clip = getSelectedClip();

  if (!clip || !selectedClipId || clip.type !== 'video') {
    return <p className="text-xs text-text-muted text-center py-4">Select a video clip for chroma key</p>;
  }

  return (
    <div className="space-y-4">
      {/* Enable */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary font-medium">Chroma Key</p>
          <p className="text-[10px] text-text-muted">Remove background color</p>
        </div>
        <button
          onClick={() => updateClip(selectedClipId, {
            chromaKey: { ...clip.chromaKey, enabled: !clip.chromaKey.enabled }
          })}
          className={`w-10 h-5 rounded-full transition-colors ${clip.chromaKey.enabled ? 'bg-accent' : 'bg-bg-elevated'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${clip.chromaKey.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {clip.chromaKey.enabled && (
        <>
          {/* Color selection */}
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Key Color</label>
            <div className="flex gap-2">
              {CHROMA_COLORS.map(({ label, color }) => (
                <button
                  key={color}
                  onClick={() => updateClip(selectedClipId, {
                    chromaKey: { ...clip.chromaKey, color }
                  })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border-2 ${
                    clip.chromaKey.color === color ? 'border-accent' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color + '33', color }}
                >
                  {label}
                </button>
              ))}
              <input
                type="color"
                value={clip.chromaKey.color}
                onChange={e => updateClip(selectedClipId, {
                  chromaKey: { ...clip.chromaKey, color: e.target.value }
                })}
                className="w-12 h-8 rounded cursor-pointer bg-transparent"
              />
            </div>
          </div>

          {/* Tolerance */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-20">Tolerance</label>
            <input
              type="range" min={0} max={100}
              value={clip.chromaKey.tolerance}
              onChange={e => updateClip(selectedClipId, {
                chromaKey: { ...clip.chromaKey, tolerance: Number(e.target.value) }
              })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">{clip.chromaKey.tolerance}</span>
          </div>

          {/* Smoothness */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-20">Smoothness</label>
            <input
              type="range" min={0} max={100}
              value={clip.chromaKey.smoothness}
              onChange={e => updateClip(selectedClipId, {
                chromaKey: { ...clip.chromaKey, smoothness: Number(e.target.value) }
              })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">{clip.chromaKey.smoothness}</span>
          </div>

          <p className="text-[10px] text-text-muted bg-bg-tertiary p-2 rounded-lg">
            💡 Chroma key is applied during export. Preview shows an approximation.
          </p>
        </>
      )}
    </div>
  );
}
