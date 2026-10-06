import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  Project, Track, Clip, AudioTrack, Transition, TextOverlay,
  StickerOverlay, VideoEffects, ToolType, Keyframe,
  FxInstance, BackgroundRemoval, DEFAULT_BG_REMOVAL,
} from '../types';

// ─── Helpers ────────────────────────────────────────────────

function createDefaultEffects(): VideoEffects {
  return {
    brightness: 100, contrast: 100, saturation: 100,
    blur: 0, grayscale: 0, sepia: 0, vignette: 0,
    exposure: 0, sharpness: 0, temperature: 0,
  };
}

function createDefaultChromaKey() {
  return { enabled: false, color: '#00ff00', tolerance: 30, smoothness: 20 };
}

function createDefaultBgRemoval(): BackgroundRemoval {
  return {
    enabled: false, processing: false, progress: 0,
    tolerance: 40, edgeSmoothing: 30,
    replacementType: 'transparent',
    replacementColor: '#00ff00',
    replacementGradient: { from: '#6366f1', to: '#ec4899', angle: 135 },
    replacementImageUrl: null,
    autoDetected: false,
  };
}

function createTrack(type: Track['type']): Track {
  return { id: uuid(), type, clips: [], muted: false, locked: false, visible: true };
}

function createEmptyProject(name: string): Project {
  return {
    id: uuid(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    duration: 0,
    width: 1920,
    height: 1080,
    fps: 30,
    tracks: [
      createTrack('text'),
      createTrack('sticker'),
      createTrack('video'),
    ],
    transitions: [],
    audioTracks: [],
  };
}

// ─── Store ──────────────────────────────────────────────────

interface ProjectState {
  project: Project | null;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTime: number;
  isPlaying: boolean;
  activeTool: ToolType;
  timelineZoom: number;

  // Actions
  createProject: (name: string) => void;
  loadProject: (project: Project) => void;
  updateProject: (updates: Partial<Project>) => void;

  // Clip actions
  addClip: (trackId: string, clip: Partial<Clip> & { fileUrl: string; fileName: string; type: Clip['type'] }) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  splitClip: (clipId: string, atTime: number) => void;
  duplicateClip: (clipId: string) => void;
  selectClip: (clipId: string | null, trackId?: string | null) => void;

  // Track actions
  addTrack: (type: Track['type']) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;

  // Audio actions
  addAudioTrack: (audio: Omit<AudioTrack, 'id'>) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (id: string) => void;

  // Transition actions
  addTransition: (transition: Omit<Transition, 'id'>) => void;
  removeTransition: (id: string) => void;

  // Text overlay
  addTextOverlay: (text: Partial<TextOverlay>) => void;
  updateTextOverlay: (clipId: string, updates: Partial<TextOverlay>) => void;

  // Sticker
  addSticker: (sticker: Partial<StickerOverlay>) => void;
  updateSticker: (clipId: string, updates: Partial<StickerOverlay>) => void;

  // Effects
  updateClipEffects: (clipId: string, effects: Partial<VideoEffects>) => void;

  // FX Effects
  addFxInstance: (clipId: string, fx: Omit<FxInstance, 'id'>) => void;
  removeFxInstance: (clipId: string, fxId: string) => void;
  updateFxInstance: (clipId: string, fxId: string, updates: Partial<FxInstance>) => void;
  clearAllFx: (clipId: string) => void;

  // Background Removal
  updateBackgroundRemoval: (clipId: string, updates: Partial<BackgroundRemoval>) => void;
  resetBackgroundRemoval: (clipId: string) => void;

  // Keyframes
  addKeyframe: (clipId: string, keyframe: Partial<Keyframe>) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;

  // Playback
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveTool: (tool: ToolType) => void;
  setTimelineZoom: (zoom: number) => void;

  // Computed
  getSelectedClip: () => Clip | null;
  getProjectDuration: () => number;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  selectedClipId: null,
  selectedTrackId: null,
  currentTime: 0,
  isPlaying: false,
  activeTool: 'none',
  timelineZoom: 1,

  createProject: (name) => {
    set({ project: createEmptyProject(name), selectedClipId: null, currentTime: 0, isPlaying: false, activeTool: 'none' });
  },

  loadProject: (project) => {
    set({ project, selectedClipId: null, currentTime: 0, isPlaying: false, activeTool: 'none' });
  },

  updateProject: (updates) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, ...updates, updatedAt: Date.now() } });
  },

  addClip: (trackId, clipData) => {
    const { project } = get();
    if (!project) return;

    const clip: Clip = {
      id: uuid(),
      type: clipData.type,
      fileUrl: clipData.fileUrl,
      fileName: clipData.fileName,
      thumbnailUrl: clipData.thumbnailUrl,
      duration: clipData.duration || 0,
      originalDuration: clipData.originalDuration || clipData.duration || 0,
      trimStart: clipData.trimStart || 0,
      trimEnd: clipData.trimEnd || clipData.duration || 0,
      startTime: clipData.startTime || 0,
      speed: clipData.speed || 1,
      reverse: clipData.reverse || false,
      volume: clipData.volume ?? 100,
      effects: clipData.effects || createDefaultEffects(),
      fxInstances: clipData.fxInstances || [],
      backgroundRemoval: clipData.backgroundRemoval || createDefaultBgRemoval(),
      keyframes: clipData.keyframes || [],
      rotation: clipData.rotation || 0,
      chromaKey: clipData.chromaKey || createDefaultChromaKey(),
      textOverlay: clipData.textOverlay,
      sticker: clipData.sticker,
    };

    const tracks = project.tracks.map(t => {
      if (t.id === trackId) {
        return { ...t, clips: [...t.clips, clip] };
      }
      return t;
    });

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  updateClip: (clipId, updates) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  removeClip: (clipId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== clipId),
    }));

    set({
      project: { ...project, tracks, updatedAt: Date.now() },
      selectedClipId: get().selectedClipId === clipId ? null : get().selectedClipId,
    });
  },

  splitClip: (clipId, atTime) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => {
      const clipIndex = t.clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) return t;

      const clip = t.clips[clipIndex];
      const relativeTime = atTime - clip.startTime;

      if (relativeTime <= 0.1 || relativeTime >= clip.duration - 0.1) return t;

      const firstHalf: Clip = {
        ...clip,
        duration: relativeTime,
        trimEnd: clip.trimStart + relativeTime / clip.speed,
      };

      const secondHalf: Clip = {
        ...clip,
        id: uuid(),
        startTime: clip.startTime + relativeTime,
        trimStart: clip.trimStart + relativeTime / clip.speed,
        duration: clip.duration - relativeTime,
      };

      const newClips = [...t.clips];
      newClips.splice(clipIndex, 1, firstHalf, secondHalf);
      return { ...t, clips: newClips };
    });

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  duplicateClip: (clipId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => {
      const clip = t.clips.find(c => c.id === clipId);
      if (!clip) return t;

      const newClip: Clip = {
        ...clip,
        id: uuid(),
        startTime: clip.startTime + clip.duration,
      };

      return { ...t, clips: [...t.clips, newClip] };
    });

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  selectClip: (clipId, trackId) => {
    set({ selectedClipId: clipId, selectedTrackId: trackId ?? null });
  },

  addTrack: (type) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, tracks: [...project.tracks, createTrack(type)], updatedAt: Date.now() } });
  },

  toggleTrackMute: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t);
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  toggleTrackLock: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map(t => t.id === trackId ? { ...t, locked: !t.locked } : t);
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  toggleTrackVisibility: (trackId) => {
    const { project } = get();
    if (!project) return;
    const tracks = project.tracks.map(t => t.id === trackId ? { ...t, visible: !t.visible } : t);
    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  addAudioTrack: (audio) => {
    const { project } = get();
    if (!project) return;
    const audioTrack: AudioTrack = { ...audio, id: uuid() };
    set({ project: { ...project, audioTracks: [...project.audioTracks, audioTrack], updatedAt: Date.now() } });
  },

  updateAudioTrack: (id, updates) => {
    const { project } = get();
    if (!project) return;
    const audioTracks = project.audioTracks.map(a => a.id === id ? { ...a, ...updates } : a);
    set({ project: { ...project, audioTracks, updatedAt: Date.now() } });
  },

  removeAudioTrack: (id) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, audioTracks: project.audioTracks.filter(a => a.id !== id), updatedAt: Date.now() } });
  },

  addTransition: (transition) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, transitions: [...project.transitions, { ...transition, id: uuid() }], updatedAt: Date.now() } });
  },

  removeTransition: (id) => {
    const { project } = get();
    if (!project) return;
    set({ project: { ...project, transitions: project.transitions.filter(t => t.id !== id), updatedAt: Date.now() } });
  },

  addTextOverlay: (textData) => {
    const { project } = get();
    if (!project) return;

    const textTrack = project.tracks.find(t => t.type === 'text');
    if (!textTrack) return;

    const overlay: TextOverlay = {
      id: uuid(),
      text: textData.text || 'Your Text',
      font: textData.font || 'Inter',
      fontSize: textData.fontSize || 32,
      color: textData.color || '#ffffff',
      backgroundColor: textData.backgroundColor || '#000000',
      backgroundOpacity: textData.backgroundOpacity ?? 0,
      shadow: textData.shadow ?? true,
      shadowColor: textData.shadowColor || '#000000',
      position: textData.position || { x: 50, y: 50 },
      rotation: textData.rotation || 0,
      scale: textData.scale || 1,
      animation: textData.animation || null,
      startTime: textData.startTime ?? get().currentTime,
      duration: textData.duration || 3,
    };

    const clip: Clip = {
      id: uuid(),
      type: 'text',
      fileUrl: '',
      fileName: overlay.text,
      duration: overlay.duration,
      originalDuration: overlay.duration,
      trimStart: 0,
      trimEnd: overlay.duration,
      startTime: overlay.startTime,
      speed: 1,
      reverse: false,
      volume: 0,
      effects: createDefaultEffects(),
      fxInstances: [],
      backgroundRemoval: createDefaultBgRemoval(),
      keyframes: [],
      rotation: 0,
      chromaKey: createDefaultChromaKey(),
      textOverlay: overlay,
    };

    const tracks = project.tracks.map(t =>
      t.id === textTrack.id ? { ...t, clips: [...t.clips, clip] } : t
    );

    set({ project: { ...project, tracks, updatedAt: Date.now() }, selectedClipId: clip.id });
  },

  updateTextOverlay: (clipId, updates) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId || !c.textOverlay) return c;
        return { ...c, textOverlay: { ...c.textOverlay, ...updates } };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  addSticker: (stickerData) => {
    const { project } = get();
    if (!project) return;

    const stickerTrack = project.tracks.find(t => t.type === 'sticker');
    if (!stickerTrack) return;

    const sticker: StickerOverlay = {
      id: uuid(),
      emoji: stickerData.emoji || '⭐',
      position: stickerData.position || { x: 50, y: 50 },
      scale: stickerData.scale || 1,
      rotation: stickerData.rotation || 0,
      opacity: stickerData.opacity ?? 100,
      startTime: stickerData.startTime ?? get().currentTime,
      duration: stickerData.duration || 3,
    };

    const clip: Clip = {
      id: uuid(),
      type: 'sticker',
      fileUrl: '',
      fileName: sticker.emoji,
      duration: sticker.duration,
      originalDuration: sticker.duration,
      trimStart: 0,
      trimEnd: sticker.duration,
      startTime: sticker.startTime,
      speed: 1,
      reverse: false,
      volume: 0,
      effects: createDefaultEffects(),
      fxInstances: [],
      backgroundRemoval: createDefaultBgRemoval(),
      keyframes: [],
      rotation: 0,
      chromaKey: createDefaultChromaKey(),
      sticker,
    };

    const tracks = project.tracks.map(t =>
      t.id === stickerTrack.id ? { ...t, clips: [...t.clips, clip] } : t
    );

    set({ project: { ...project, tracks, updatedAt: Date.now() }, selectedClipId: clip.id });
  },

  updateSticker: (clipId, updates) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId || !c.sticker) return c;
        return { ...c, sticker: { ...c.sticker, ...updates } };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  updateClipEffects: (clipId, effects) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, effects: { ...c.effects, ...effects } };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  // ─── FX Effects Actions ────────────────────────────────────

  addFxInstance: (clipId, fxData) => {
    const { project } = get();
    if (!project) return;

    const fx: FxInstance = {
      ...fxData,
      id: uuid(),
    };

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, fxInstances: [...c.fxInstances, fx] };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  removeFxInstance: (clipId, fxId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, fxInstances: c.fxInstances.filter(f => f.id !== fxId) };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  updateFxInstance: (clipId, fxId, updates) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          fxInstances: c.fxInstances.map(f =>
            f.id === fxId ? { ...f, ...updates } : f
          ),
        };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  clearAllFx: (clipId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, fxInstances: [] };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  // ─── Background Removal Actions ────────────────────────────

  updateBackgroundRemoval: (clipId, updates) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, backgroundRemoval: { ...c.backgroundRemoval, ...updates } };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  resetBackgroundRemoval: (clipId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, backgroundRemoval: createDefaultBgRemoval() };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  addKeyframe: (clipId, keyframeData) => {
    const { project } = get();
    if (!project) return;

    const keyframe: Keyframe = {
      id: uuid(),
      time: keyframeData.time ?? get().currentTime,
      position: keyframeData.position,
      scale: keyframeData.scale,
      rotation: keyframeData.rotation,
      opacity: keyframeData.opacity,
    };

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, keyframes: [...c.keyframes, keyframe].sort((a, b) => a.time - b.time) };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  removeKeyframe: (clipId, keyframeId) => {
    const { project } = get();
    if (!project) return;

    const tracks = project.tracks.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        return { ...c, keyframes: c.keyframes.filter(k => k.id !== keyframeId) };
      }),
    }));

    set({ project: { ...project, tracks, updatedAt: Date.now() } });
  },

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(5, zoom)) }),

  getSelectedClip: () => {
    const { project, selectedClipId } = get();
    if (!project || !selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find(c => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  },

  getProjectDuration: () => {
    const { project } = get();
    if (!project) return 0;
    let maxEnd = 0;
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        const end = clip.startTime + clip.duration;
        if (end > maxEnd) maxEnd = end;
      }
    }
    for (const audio of project.audioTracks) {
      const end = audio.startTime + audio.duration;
      if (end > maxEnd) maxEnd = end;
    }
    return maxEnd;
  },
}));
