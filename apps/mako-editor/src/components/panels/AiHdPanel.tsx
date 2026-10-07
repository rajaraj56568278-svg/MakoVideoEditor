import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import type { AiHdQuality } from '../../types';

interface AiHdPanelProps {
  onClose: () => void;
}

const QUALITY_OPTIONS: { value: AiHdQuality; label: string; desc: string; badge?: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Match source resolution' },
  { value: '720p', label: 'HD 720p', desc: '1280 × 720', badge: 'Fast' },
  { value: '1080p', label: 'Full HD 1080p', desc: '1920 × 1080', badge: 'Recommended' },
  { value: '4K', label: '4K Ultra HD', desc: '3840 × 2160', badge: 'Best' },
];

export default function AiHdPanel({ onClose }: AiHdPanelProps) {
  const { state, dispatch } = useProject();
  const aiHd = state.aiHd;
  const project = state.project;

  // Before/After preview state
  const [previewMode, setPreviewMode] = useState<'enhanced' | 'before' | 'split'>('enhanced');
  const [sliderPos, setSliderPos] = useState(50);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Find the active video clip for preview
  const activeVideoClip = project?.clips
    .filter(c => c.type === 'video' && c.mediaUrl)
    .find(c => state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration);

  // Capture and render before/after frames
  const captureFrame = useCallback(async () => {
    if (!activeVideoClip?.mediaUrl) return;

    const video = document.createElement('video');
    video.src = activeVideoClip.mediaUrl;
    video.muted = true;
    video.preload = 'auto';

    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });

    const clipTime = state.currentTime - activeVideoClip.startTime + activeVideoClip.trimStart;
    video.currentTime = Math.min(clipTime, video.duration - 0.1);

    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 1000);
    });

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    const scale = Math.min(320 / vw, 180 / vh, 1);
    const cw = Math.round(vw * scale);
    const ch = Math.round(vh * scale);

    // Draw "before" (original)
    const beforeCanvas = beforeCanvasRef.current;
    if (beforeCanvas) {
      beforeCanvas.width = cw;
      beforeCanvas.height = ch;
      const bCtx = beforeCanvas.getContext('2d');
      if (bCtx) {
        bCtx.drawImage(video, 0, 0, cw, ch);
      }
    }

    // Draw "after" (enhanced)
    const afterCanvas = afterCanvasRef.current;
    if (afterCanvas) {
      afterCanvas.width = cw;
      afterCanvas.height = ch;
      const aCtx = afterCanvas.getContext('2d');
      if (aCtx) {
        aCtx.drawImage(video, 0, 0, cw, ch);

        if (aiHd.enabled && aiHd.strength > 0) {
          // Apply AI enhancement to the "after" canvas
          const t = aiHd.strength / 100;
          const imageData = aCtx.getImageData(0, 0, cw, ch);
          const data = imageData.data;

          // Auto levels
          if (t > 0.1) {
            const step = data.length > 200000 ? 16 : 4;
            let minL = 255, maxL = 0;
            for (let i = 0; i < data.length; i += step * 4) {
              const l = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              if (l < minL) minL = l;
              if (l > maxL) maxL = l;
            }
            const tMin = minL * t;
            const tMax = 255 - (255 - maxL) * t;
            const range = tMax - tMin;
            if (range > 10) {
              const s = 255 / range;
              for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, Math.min(255, (data[i] - tMin) * s)) | 0;
                data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - tMin) * s)) | 0;
                data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - tMin) * s)) | 0;
              }
            }
          }

          // Sharpening (unsharp mask)
          if (t > 0.15) {
            const amount = t * 0.6;
            const blurred = new Uint8ClampedArray(data.length);
            for (let y = 1; y < ch - 1; y++) {
              for (let x = 1; x < cw - 1; x++) {
                const idx = (y * cw + x) * 4;
                for (let c = 0; c < 3; c++) {
                  blurred[idx + c] = (
                    data[idx + c - cw * 4 - 4] + data[idx + c - cw * 4] + data[idx + c - cw * 4 + 4] +
                    data[idx + c - 4] + data[idx + c] + data[idx + c + 4] +
                    data[idx + c + cw * 4 - 4] + data[idx + c + cw * 4] + data[idx + c + cw * 4 + 4]
                  ) / 9;
                }
              }
            }
            for (let i = 0; i < data.length; i += 4) {
              for (let c = 0; c < 3; c++) {
                const diff = data[i + c] - blurred[i + c];
                if (Math.abs(diff) > 2) {
                  data[i + c] = Math.max(0, Math.min(255, data[i + c] + diff * amount)) | 0;
                }
              }
            }
          }

          // Saturation boost for detail
          const satBoost = 1 + t * 0.1;
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = Math.max(0, Math.min(255, gray + (data[i] - gray) * satBoost)) | 0;
            data[i + 1] = Math.max(0, Math.min(255, gray + (data[i + 1] - gray) * satBoost)) | 0;
            data[i + 2] = Math.max(0, Math.min(255, gray + (data[i + 2] - gray) * satBoost)) | 0;
          }

          aCtx.putImageData(imageData, 0, 0);
        }
      }
    }

    // Split view canvas
    renderSplitView(video, cw, ch);

    video.src = '';
  }, [activeVideoClip?.mediaUrl, state.currentTime, aiHd.enabled, aiHd.strength]);

  const renderSplitView = (video: HTMLVideoElement, cw: number, ch: number) => {
    const canvas = splitCanvasRef.current;
    if (!canvas) return;
    canvas.width = cw * 2;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original on left
    ctx.drawImage(video, 0, 0, cw, ch);

    // Draw enhanced on right
    ctx.save();
    ctx.beginPath();
    ctx.rect(cw, 0, cw, ch);
    ctx.clip();
    ctx.drawImage(video, cw, 0, cw, ch);

    if (aiHd.enabled && aiHd.strength > 0) {
      const t = aiHd.strength / 100;
      const imageData = ctx.getImageData(cw, 0, cw, ch);
      const data = imageData.data;

      // Apply enhancement
      const contrast = 1 + t * 0.18;
      const brightness = 1 + t * 0.06;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, data[i] * brightness * contrast)) | 0;
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * brightness * contrast)) | 0;
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * brightness * contrast)) | 0;
      }
      ctx.putImageData(imageData, cw, 0);
    }
    ctx.restore();

    // Divider line
    const divX = cw * (sliderPos / 100);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(divX, 0);
    ctx.lineTo(divX, ch);
    ctx.stroke();

    // Labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(4, 4, 50, 18);
    ctx.fillRect(cw + 4, 4, 60, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText('Before', 8, 16);
    ctx.fillText('After AI', cw + 8, 16);
  };

  useEffect(() => {
    captureFrame();
  }, [captureFrame]);

  // Slider drag for split view
  const handleSplitDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = splitCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(5, Math.min(95, x)));
  }, []);

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">AI HD Video Quality</h3>
            <p className="text-[10px] text-text-muted">Enhance sharpness, clarity & details</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">AI Enhancement</span>
            {aiHd.enabled && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-violet-500/20 text-violet-400">
                ACTIVE
              </span>
            )}
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_AI_HD', settings: { enabled: !aiHd.enabled } })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              aiHd.enabled ? 'bg-violet-500' : 'bg-bg-hover'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                aiHd.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Before/After Preview */}
        {activeVideoClip && aiHd.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Preview</span>
              <div className="flex gap-1">
                {(['before', 'split', 'enhanced'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                      previewMode === mode
                        ? 'bg-violet-500/20 text-violet-400 font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {mode === 'before' ? 'Before' : mode === 'split' ? 'Split' : 'After'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black border border-border">
              {previewMode === 'before' && (
                <canvas ref={beforeCanvasRef} className="w-full h-auto" style={{ imageRendering: 'auto' }} />
              )}
              {previewMode === 'enhanced' && (
                <canvas ref={afterCanvasRef} className="w-full h-auto" style={{ imageRendering: 'auto' }} />
              )}
              {previewMode === 'split' && (
                <div className="relative">
                  <canvas
                    ref={splitCanvasRef}
                    className="w-full h-auto"
                    style={{ imageRendering: 'auto' }}
                    onMouseMove={e => { if (isDragging.current) handleSplitDrag(e); }}
                    onMouseDown={() => { isDragging.current = true; }}
                    onMouseUp={() => { isDragging.current = false; }}
                    onMouseLeave={() => { isDragging.current = false; }}
                    onTouchMove={handleSplitDrag}
                    onTouchStart={() => { isDragging.current = true; }}
                    onTouchEnd={() => { isDragging.current = false; }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality Selector */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-text-secondary">Export Quality</span>
          <div className="grid grid-cols-2 gap-2">
            {QUALITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => dispatch({ type: 'SET_AI_HD', settings: { quality: opt.value } })}
                className={`relative p-2.5 rounded-xl border text-left transition-all ${
                  aiHd.quality === opt.value
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-border bg-bg-tertiary hover:border-border-light'
                }`}
              >
                <p className="text-xs font-medium text-text-primary">{opt.label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{opt.desc}</p>
                {opt.badge && (
                  <span className={`absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded font-medium ${
                    aiHd.quality === opt.value
                      ? 'bg-violet-500/30 text-violet-300'
                      : 'bg-bg-hover text-text-muted'
                  }`}>
                    {opt.badge}
                  </span>
                )}
                {aiHd.quality === opt.value && (
                  <svg className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Strength Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Enhance Strength</span>
            <span className="text-xs font-mono text-violet-400">{aiHd.strength}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={aiHd.strength}
              onChange={e => dispatch({ type: 'SET_AI_HD', settings: { strength: Number(e.target.value) } })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted">Subtle</span>
              <span className="text-[9px] text-text-muted">Balanced</span>
              <span className="text-[9px] text-text-muted">Maximum</span>
            </div>
          </div>
        </div>

        {/* Enhancement Details */}
        {aiHd.enabled && (
          <div className="p-3 rounded-xl bg-bg-tertiary border border-border space-y-2">
            <p className="text-xs font-medium text-text-secondary">Enhancement Pipeline</p>
            <div className="space-y-1.5">
              <EnhancementItem
                icon="🔍"
                label="Adaptive Sharpening"
                desc="Unsharp mask for crisp edges"
                active={aiHd.strength > 15}
              />
              <EnhancementItem
                icon="✨"
                label="Detail Enhancement"
                desc="Boost fine textures & patterns"
                active={aiHd.strength > 25}
              />
              <EnhancementItem
                icon="🎚️"
                label="Auto Brightness & Contrast"
                desc="Histogram-based auto-levels"
                active={aiHd.strength > 10}
              />
              <EnhancementItem
                icon="🔇"
                label="Noise Reduction"
                desc="Reduce compression artifacts"
                active={aiHd.strength > 20}
              />
              <EnhancementItem
                icon="🎨"
                label="Color Vitality"
                desc="Natural saturation recovery"
                active={aiHd.strength > 0}
              />
            </div>
          </div>
        )}

        {/* Export Info */}
        {aiHd.enabled && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 space-y-1.5">
            <p className="text-xs font-medium text-violet-300">Export Settings</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <InfoRow label="Format" value="MP4 (H.264)" />
              <InfoRow label="Quality" value={QUALITY_OPTIONS.find(q => q.value === aiHd.quality)?.label || 'Auto'} />
              <InfoRow label="FPS" value="Original (preserved)" />
              <InfoRow label="Aspect Ratio" value={project?.aspectRatio || '16:9'} />
              <InfoRow label="Audio" value="Sync preserved" />
              <InfoRow label="Encoding" value="High quality" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EnhancementItem({ icon, label, desc, active }: {
  icon: string; label: string; desc: string; active: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
      active ? 'bg-violet-500/5' : 'opacity-40'
    }`}>
      <span className="text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-text-primary">{label}</p>
        <p className="text-[9px] text-text-muted">{desc}</p>
      </div>
      {active && (
        <svg className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[10px] text-text-muted">{label}</span>
      <span className="text-[10px] text-text-secondary font-medium">{value}</span>
    </div>
  );
}
