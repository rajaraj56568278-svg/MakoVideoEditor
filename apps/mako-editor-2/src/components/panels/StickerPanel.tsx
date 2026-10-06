import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { STICKERS } from '../../types';

export function StickerPanel() {
  const { addSticker, selectedClipId, getSelectedClip, updateSticker } = useProjectStore();
  const selectedClip = getSelectedClip();
  const isEditing = selectedClip?.type === 'sticker' && selectedClip.sticker;

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);

  const handleSelectSticker = (emoji: string) => {
    addSticker({ emoji, scale, rotation, opacity });
  };

  const handleUpdate = (updates: Record<string, any>) => {
    if (selectedClipId && isEditing) {
      updateSticker(selectedClipId, updates);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticker grid */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Tap to add</label>
        <div className="grid grid-cols-8 gap-1.5">
          {STICKERS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleSelectSticker(emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Controls for selected sticker */}
      {isEditing && selectedClip?.sticker && (
        <div className="space-y-3 pt-3 border-t border-border-primary">
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">Scale</label>
            <input
              type="range" min={0.3} max={3} step={0.1}
              value={selectedClip.sticker.scale}
              onChange={e => handleUpdate({ scale: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">
              {selectedClip.sticker.scale.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">Rotate</label>
            <input
              type="range" min={-180} max={180}
              value={selectedClip.sticker.rotation}
              onChange={e => handleUpdate({ rotation: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">
              {selectedClip.sticker.rotation}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-16">Opacity</label>
            <input
              type="range" min={0} max={100}
              value={selectedClip.sticker.opacity}
              onChange={e => handleUpdate({ opacity: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-[10px] text-text-muted w-8 text-right font-mono">
              {selectedClip.sticker.opacity}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
