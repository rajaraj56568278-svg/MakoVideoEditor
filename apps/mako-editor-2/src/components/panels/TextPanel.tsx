import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { FONTS, TEXT_ANIMATIONS } from '../../types';

const COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#f59e0b',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#14b8a6', '#6366f1', '#a855f7', '#e11d48',
];

export function TextPanel() {
  const { addTextOverlay, selectedClipId, getSelectedClip, updateTextOverlay } = useProjectStore();
  const selectedClip = getSelectedClip();
  const isEditingText = selectedClip?.type === 'text' && selectedClip.textOverlay;

  const [text, setText] = useState('Your Text');
  const [font, setFont] = useState('Inter');
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#000000');
  const [bgOpacity, setBgOpacity] = useState(0);
  const [shadow, setShadow] = useState(true);
  const [animation, setAnimation] = useState<string>('none');

  const handleAddText = () => {
    addTextOverlay({
      text,
      font,
      fontSize,
      color,
      backgroundColor: bgColor,
      backgroundOpacity: bgOpacity,
      shadow,
      animation: animation as any,
    });
  };

  const handleUpdate = (updates: Record<string, any>) => {
    if (selectedClipId && isEditingText) {
      updateTextOverlay(selectedClipId, updates);
    }
  };

  const currentText = isEditingText ? selectedClip!.textOverlay! : null;

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Text</label>
        <input
          type="text"
          value={isEditingText ? currentText!.text : text}
          onChange={e => isEditingText ? handleUpdate({ text: e.target.value }) : setText(e.target.value)}
          className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          placeholder="Enter text..."
        />
      </div>

      {/* Font */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Font</label>
        <select
          value={isEditingText ? currentText!.font : font}
          onChange={e => isEditingText ? handleUpdate({ font: e.target.value }) : setFont(e.target.value)}
          className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-3">
        <label className="text-[10px] text-text-muted uppercase tracking-wider w-16">Size</label>
        <input
          type="range"
          min={12}
          max={96}
          value={isEditingText ? currentText!.fontSize : fontSize}
          onChange={e => isEditingText ? handleUpdate({ fontSize: Number(e.target.value) }) : setFontSize(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-[10px] text-text-muted w-8 text-right font-mono">
          {isEditingText ? currentText!.fontSize : fontSize}
        </span>
      </div>

      {/* Text Color */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Color</label>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => isEditingText ? handleUpdate({ color: c }) : setColor(c)}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                (isEditingText ? currentText!.color : color) === c ? 'border-accent scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Background</label>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {COLORS.slice(0, 8).map(c => (
              <button
                key={c}
                onClick={() => {
                  if (isEditingText) {
                    handleUpdate({ backgroundColor: c, backgroundOpacity: 60 });
                  } else {
                    setBgColor(c);
                    setBgOpacity(60);
                  }
                }}
                className="w-6 h-6 rounded border border-border-primary"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={() => isEditingText ? handleUpdate({ backgroundOpacity: 0 }) : setBgOpacity(0)}
            className="px-2 py-1 text-[10px] bg-bg-tertiary rounded text-text-muted hover:text-text-secondary"
          >
            None
          </button>
        </div>
      </div>

      {/* Shadow */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">Shadow</label>
        <button
          onClick={() => isEditingText ? handleUpdate({ shadow: !currentText!.shadow }) : setShadow(!shadow)}
          className={`w-10 h-5 rounded-full transition-colors ${
            (isEditingText ? currentText!.shadow : shadow) ? 'bg-accent' : 'bg-bg-elevated'
          }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${
            (isEditingText ? currentText!.shadow : shadow) ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Animation */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Animation</label>
        <div className="flex flex-wrap gap-1.5">
          {TEXT_ANIMATIONS.map(a => (
            <button
              key={a.value}
              onClick={() => isEditingText ? handleUpdate({ animation: a.value }) : setAnimation(a.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                (isEditingText ? currentText!.animation : animation) === a.value
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add button (only when not editing) */}
      {!isEditingText && (
        <button
          onClick={handleAddText}
          className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium transition-colors"
        >
          Add Text
        </button>
      )}
    </div>
  );
}
