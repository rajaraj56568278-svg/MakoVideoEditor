import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { defaultTextConfig, FONT_FAMILIES, STICKER_EMOJIS } from '../types';
import type { TextConfig } from '../types';

interface TextEditorProps {
  mode: 'text' | 'stickers';
  onClose: () => void;
}

export default function TextEditor({ mode, onClose }: TextEditorProps) {
  const { state, addClip, selectedClip, dispatch } = useProject();
  const [text, setText] = useState('Your Text');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('transparent');
  const [shadow, setShadow] = useState(true);
  const [animation, setAnimation] = useState<TextConfig['animation']>('none');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  function handleAddText() {
    const textConfig: TextConfig = {
      text,
      fontFamily,
      fontSize,
      color,
      backgroundColor: bgColor,
      shadow,
      shadowColor: '#000000',
      animation,
      align: 'center',
      bold,
      italic,
    };

    addClip({
      type: 'text',
      trackIndex: 2, // Text track
      startTime: state.currentTime,
      duration: 5,
      textConfig,
    });
    onClose();
  }

  function handleAddSticker(emoji: string) {
    addClip({
      type: 'sticker',
      trackIndex: 1, // Overlay track
      startTime: state.currentTime,
      duration: 3,
      stickerUrl: emoji,
      position: { x: 50, y: 50 },
      scale: 1,
    });
    onClose();
  }

  function handleUpdateText() {
    if (!selectedClip || selectedClip.type !== 'text') return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        textConfig: {
          text,
          fontFamily,
          fontSize,
          color,
          backgroundColor: bgColor,
          shadow,
          shadowColor: '#000000',
          animation,
          align: 'center',
          bold,
          italic,
        },
      },
    });
  }

  const colors = ['#ffffff', '#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  const animations: TextConfig['animation'][] = ['none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'typewriter', 'bounce', 'zoom'];

  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          {mode === 'text' ? 'Add Text' : 'Add Sticker'}
        </h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-hover">
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mode === 'text' ? (
          <>
            {/* Text Input */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Text</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm resize-none focus:outline-none focus:border-accent"
                rows={2}
                placeholder="Enter text..."
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Font</label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_FAMILIES.map(font => (
                  <button
                    key={font}
                    onClick={() => setFontFamily(font)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      fontFamily === font ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Size: {fontSize}px</label>
              <input
                type="range"
                min={12}
                max={120}
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Style buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setBold(!bold)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${bold ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary'}`}
              >
                B
              </button>
              <button
                onClick={() => setItalic(!italic)}
                className={`px-3 py-1.5 rounded-lg text-sm italic transition-colors ${italic ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary'}`}
              >
                I
              </button>
              <button
                onClick={() => setShadow(!shadow)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${shadow ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary'}`}
              >
                Shadow
              </button>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Text Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Background</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setBgColor('transparent')}
                  className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center text-xs ${bgColor === 'transparent' ? 'border-accent' : 'border-transparent'}`}
                  style={{ background: 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)', backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}
                >
                  ✕
                </button>
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-accent scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Animation */}
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Animation</label>
              <div className="flex flex-wrap gap-1.5">
                {animations.map(a => (
                  <button
                    key={a}
                    onClick={() => setAnimation(a)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs capitalize transition-colors ${
                      animation === a ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-black/50 border border-border">
              <p
                style={{
                  fontFamily,
                  fontSize: `${fontSize * 0.6}px`,
                  color,
                  backgroundColor: bgColor !== 'transparent' ? bgColor : undefined,
                  fontWeight: bold ? 'bold' : 'normal',
                  fontStyle: italic ? 'italic' : 'normal',
                  textShadow: shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                  textAlign: 'center',
                }}
              >
                {text}
              </p>
            </div>

            {/* Add button */}
            <button
              onClick={selectedClip?.type === 'text' ? handleUpdateText : handleAddText}
              className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
            >
              {selectedClip?.type === 'text' ? 'Update Text' : 'Add Text'}
            </button>
          </>
        ) : (
          /* Stickers Grid */
          <div className="grid grid-cols-6 gap-2">
            {STICKER_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleAddSticker(emoji)}
                className="w-full aspect-square rounded-xl bg-bg-tertiary hover:bg-bg-hover active:scale-90 transition-all flex items-center justify-center text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
