import { useRef, useState, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { X, Video, Image, Music, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function MediaPicker({ onClose }: Props) {
  const { project, addClip, addAudioTrack, getProjectDuration } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setLoading(true);
    setError(null);

    try {
      const url = URL.createObjectURL(file);

      // Get video metadata
      const metadata = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => reject(new Error('Failed to read video metadata'));
        video.src = url;
      });

      // Find the video track
      const videoTrack = project.tracks.find(t => t.type === 'video');
      if (!videoTrack) {
        setError('No video track found');
        setLoading(false);
        return;
      }

      // Calculate start time (after existing clips)
      const lastClipEnd = videoTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

      // Generate thumbnail
      const thumbnailUrl = await generateThumbnail(url, metadata.duration / 4);

      addClip(videoTrack.id, {
        type: 'video',
        fileUrl: url,
        fileName: file.name,
        thumbnailUrl,
        duration: metadata.duration,
        originalDuration: metadata.duration,
        trimStart: 0,
        trimEnd: metadata.duration,
        startTime: lastClipEnd,
        volume: 100,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import video');
    } finally {
      setLoading(false);
    }
  }, [project, addClip, onClose]);

  const handleImageImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setLoading(true);
    setError(null);

    try {
      const url = URL.createObjectURL(file);

      const stickerTrack = project.tracks.find(t => t.type === 'sticker');
      if (!stickerTrack) {
        setError('No overlay track found');
        setLoading(false);
        return;
      }

      const lastClipEnd = stickerTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);

      addClip(stickerTrack.id, {
        type: 'overlay',
        fileUrl: url,
        fileName: file.name,
        duration: 5,
        originalDuration: 5,
        trimStart: 0,
        trimEnd: 5,
        startTime: lastClipEnd,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import image');
    } finally {
      setLoading(false);
    }
  }, [project, addClip, onClose]);

  const handleAudioImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const url = URL.createObjectURL(file);

      const metadata = await new Promise<{ duration: number }>((resolve, reject) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          resolve({ duration: audio.duration });
          URL.revokeObjectURL(audio.src);
        };
        audio.onerror = () => reject(new Error('Failed to read audio metadata'));
        audio.src = url;
      });

      addAudioTrack({
        name: file.name,
        fileUrl: url,
        duration: metadata.duration,
        volume: 100,
        fadeIn: 0,
        fadeOut: 0,
        startTime: 0,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import audio');
    } finally {
      setLoading(false);
    }
  }, [addAudioTrack, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg bg-bg-secondary rounded-t-2xl border-t border-border-primary p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text-primary">Import Media</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 size={32} className="text-accent animate-spin mb-3" />
            <p className="text-sm text-text-secondary">Processing media...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {/* Video */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 bg-bg-tertiary hover:bg-bg-elevated rounded-xl border border-border-primary hover:border-accent transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-track-video/20 flex items-center justify-center">
                <Video size={22} className="text-track-video" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Video</span>
            </button>

            {/* Image */}
            <button
              onClick={() => audioInputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 bg-bg-tertiary hover:bg-bg-elevated rounded-xl border border-border-primary hover:border-accent transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-track-sticker/20 flex items-center justify-center">
                <Image size={22} className="text-track-sticker" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Image</span>
            </button>

            {/* Audio */}
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*';
                input.onchange = (e) => handleAudioImport(e as React.ChangeEvent<HTMLInputElement>);
                input.click();
              }}
              className="flex flex-col items-center gap-2 p-4 bg-bg-tertiary hover:bg-bg-elevated rounded-xl border border-border-primary hover:border-accent transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-track-audio/20 flex items-center justify-center">
                <Music size={22} className="text-track-audio" />
              </div>
              <span className="text-xs text-text-secondary font-medium">Audio</span>
            </button>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoImport}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageImport}
        />
      </div>
    </div>
  );
}

// Helper to generate video thumbnail
async function generateThumbnail(videoUrl: string, time: number): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = time;
    };

    video.onseeked = () => {
      canvas.width = 160;
      canvas.height = 90;
      ctx?.drawImage(video, 0, 0, 160, 90);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      resolve('');
      URL.revokeObjectURL(video.src);
    };

    video.src = videoUrl;
  });
}
