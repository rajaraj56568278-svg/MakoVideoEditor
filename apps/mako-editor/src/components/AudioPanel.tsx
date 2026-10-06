import React, { useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { loadMediaFile } from '../utils/mediaUtils';

interface AudioPanelProps {
  onClose: () => void;
}

export default function AudioPanel({ onClose }: AudioPanelProps) {
  const { state, addClip, dispatch, selectedClip } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = state.project;
  if (!project) return null;

  async function handleImportAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/')) continue;

      try {
        const media = await loadMediaFile(file);
        dispatch({
          type: 'UPDATE_PROJECT',
          updates: {
            mediaLibrary: [...project.mediaLibrary, media],
          },
        });

        const lastAudioEnd = project.clips
          .filter(c => c.trackIndex === 3)
          .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

        addClip({
          type: 'audio',
          trackIndex: 3,
          startTime: lastAudioEnd,
          duration: media.duration,
          mediaId: media.id,
          mediaUrl: media.url,
        });
      } catch (err) {
        console.error('Failed to import audio:', err);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  }

  // Audio clips in the project
  const audioClips = project.clips.filter(c => c.type === 'audio');

  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Audio</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Import audio */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors flex flex-col items-center gap-2"
        >
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <span className="text-sm text-text-secondary">Import Audio File</span>
          <span className="text-xs text-text-muted">MP3, WAV, AAC, OGG</span>
        </button>

        {/* Audio clips */}
        {audioClips.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Audio Tracks</h4>
            {audioClips.map(clip => (
              <div key={clip.id} className="p-3 rounded-xl bg-bg-tertiary border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate flex-1">
                    🎵 Audio Clip
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_CLIP', clipId: clip.id })}
                    className="p-1.5 rounded-lg hover:bg-danger/10"
                  >
                    <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Volume */}
                <div>
                  <label className="text-xs text-text-secondary">Volume: {Math.round(clip.volume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={clip.volume}
                    onChange={e => dispatch({
                      type: 'UPDATE_CLIP',
                      clipId: clip.id,
                      updates: { volume: Number(e.target.value) },
                    })}
                    className="w-full"
                  />
                </div>

                {/* Fade In/Out */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary">Fade In: {clip.fadeIn.toFixed(1)}s</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={clip.fadeIn}
                      onChange={e => dispatch({
                        type: 'UPDATE_CLIP',
                        clipId: clip.id,
                        updates: { fadeIn: Number(e.target.value) },
                      })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary">Fade Out: {clip.fadeOut.toFixed(1)}s</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={clip.fadeOut}
                      onChange={e => dispatch({
                        type: 'UPDATE_CLIP',
                        clipId: clip.id,
                        updates: { fadeOut: Number(e.target.value) },
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audio from library */}
        {project.mediaLibrary.filter(m => m.type === 'audio').length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Media Library</h4>
            {project.mediaLibrary.filter(m => m.type === 'audio').map(media => (
              <button
                key={media.id}
                onClick={() => {
                  const lastAudioEnd = project.clips
                    .filter(c => c.trackIndex === 3)
                    .reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
                  addClip({
                    type: 'audio',
                    trackIndex: 3,
                    startTime: lastAudioEnd,
                    duration: media.duration,
                    mediaId: media.id,
                    mediaUrl: media.url,
                  });
                }}
                className="w-full p-3 rounded-xl bg-bg-tertiary hover:bg-bg-hover transition-colors text-left flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="text-lg">🎵</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{media.name}</p>
                  <p className="text-xs text-text-muted">{Math.round(media.duration)}s</p>
                </div>
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleImportAudio}
      />
    </div>
  );
}
