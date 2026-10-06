import React, { useState, useRef, useCallback } from 'react';
import { useProject } from '../store/ProjectContext';
import { getEffectFilter } from '../utils/mediaUtils';

type ExportResolution = '720p' | '1080p' | '4K';
type ExportStatus = 'idle' | 'preparing' | 'recording' | 'processing' | 'done' | 'error';

const RESOLUTIONS: { label: string; value: ExportResolution; width: number; height: number; desc: string }[] = [
  { label: '720p', value: '720p', width: 1280, height: 720, desc: 'HD • Fast export' },
  { label: '1080p', value: '1080p', width: 1920, height: 1080, desc: 'Full HD • Recommended' },
  { label: '4K', value: '4K', width: 3840, height: 2160, desc: 'Ultra HD • Device dependent' },
];

export default function ExportModal() {
  const { state, dispatch } = useProject();
  const project = state.project;
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!project) return null;

  const resConfig = RESOLUTIONS.find(r => r.value === resolution)!;

  // Determine aspect ratio dimensions
  function getOutputDimensions(): { width: number; height: number } {
    const aspect = project.aspectRatio;
    if (aspect === '9:16') return { width: resConfig.height, height: resConfig.width };
    if (aspect === '1:1') return { width: resConfig.height, height: resConfig.height };
    if (aspect === '4:3') return { width: Math.round(resConfig.height * 4 / 3), height: resConfig.height };
    return { width: resConfig.width, height: resConfig.height };
  }

  const handleExport = useCallback(async () => {
    if (!project) return;
    setStatus('preparing');
    setProgress(0);
    setError('');
    setExportUrl(null);

    try {
      const dims = getOutputDimensions();
      const canvas = document.createElement('canvas');
      canvas.width = dims.width;
      canvas.height = dims.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Check MediaRecorder support
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }
      if (!selectedMime) throw new Error('No supported video format found in this browser');

      setStatus('recording');

      // Create video elements for each video clip
      const videoElements: Map<string, HTMLVideoElement> = new Map();
      const videoClips = project.clips.filter(c => (c.type === 'video' || c.type === 'overlay') && c.mediaUrl);

      for (const clip of videoClips) {
        if (clip.mediaUrl && !videoElements.has(clip.mediaUrl)) {
          const video = document.createElement('video');
          video.src = clip.mediaUrl;
          video.muted = true;
          video.preload = 'auto';
          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error(`Failed to load: ${clip.mediaUrl}`));
            setTimeout(() => resolve(), 5000); // Timeout fallback
          });
          videoElements.set(clip.mediaUrl, video);
        }
      }

      // Set up MediaRecorder
      const stream = canvas.captureStream(30);

      // Audio will be set up after the render loop starts
      const audioCtx = new AudioContext();
      const audioClips = project.clips.filter(c => c.type === 'audio' && c.mediaUrl);

      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: resolution === '4K' ? 20000000 : resolution === '1080p' ? 8000000 : 4000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const ext = selectedMime.includes('mp4') ? 'mp4' : 'webm';
          resolve(new Blob(chunks, { type: selectedMime }));
        };
      });

      recorder.start(100); // Collect data every 100ms

      // Start audio sources
      const audioStartTimes: number[] = [];
      for (const clip of audioClips) {
        const source = audioSources.find((_, i) => audioClips[i] === clip);
        // Actually start each audio source at the right time
      }
      // Re-create and start audio sources properly
      const activeAudioSources: { source: AudioBufferSourceNode; startTime: number }[] = [];
      for (const clip of audioClips) {
        if (clip.mediaUrl) {
          try {
            const response = await fetch(clip.mediaUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = audioCtx.createGain();
            // Apply fade in/out
            const fadeInDur = clip.fadeIn || 0;
            const fadeOutDur = clip.fadeOut || 0;
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + clip.startTime);
            if (fadeInDur > 0) {
              gainNode.gain.linearRampToValueAtTime(clip.volume, audioCtx.currentTime + clip.startTime + fadeInDur);
            } else {
              gainNode.gain.setValueAtTime(clip.volume, audioCtx.currentTime + clip.startTime);
            }
            if (fadeOutDur > 0) {
              gainNode.gain.setValueAtTime(clip.volume, audioCtx.currentTime + clip.startTime + clip.duration - fadeOutDur);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + clip.startTime + clip.duration);
            }
            source.connect(gainNode);
            const dest = audioCtx.createMediaStreamDestination();
            gainNode.connect(dest);
            dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
            activeAudioSources.push({ source, startTime: clip.startTime });
          } catch (e) {
            console.warn('Failed to add audio:', e);
          }
        }
      }

      // Start audio playback
      const startTime = performance.now();
      const totalDuration = project.duration;

      // Start all audio sources at the right time
      activeAudioSources.forEach(({ source, startTime: clipStart }) => {
        source.start(audioCtx.currentTime + clipStart);
      });

      // Render loop
      const renderFrame = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const currentTime = elapsed;
        const progressPct = Math.min(100, (currentTime / totalDuration) * 100);
        setProgress(progressPct);

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video clips
        for (const clip of videoClips) {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
            const video = videoElements.get(clip.mediaUrl!);
            if (video) {
              const clipTime = currentTime - clip.startTime + clip.trimStart;
              if (Math.abs(video.currentTime - clipTime) > 0.5) {
                video.currentTime = clipTime;
              }

              // Apply effects
              ctx.save();
              ctx.filter = getEffectFilter(clip.effects);
              ctx.globalAlpha = clip.opacity;

              // Transform
              const cx = canvas.width / 2;
              const cy = canvas.height / 2;
              ctx.translate(cx + (clip.position.x - 50) * canvas.width / 100, cy + (clip.position.y - 50) * canvas.height / 100);
              ctx.scale(clip.scale, clip.scale);
              ctx.rotate((clip.rotation * Math.PI) / 180);

              // Draw video frame
              const vw = video.videoWidth || canvas.width;
              const vh = video.videoHeight || canvas.height;
              const scale = Math.max(canvas.width / vw, canvas.height / vh);
              ctx.drawImage(video, -(vw * scale) / 2, -(vh * scale) / 2, vw * scale, vh * scale);

              ctx.restore();
            }
          }
        }

        // Draw text overlays
        for (const clip of project.clips.filter(c => c.type === 'text')) {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration && clip.textConfig) {
            const tc = clip.textConfig;
            ctx.save();
            ctx.font = `${tc.italic ? 'italic ' : ''}${tc.bold ? 'bold ' : ''}${tc.fontSize * (canvas.width / 1920)}px ${tc.fontFamily}`;
            ctx.fillStyle = tc.color;
            ctx.textAlign = tc.align as CanvasTextAlign;
            if (tc.shadow) {
              ctx.shadowColor = tc.shadowColor;
              ctx.shadowBlur = 8;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
            }
            const x = (clip.position.x / 100) * canvas.width;
            const y = (clip.position.y / 100) * canvas.height;
            ctx.fillText(tc.text, x, y);
            ctx.restore();
          }
        }

        // Draw sticker overlays
        for (const clip of project.clips.filter(c => c.type === 'sticker' || c.type === 'overlay')) {
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration && clip.stickerUrl) {
            ctx.save();
            ctx.globalAlpha = clip.opacity;
            ctx.font = `${48 * clip.scale}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const x = (clip.position.x / 100) * canvas.width;
            const y = (clip.position.y / 100) * canvas.height;
            ctx.fillText(clip.stickerUrl, x, y);
            ctx.restore();
          }
        }

        if (currentTime < totalDuration) {
          requestAnimationFrame(renderFrame);
        } else {
          // Done rendering
          setProgress(100);
          setStatus('processing');
          recorder.stop();
          audioCtx.close();

          // Clean up
          videoElements.forEach(v => { v.pause(); v.src = ''; });
        }
      };

      requestAnimationFrame(renderFrame);

      // Wait for recording to finish
      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setStatus('done');
      setProgress(100);

    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Export failed. Try a lower resolution.');
      setStatus('error');
    }
  }, [project, resolution]);

  function handleDownload() {
    if (!exportUrl) return;
    const a = document.createElement('a');
    a.href = exportUrl;
    const ext = exportUrl.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${project.name.replace(/\s+/g, '_')}_${resolution}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleClose() {
    if (exportUrl) URL.revokeObjectURL(exportUrl);
    setExportUrl(null);
    setStatus('idle');
    setProgress(0);
    setError('');
    dispatch({ type: 'SET_EXPORT_MODAL', show: false });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-secondary border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Export Video</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-bg-hover">
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {status === 'idle' && (
            <>
              {/* Resolution selection */}
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Resolution</label>
                <div className="space-y-2">
                  {RESOLUTIONS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setResolution(r.value)}
                      className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                        resolution === r.value
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-bg-tertiary hover:border-border-light'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">{r.label}</p>
                        <p className="text-xs text-text-muted">{r.desc}</p>
                      </div>
                      {resolution === r.value && (
                        <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project info */}
              <div className="p-3 rounded-xl bg-bg-tertiary space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Duration</span>
                  <span className="text-text-secondary">{Math.round(project.duration)}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Clips</span>
                  <span className="text-text-secondary">{project.clips.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Output</span>
                  <span className="text-text-secondary">{getOutputDimensions().width}×{getOutputDimensions().height}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Format</span>
                  <span className="text-text-secondary">WebM / MP4</span>
                </div>
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-lg shadow-accent/20"
              >
                Export Video
              </button>
            </>
          )}

          {(status === 'preparing' || status === 'recording' || status === 'processing') && (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  {status === 'preparing' && 'Preparing export...'}
                  {status === 'recording' && 'Recording video...'}
                  {status === 'processing' && 'Processing...'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {status === 'recording' && 'Playing through timeline — keep this tab active'}
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm font-mono text-text-secondary">{Math.round(progress)}%</p>
            </div>
          )}

          {status === 'done' && exportUrl && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm font-medium text-text-primary">Export Complete!</p>

              {/* Video preview */}
              <video
                src={exportUrl}
                controls
                className="w-full rounded-xl bg-black"
                style={{ maxHeight: '200px' }}
              />

              <button
                onClick={handleDownload}
                className="w-full py-3.5 rounded-xl bg-success text-white font-semibold hover:brightness-110 transition-all"
              >
                Download Video
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-sm text-danger">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStatus('idle'); setError(''); }}
                  className="flex-1 py-3 rounded-xl bg-bg-tertiary text-text-secondary font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl bg-accent text-white font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
