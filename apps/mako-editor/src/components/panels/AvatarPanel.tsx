import React, { useState, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import { AVATAR_STYLES } from '../../types';
import type { AvatarStyle, AvatarConfig } from '../../types';

interface Props { onClose: () => void; }

export default function AvatarPanel({ onClose }: Props) {
  const { state, dispatch } = useProject();
  const avatars = state.avatars;
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('cartoon-boy');
  const [text, setText] = useState('');
  const [scale, setScale] = useState(1);
  const [duration, setDuration] = useState(5);

  const handleAdd = useCallback(() => {
    const avatar: AvatarConfig = {
      id: crypto.randomUUID(),
      style: selectedStyle,
      text,
      position: { x: 50, y: 50 },
      scale,
      rotation: 0,
      startTime: state.currentTime,
      duration,
    };
    dispatch({ type: 'ADD_AVATAR', avatar });
    setText('');
  }, [selectedStyle, text, scale, duration, state.currentTime, dispatch]);

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_AVATAR', avatarId: id });
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-sm">🎭</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Avatar</h3>
            <p className="text-[10px] text-text-muted">Built-in character overlays</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Info */}
        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-[10px] text-purple-300">ℹ️ Built-in avatar overlays — not AI-generated. Add characters to your video as overlay layers.</p>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-secondary">Choose Avatar</span>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_STYLES.map(s => (
              <button key={s.value} onClick={() => setSelectedStyle(s.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  selectedStyle === s.value
                    ? 'bg-purple-500/20 border border-purple-500/40'
                    : 'bg-bg-tertiary border border-border hover:border-border-light'
                }`}>
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[8px] text-text-muted">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Speech Bubble Text</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            placeholder="Type something..." maxLength={50}
            className="w-full px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-xs text-text-primary placeholder:text-text-muted" />
        </div>

        {/* Scale */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Size</span>
            <span className="text-xs font-mono text-purple-400">{scale.toFixed(1)}x</span>
          </div>
          <input type="range" min="0.5" max="3" step="0.1" value={scale}
            onChange={e => setScale(Number(e.target.value))} className="w-full accent-purple-500" />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Duration</span>
            <span className="text-xs font-mono text-purple-400">{duration}s</span>
          </div>
          <input type="range" min="1" max="30" step="1" value={duration}
            onChange={e => setDuration(Number(e.target.value))} className="w-full accent-purple-500" />
        </div>

        {/* Add Button */}
        <button onClick={handleAdd}
          className="w-full py-2.5 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 active:scale-95 transition-all">
          + Add Avatar at {state.currentTime.toFixed(1)}s
        </button>

        {/* Active Avatars */}
        {avatars.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">Active Avatars ({avatars.length})</p>
            {avatars.map(av => (
              <div key={av.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary border border-border">
                <span className="text-lg">{AVATAR_STYLES.find(s => s.value === av.style)?.emoji || '🎭'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">{av.text || AVATAR_STYLES.find(s => s.value === av.style)?.label}</p>
                  <p className="text-[9px] text-text-muted">{av.startTime.toFixed(1)}s — {(av.startTime + av.duration).toFixed(1)}s • {av.scale.toFixed(1)}x</p>
                </div>
                <button onClick={() => handleRemove(av.id)} className="p-1 rounded hover:bg-bg-hover text-text-muted">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
