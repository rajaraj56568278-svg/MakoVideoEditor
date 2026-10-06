import { useState, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { buildFilterString } from '../utils/filterUtils';
import { EXPORT_PRESETS } from '../types';
import { X, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ExportSettings } from '../types';

export function ExportDialog() {
  const { project, showExportDialog } = useProjectStore();
  const [settings, setSettings] = useState<ExportSettings>({
    resolution: '1080p',
    fps: 30,
    quality: 'high',
    format: 'mp4',
  });
  const [status, setStatus] = useState<'idle' | 'preparing' | 'exporting' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const abortRef = useRef(false);

  const handleExport = useCallback(async () => {
    if (!project) return;

    const videoClips = project.tracks
      .find(t => t.type === 'video')?.clips
      .filter(c => c.type === 'video' && c.fileUrl) || [];

    if (videoClips.length === 0) {
      setStatus('error');
      setErrorMsg('No video clips to export. Import a video first.');
      return;
    }

    setStatus('preparing');
    setProgress(0);
    abortRef.current = false;

    try {
      const preset = EXPORT_PRESETS[settings.resolution];
      const canvas = document.createElement('canvas');
      canvas.width = preset.width;
      canvas.height = preset.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas context');

      // Set up MediaRecorder
      const stream = canvas.captureStream(settings.fps);

      // Add audio if available
      const audioClips = videoClips.filter(c => c.volume > 0);
      const audioCtx = new AudioContext();
      const destination = audioCtx.createMediaStreamDestination();

      // Load all video elements
      const videoElements: HTMLVideoElement[] = [];
      for (const clip of videoClips) {
        const video = document.createElement('video');
        video.src = clip.fileUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error(`Failed to load: ${clip.fileName}`));
          setTimeout(() => reject(new Error('Video load timeout')), 30000);
        });
        videoElements.push(video);
      }

      // Determine supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let mimeType = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          mimeType = mt;
          break;
        }
      }
      if (!mimeType) throw new Error('No supported video format found for export');

      const qualityMap = { low: 1000000, medium: 4000000, high: 8000000 };
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: qualityMap[settings.quality],
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const exportPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        recorder.onerror = () => reject(new Error('Recording failed'));
      });

      recorder.start(100); // Collect data every 100ms
      setStatus('exporting');

      // Render each clip sequentially
      const totalDuration = videoClips.reduce((sum, c) => sum + c.duration, 0);
      let elapsed = 0;

      for (let i = 0; i < videoClips.length; i++) {
        if (abortRef.current) {
          recorder.stop();
          audioCtx.close();
          setStatus('idle');
          return;
        }

        const clip = videoClips[i];
        const video = videoElements[i];

        // Set up video for rendering
        video.currentTime = clip.trimStart;
        video.playbackRate = clip.speed;
        await new Promise<void>(resolve => {
          video.onseeked = () => resolve();
        });

        const clipDuration = clip.duration * 1000; // ms
        const startTime = performance.now();

        // Render frames
        await new Promise<void>((resolve) => {
          const renderFrame = () => {
            if (abortRef.current) { resolve(); return; }

            const renderElapsed = performance.now() - startTime;
            const videoTime = clip.trimStart + (renderElapsed / 1000) * clip.speed;

            if (renderElapsed >= clipDuration || videoTime >= clip.trimEnd) {
              resolve();
              return;
            }

            // Draw frame
            ctx!.filter = buildFilterString(clip.effects);
            ctx!.save();

            // Handle rotation
            if (clip.rotation === 90 || clip.rotation === 270) {
              ctx!.translate(canvas.width / 2, canvas.height / 2);
              ctx!.rotate((clip.rotation * Math.PI) / 180);
              ctx!.drawImage(video, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
            } else {
              ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);
            }

            ctx!.restore();
            ctx!.filter = 'none';

            // Draw text overlays
            const textClips = project.tracks.find(t => t.type === 'text')?.clips || [];
            for (const tc of textClips) {
              if (!tc.textOverlay) continue;
              const globalTime = elapsed + renderElapsed / 1000;
              if (globalTime >= tc.startTime && globalTime < tc.startTime + tc.duration) {
                const t = tc.textOverlay;
                ctx!.font = `bold ${t.fontSize * (canvas.width / 1920)}px ${t.font}`;
                ctx!.fillStyle = t.color;
                ctx!.textAlign = 'center';
                ctx!.textBaseline = 'middle';
                if (t.shadow) {
                  ctx!.shadowColor = t.shadowColor;
                  ctx!.shadowBlur = 4;
                  ctx!.shadowOffsetX = 2;
                  ctx!.shadowOffsetY = 2;
                }
                if (t.backgroundOpacity > 0) {
                  const metrics = ctx!.measureText(t.text);
                  const padding = 8;
                  ctx!.fillStyle = t.backgroundColor + Math.round(t.backgroundOpacity * 2.55).toString(16).padStart(2, '0');
                  ctx!.fillRect(
                    (t.position.x / 100) * canvas.width - metrics.width / 2 - padding,
                    (t.position.y / 100) * canvas.height - t.fontSize / 2 - padding / 2,
                    metrics.width + padding * 2,
                    t.fontSize + padding
                  );
                  ctx!.fillStyle = t.color;
                }
                ctx!.fillText(t.text, (t.position.x / 100) * canvas.width, (t.position.y / 100) * canvas.height);
                ctx!.shadowColor = 'transparent';
              }
            }

            requestAnimationFrame(renderFrame);
          };
          video.play().catch(() => {});
          renderFrame();
        });

        video.pause();
        elapsed += clip.duration;
        setProgress(Math.min(99, (elapsed / totalDuration) * 100));
      }

      // Stop recording
      recorder.stop();
      audioCtx.close();

      const blob = await exportPromise;
      setProgress(100);

      // Create download URL
      const url = URL.createObjectURL(blob);
      setExportedUrl(url);
      setStatus('done');

      // Clean up video elements
      videoElements.forEach(v => URL.revokeObjectURL(v.src));

    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Export failed');
    }
  }, [project, settings]);

  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    const ext = exportedUrl.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${project?.name || 'mako-export'}.${ext}`;
    a.click();
  };

  const handleClose = () => {
    abortRef.current = true;
    useProjectStore.setState({ showExportDialog: false });
    if (exportedUrl) URL.revokeObjectURL(exportedUrl);
  };

  if (!showExportDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={handleClose}>
      <div className="w-[90%] max-w-md bg-bg-secondary rounded-2xl border border-border-primary p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text-primary">
            {status === 'done' ? 'Export Complete!' : 'Export Video'}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Settings (only when idle) */}
        {status === 'idle' && (
          <div className="space-y-4 mb-5">
            {/* Resolution */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Resolution</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSettings(s => ({ ...s, resolution: key as any }))}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                      settings.resolution === key
                        ? 'bg-accent text-white ring-2 ring-accent/30'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    <div>{preset.label}</div>
                    <div className="text-[9px] opacity-70 mt-0.5">{preset.width}×{preset.height}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* FPS */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Frame Rate</label>
              <div className="flex gap-2">
                {[24, 30, 60].map(fps => (
                  <button
                    key={fps}
                    onClick={() => setSettings(s => ({ ...s, fps }))}
                    className={`flex-1 py-2 rounded-lg text-xs transition-colors ${
                      settings.fps === fps
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    {fps} fps
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block">Quality</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => setSettings(s => ({ ...s, quality: q }))}
                    className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors ${
                      settings.quality === q
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Format info */}
            <p className="text-[10px] text-text-muted bg-bg-tertiary p-2 rounded-lg">
              📹 Export format: {EXPORT_PRESETS[settings.resolution] ? 'MP4/WebM' : 'WebM'} • {settings.fps}fps • {settings.quality} quality
            </p>
          </div>
        )}

        {/* Progress */}
        {(status === 'preparing' || status === 'exporting') && (
          <div className="py-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-accent animate-spin" />
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2 mb-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-text-secondary">
              {status === 'preparing' ? 'Preparing export...' : `Exporting... ${Math.round(progress)}%`}
            </p>
            <button
              onClick={() => { abortRef.current = true; setStatus('idle'); }}
              className="w-full mt-4 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle size={48} className="text-success" />
            </div>
            <p className="text-center text-sm text-text-secondary mb-4">
              Your video has been exported successfully!
            </p>
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={16} />
              Download Video
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle size={48} className="text-danger" />
            </div>
            <p className="text-center text-sm text-danger mb-2">Export Failed</p>
            <p className="text-center text-xs text-text-muted mb-4">{errorMsg}</p>
            <button
              onClick={() => { setStatus('idle'); setErrorMsg(''); }}
              className="w-full py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-xs text-text-secondary transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Export button */}
        {status === 'idle' && (
          <button
            onClick={handleExport}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export Video
          </button>
        )}
      </div>
    </div>
  );
}
