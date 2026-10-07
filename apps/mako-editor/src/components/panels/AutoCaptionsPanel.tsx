import React, { useState, useCallback, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { isSpeechRecognitionAvailable, createCaptionGenerator } from '../../utils/captionGenerator';
import { CAPTION_LANGUAGES, FONT_FAMILIES } from '../../types';
import type { CaptionSegment, CaptionStyle } from '../../types';

interface Props { onClose: () => void; }

export default function AutoCaptionsPanel({ onClose }: Props) {
  const { state, dispatch } = useProject();
  const captions = state.captions;
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const generatorRef = useRef<ReturnType<typeof createCaptionGenerator> | null>(null);

  const available = isSpeechRecognitionAvailable();

  const handleStart = useCallback(() => {
    if (!available) { setError('Speech recognition not available. Use Chrome or Edge.'); return; }
    setError('');
    setIsListening(true);
    setStatus('Listening...');

    const gen = createCaptionGenerator({
      language: captions.language,
      onSegment: (seg) => {
        dispatch({ type: 'SET_CAPTIONS', settings: { segments: [...captions.segments, seg] } });
      },
      onEnd: () => { setIsListening(false); setStatus('Stopped'); },
      onError: (err) => { setError(err); setIsListening(false); },
      onProgress: (msg) => setStatus(msg),
    });
    generatorRef.current = gen;
    gen.start();
  }, [available, captions.language, captions.segments, dispatch]);

  const handleStop = useCallback(() => {
    generatorRef.current?.stop();
    setIsListening(false);
    setStatus('Stopped');
  }, []);

  const handleClear = () => {
    dispatch({ type: 'SET_CAPTIONS', settings: { segments: [] } });
  };

  const updateSegment = (id: string, text: string) => {
    dispatch({ type: 'SET_CAPTIONS', settings: {
      segments: captions.segments.map(s => s.id === id ? { ...s, text } : s),
    }});
  };

  const deleteSegment = (id: string) => {
    dispatch({ type: 'SET_CAPTIONS', settings: {
      segments: captions.segments.filter(s => s.id !== id),
    }});
  };

  const updateStyle = (updates: Partial<CaptionStyle>) => {
    dispatch({ type: 'SET_CAPTIONS', settings: { style: { ...captions.style, ...updates } } });
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-sm">📝</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Auto Captions</h3>
            <p className="text-[10px] text-text-muted">Speech-to-text captions</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Availability Warning */}
        {!available && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400 font-medium">⚠️ Speech Recognition Unavailable</p>
            <p className="text-[10px] text-text-muted mt-1">Your browser doesn't support the Web Speech API. Try Chrome or Edge for caption generation.</p>
          </div>
        )}

        {/* Language + Controls */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary">Language</label>
          <select value={captions.language} onChange={e => dispatch({ type: 'SET_CAPTIONS', settings: { language: e.target.value } })}
            className="w-full px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-xs text-text-primary">
            {CAPTION_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        {/* Record Controls */}
        <div className="flex gap-2">
          {!isListening ? (
            <button onClick={handleStart} disabled={!available}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white text-xs font-semibold hover:bg-cyan-600 disabled:opacity-40 transition-colors">
              🎤 Start Listening
            </button>
          ) : (
            <button onClick={handleStop}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
              ⏹ Stop
            </button>
          )}
          <button onClick={handleClear} className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">
            Clear
          </button>
        </div>

        {/* Status */}
        {(status || error) && (
          <div className={`p-2 rounded-lg text-xs ${error ? 'bg-red-500/10 text-red-400' : 'bg-bg-tertiary text-text-secondary'}`}>
            {error || status}
          </div>
        )}

        {/* Enable Captions Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border">
          <span className="text-sm font-medium text-text-primary">Show Captions</span>
          <button onClick={() => dispatch({ type: 'SET_CAPTIONS', settings: { enabled: !captions.enabled } })}
            className={`relative w-11 h-6 rounded-full transition-colors ${captions.enabled ? 'bg-cyan-500' : 'bg-bg-hover'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${captions.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Caption Segments */}
        {captions.segments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">{captions.segments.length} caption{captions.segments.length !== 1 ? 's' : ''}</p>
            {captions.segments.map(seg => (
              <div key={seg.id} className="flex items-start gap-2 p-2 rounded-lg bg-bg-tertiary border border-border">
                <div className="flex-1 min-w-0">
                  {editingId === seg.id ? (
                    <input autoFocus value={seg.text} onChange={e => updateSegment(seg.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingId(null)}
                      className="w-full px-2 py-1 rounded bg-bg-primary border border-border text-xs text-text-primary" />
                  ) : (
                    <p className="text-xs text-text-primary cursor-pointer hover:text-cyan-400" onClick={() => setEditingId(seg.id)}>
                      {seg.text}
                    </p>
                  )}
                  <p className="text-[9px] text-text-muted mt-0.5">{seg.startTime.toFixed(1)}s — {seg.endTime.toFixed(1)}s</p>
                </div>
                <button onClick={() => deleteSegment(seg.id)} className="p-1 rounded hover:bg-bg-hover text-text-muted">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caption Style */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-text-secondary">Caption Style</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted">Font</label>
              <select value={captions.style.fontFamily} onChange={e => updateStyle({ fontFamily: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs text-text-primary">
                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-muted">Size: {captions.style.fontSize}px</label>
              <input type="range" min="12" max="48" value={captions.style.fontSize}
                onChange={e => updateStyle({ fontSize: Number(e.target.value) })} className="w-full accent-cyan-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-text-muted">Text Color</label>
              <input type="color" value={captions.style.color} onChange={e => updateStyle({ color: e.target.value })}
                className="w-full h-8 rounded-lg bg-bg-tertiary border border-border cursor-pointer" />
            </div>
            <div>
              <label className="text-[10px] text-text-muted">Background</label>
              <input type="color" value={captions.style.backgroundColor} onChange={e => updateStyle({ backgroundColor: e.target.value })}
                className="w-full h-8 rounded-lg bg-bg-tertiary border border-border cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted">Position</label>
            <div className="flex gap-1 mt-1">
              {(['top', 'center', 'bottom'] as const).map(pos => (
                <button key={pos} onClick={() => updateStyle({ position: pos })}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${captions.style.position === pos ? 'bg-cyan-500/20 text-cyan-400' : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'}`}>
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted">Animation</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {(['none', 'fade', 'typewriter', 'bounce', 'highlight'] as const).map(anim => (
                <button key={anim} onClick={() => updateStyle({ animation: anim })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${captions.style.animation === anim ? 'bg-cyan-500/20 text-cyan-400' : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'}`}>
                  {anim.charAt(0).toUpperCase() + anim.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
