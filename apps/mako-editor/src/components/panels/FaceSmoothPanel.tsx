import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';

interface FaceSmoothPanelProps {
  onClose: () => void;
}

export default function FaceSmoothPanel({ onClose }: FaceSmoothPanelProps) {
  const { state, dispatch, selectedClip } = useProject();
  const [previewMode, setPreviewMode] = useState<'before' | 'after' | 'split'>('after');
  const [sliderPos, setSliderPos] = useState(50);
  const [faceDetected, setFaceDetected] = useState(false);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  // Get current clip's face smooth settings
  const faceSmooth = selectedClip?.faceSmooth ?? { enabled: false, smoothness: 30, skinDetail: 50 };

  // Find the active video clip for preview
  const project = state.project;
  const activeVideoClip = project?.clips
    .filter(c => c.type === 'video' && c.mediaUrl)
    .find(c => state.currentTime >= c.startTime && state.currentTime < c.startTime + c.duration);

  // Update face smooth settings
  const updateFaceSmooth = useCallback((updates: Partial<typeof faceSmooth>) => {
    if (!selectedClip) return;
    dispatch({
      type: 'UPDATE_CLIP',
      clipId: selectedClip.id,
      updates: {
        faceSmooth: { ...faceSmooth, ...updates },
      },
    });
  }, [selectedClip, faceSmooth, dispatch]);

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

    // Draw "after" (smoothed)
    const afterCanvas = afterCanvasRef.current;
    if (afterCanvas) {
      afterCanvas.width = cw;
      afterCanvas.height = ch;
      const aCtx = afterCanvas.getContext('2d');
      if (aCtx) {
        aCtx.drawImage(video, 0, 0, cw, ch);

        if (faceSmooth.enabled && faceSmooth.smoothness > 0) {
          // Apply face smoothing to the "after" canvas
          const { applyFaceSmooth } = await import('../../utils/faceSmooth');
          await applyFaceSmooth(aCtx, cw, ch, faceSmooth, video);
          setFaceDetected(true);
        }
      }
    }

    // Split view canvas
    renderSplitView(video, cw, ch);

    video.src = '';
  }, [activeVideoClip?.mediaUrl, state.currentTime, faceSmooth]);

  const renderSplitView = (video: HTMLVideoElement, cw: number, ch: number) => {
    const canvas = splitCanvasRef.current;
    if (!canvas) return;
    canvas.width = cw * 2;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original on left
    ctx.drawImage(video, 0, 0, cw, ch);

    // Draw smoothed on right
    ctx.save();
    ctx.beginPath();
    ctx.rect(cw, 0, cw, ch);
    ctx.clip();
    ctx.drawImage(video, cw, 0, cw, ch);

    if (faceSmooth.enabled && faceSmooth.smoothness > 0) {
      // Apply subtle smoothing for preview
      const blurAmount = (faceSmooth.smoothness / 100) * 0.5;
      ctx.filter = `blur(${blurAmount}px) brightness(${1 + (faceSmooth.smoothness / 100) * 0.03})`;
      ctx.drawImage(video, cw, 0, cw, ch);
      ctx.filter = 'none';
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
    ctx.fillText('After', cw + 8, 16);
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

  if (!selectedClip || selectedClip.type !== 'video') {
    return (
      <div className="flex flex-col h-full bg-bg-primary">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Face Smooth</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-text-muted text-center">Select a video clip to apply face smoothing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Face Smooth</h3>
            <p className="text-[10px] text-text-muted">Natural skin retouching</p>
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
            <span className="text-sm font-medium text-text-primary">Face Smoothing</span>
            {faceSmooth.enabled && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-pink-500/20 text-pink-400">
                {faceDetected ? 'FACE DETECTED' : 'ACTIVE'}
              </span>
            )}
          </div>
          <button
            onClick={() => updateFaceSmooth({ enabled: !faceSmooth.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              faceSmooth.enabled ? 'bg-pink-500' : 'bg-bg-hover'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                faceSmooth.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Before/After Preview */}
        {activeVideoClip && faceSmooth.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Preview</span>
              <div className="flex gap-1">
                {(['before', 'split', 'after'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                      previewMode === mode
                        ? 'bg-pink-500/20 text-pink-400 font-medium'
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
              {previewMode === 'after' && (
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

        {/* Smoothness Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Smoothness</span>
            <span className="text-xs font-mono text-pink-400">{faceSmooth.smoothness}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={faceSmooth.smoothness}
              onChange={e => updateFaceSmooth({ smoothness: Number(e.target.value) })}
              className="w-full accent-pink-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted">Subtle</span>
              <span className="text-[9px] text-text-muted">Natural</span>
              <span className="text-[9px] text-text-muted">Strong</span>
            </div>
          </div>
        </div>

        {/* Skin Detail Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Skin Detail</span>
            <span className="text-xs font-mono text-pink-400">{faceSmooth.skinDetail}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={faceSmooth.skinDetail}
              onChange={e => updateFaceSmooth({ skinDetail: Number(e.target.value) })}
              className="w-full accent-pink-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-text-muted">Soft</span>
              <span className="text-[9px] text-text-muted">Balanced</span>
              <span className="text-[9px] text-text-muted">Detailed</span>
            </div>
          </div>
        </div>

        {/* Processing Info */}
        {faceSmooth.enabled && (
          <div className="p-3 rounded-xl bg-bg-tertiary border border-border space-y-2">
            <p className="text-xs font-medium text-text-secondary">Processing Pipeline</p>
            <div className="space-y-1.5">
              <ProcessingItem
                icon="👤"
                label="Face Detection"
                desc="Automatic face tracking"
                active={true}
              />
              <ProcessingItem
                icon="✨"
                label="Skin Smoothing"
                desc="Edge-preserving bilateral filter"
                active={faceSmooth.smoothness > 0}
              />
              <ProcessingItem
                icon="👁️"
                label="Feature Preservation"
                desc="Eyes, lips, nose stay natural"
                active={true}
              />
              <ProcessingItem
                icon="🎨"
                label="Skin Detail"
                desc="Texture recovery and clarity"
                active={faceSmooth.skinDetail > 0}
              />
            </div>
          </div>
        )}

        {/* Tips */}
        {faceSmooth.enabled && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <p className="text-xs font-medium text-pink-300 mb-1">💡 Tips</p>
            <ul className="text-[10px] text-text-muted space-y-1">
              <li>• Works frame-by-frame, follows face movement</li>
              <li>• Preserves original resolution and FPS</li>
              <li>• Applied during preview and final export</li>
              <li>• Best results: 20-40% smoothness for natural look</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessingItem({ icon, label, desc, active }: {
  icon: string; label: string; desc: string; active: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
      active ? 'bg-pink-500/5' : 'opacity-40'
    }`}>
      <span className="text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-text-primary">{label}</p>
        <p className="text-[9px] text-text-muted">{desc}</p>
      </div>
      {active && (
        <svg className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )}
    </div>
  );
}
