import { useProjectStore } from '../../store/projectStore';

export function AudioPanel() {
  const { project, selectedClipId, getSelectedClip, updateClip, addAudioTrack, updateAudioTrack, removeAudioTrack } = useProjectStore();
  const clip = getSelectedClip();

  return (
    <div className="space-y-4">
      {/* Clip volume */}
      {clip && clip.type === 'video' && (
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Clip Volume</label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={200}
              value={clip.volume}
              onChange={e => updateClip(clip.id, { volume: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-10 text-right font-mono">{clip.volume}%</span>
          </div>
        </div>
      )}

      {/* Audio tracks */}
      {project && project.audioTracks.length > 0 && (
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Audio Tracks</label>
          <div className="space-y-2">
            {project.audioTracks.map(audio => (
              <div key={audio.id} className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg">
                <span className="text-xs text-text-primary flex-1 truncate">{audio.name}</span>
                <input
                  type="range" min={0} max={200}
                  value={audio.volume}
                  onChange={e => updateAudioTrack(audio.id, { volume: Number(e.target.value) })}
                  className="w-20"
                />
                <span className="text-[10px] text-text-muted w-8 text-right">{audio.volume}%</span>
                <button
                  onClick={() => removeAudioTrack(audio.id)}
                  className="text-[10px] text-danger hover:text-danger/80 px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fade controls for selected audio */}
      {project?.audioTracks.map(audio => (
        <div key={audio.id} className="space-y-2 pt-2 border-t border-border-primary">
          <p className="text-[10px] text-text-muted uppercase">{audio.name}</p>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">Fade In</label>
            <input
              type="range" min={0} max={5} step={0.1}
              value={audio.fadeIn}
              onChange={e => updateAudioTrack(audio.id, { fadeIn: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right">{audio.fadeIn}s</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">Fade Out</label>
            <input
              type="range" min={0} max={5} step={0.1}
              value={audio.fadeOut}
              onChange={e => updateAudioTrack(audio.id, { fadeOut: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right">{audio.fadeOut}s</span>
          </div>
        </div>
      ))}

      {/* Import button */}
      <button
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'audio/*';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const duration = await new Promise<number>((resolve) => {
              const audio = document.createElement('audio');
              audio.preload = 'metadata';
              audio.onloadedmetadata = () => { resolve(audio.duration); URL.revokeObjectURL(audio.src); };
              audio.src = url;
            });
            addAudioTrack({ name: file.name, fileUrl: url, duration, volume: 100, fadeIn: 0, fadeOut: 0, startTime: 0 });
          };
          input.click();
        }}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
      >
        + Add Music
      </button>
    </div>
  );
}
