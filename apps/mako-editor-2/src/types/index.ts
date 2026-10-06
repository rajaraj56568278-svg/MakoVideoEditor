// ─── Core Types ───────────────────────────────────────────────

export type ClipType = 'video' | 'image' | 'audio' | 'text' | 'sticker' | 'overlay';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Keyframe {
  id: string;
  time: number; // seconds
  position?: Position;
  scale?: number;
  rotation?: number;
  opacity?: number;
}

export interface VideoEffects {
  brightness: number;    // 0-200, default 100
  contrast: number;      // 0-200, default 100
  saturation: number;    // 0-200, default 100
  blur: number;          // 0-20, default 0
  grayscale: number;     // 0-100, default 0
  sepia: number;         // 0-100, default 0
  vignette: number;      // 0-100, default 0
  exposure: number;      // -100 to 100, default 0
  sharpness: number;     // 0-100, default 0
  temperature: number;   // -100 to 100, default 0
}

// ─── FX Effects System ────────────────────────────────────────

export type FxType =
  | 'blur'
  | 'motionBlur'
  | 'glitch'
  | 'shake'
  | 'rgbSplit'
  | 'flash'
  | 'zoom'
  | 'spin'
  | 'distortion'
  | 'vhs'
  | 'noise'
  | 'glow'
  | 'vignette'
  | 'film'
  | 'pixelate'
  | 'mirror'
  | 'chromaticAberration';

export interface FxInstance {
  id: string;
  type: FxType;
  intensity: number;   // 0-100
  duration: number;    // seconds, 0 = entire clip
  startTime: number;   // offset within clip
  enabled: boolean;
}

export const FX_DEFINITIONS: { type: FxType; label: string; icon: string; defaultIntensity: number }[] = [
  { type: 'blur', label: 'Blur', icon: '💨', defaultIntensity: 50 },
  { type: 'motionBlur', label: 'Motion Blur', icon: '🌊', defaultIntensity: 50 },
  { type: 'glitch', label: 'Glitch', icon: '⚡', defaultIntensity: 40 },
  { type: 'shake', label: 'Shake', icon: '📳', defaultIntensity: 30 },
  { type: 'rgbSplit', label: 'RGB Split', icon: '🔴', defaultIntensity: 40 },
  { type: 'flash', label: 'Flash', icon: '💥', defaultIntensity: 60 },
  { type: 'zoom', label: 'Zoom', icon: '🔍', defaultIntensity: 50 },
  { type: 'spin', label: 'Spin', icon: '🌀', defaultIntensity: 50 },
  { type: 'distortion', label: 'Distortion', icon: '🔮', defaultIntensity: 40 },
  { type: 'vhs', label: 'VHS', icon: '📼', defaultIntensity: 50 },
  { type: 'noise', label: 'Noise', icon: '📡', defaultIntensity: 30 },
  { type: 'glow', label: 'Glow', icon: '✨', defaultIntensity: 50 },
  { type: 'vignette', label: 'Vignette', icon: '🔲', defaultIntensity: 50 },
  { type: 'film', label: 'Film', icon: '🎞️', defaultIntensity: 50 },
  { type: 'pixelate', label: 'Pixelate', icon: '🟩', defaultIntensity: 50 },
  { type: 'mirror', label: 'Mirror', icon: '🪞', defaultIntensity: 100 },
  { type: 'chromaticAberration', label: 'Chromatic', icon: '🌈', defaultIntensity: 40 },
];

// ─── Background Removal ───────────────────────────────────────

export type BgReplacementType = 'none' | 'color' | 'gradient' | 'image' | 'transparent';

export interface BackgroundRemoval {
  enabled: boolean;
  processing: boolean;
  progress: number;          // 0-100
  tolerance: number;         // 0-100, color similarity threshold
  edgeSmoothing: number;     // 0-100
  replacementType: BgReplacementType;
  replacementColor: string;  // hex
  replacementGradient: { from: string; to: string; angle: number };
  replacementImageUrl: string | null;
  autoDetected: boolean;
}

export const DEFAULT_BG_REMOVAL: BackgroundRemoval = {
  enabled: false,
  processing: false,
  progress: 0,
  tolerance: 40,
  edgeSmoothing: 30,
  replacementType: 'transparent',
  replacementColor: '#00ff00',
  replacementGradient: { from: '#6366f1', to: '#ec4899', angle: 135 },
  replacementImageUrl: null,
  autoDetected: false,
};

// ─── Other Types ──────────────────────────────────────────────

export interface TextOverlay {
  id: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  shadow: boolean;
  shadowColor: string;
  position: Position;
  rotation: number;
  scale: number;
  animation: TextAnimation | null;
  startTime: number;
  duration: number;
}

export type TextAnimation = 'none' | 'fadeIn' | 'slideUp' | 'slideDown' | 'typewriter' | 'bounce' | 'glow';

export interface StickerOverlay {
  id: string;
  emoji: string;
  position: Position;
  scale: number;
  rotation: number;
  opacity: number;
  startTime: number;
  duration: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  volume: number;       // 0-200, default 100
  fadeIn: number;       // seconds
  fadeOut: number;      // seconds
  startTime: number;
}

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number; // seconds
  afterClipId: string;
}

export type TransitionType = 'none' | 'fade' | 'dissolve' | 'slideLeft' | 'slideRight' | 'slideUp' | 'zoom' | 'wipe';

export interface ChromaKey {
  enabled: boolean;
  color: string;     // hex color to remove
  tolerance: number; // 0-100
  smoothness: number; // 0-100
}

export interface Clip {
  id: string;
  type: ClipType;
  fileUrl: string;
  fileName: string;
  thumbnailUrl?: string;
  duration: number;       // seconds (trimmed)
  originalDuration: number;
  trimStart: number;      // seconds
  trimEnd: number;        // seconds
  startTime: number;      // position on timeline
  speed: number;          // 0.25 - 4.0
  reverse: boolean;
  volume: number;         // 0-200
  effects: VideoEffects;
  fxInstances: FxInstance[];
  backgroundRemoval: BackgroundRemoval;
  keyframes: Keyframe[];
  crop?: { x: number; y: number; width: number; height: number };
  rotation: number;       // 0, 90, 180, 270
  chromaKey: ChromaKey;
  // Text-specific
  textOverlay?: TextOverlay;
  // Sticker-specific
  sticker?: StickerOverlay;
}

export interface Track {
  id: string;
  type: ClipType;
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration: number;        // total duration in seconds
  width: number;           // export width
  height: number;          // export height
  fps: number;
  tracks: Track[];
  transitions: Transition[];
  audioTracks: AudioTrack[];
  thumbnailUrl?: string;
}

export interface ExportSettings {
  resolution: '720p' | '1080p' | '4K';
  fps: number;
  quality: 'low' | 'medium' | 'high';
  format: 'mp4';
}

export type ToolType =
  | 'none'
  | 'trim'
  | 'split'
  | 'speed'
  | 'crop'
  | 'rotate'
  | 'effects'
  | 'adjust'
  | 'text'
  | 'sticker'
  | 'audio'
  | 'transition'
  | 'keyframe'
  | 'chromaKey'
  | 'filter'
  | 'volume'
  | 'bgRemove';

export interface EditorState {
  currentProject: Project | null;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTime: number;
  isPlaying: boolean;
  activeTool: ToolType;
  timelineZoom: number;
  timelineScroll: number;
  isExporting: boolean;
  exportProgress: number;
  showExportDialog: boolean;
}

export const DEFAULT_EFFECTS: VideoEffects = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  vignette: 0,
  exposure: 0,
  sharpness: 0,
  temperature: 0,
};

export const DEFAULT_CHROMA_KEY: ChromaKey = {
  enabled: false,
  color: '#00ff00',
  tolerance: 30,
  smoothness: 20,
};

export const FONTS = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Courier New', 'Verdana', 'Impact', 'Comic Sans MS', 'Trebuchet MS',
];

export const TEXT_ANIMATIONS: { value: TextAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'glow', label: 'Glow' },
];

export const STICKERS = [
  '❤️', '🔥', '⭐', '✨', '💫', '🎉', '🎊', '💥', '💯', '👑',
  '🌟', '💎', '🎵', '🎶', '📸', '🎬', '🎭', '🎨', '🏆', '💪',
  '👍', '👏', '🙌', '💕', '😍', '😎', '🤩', '😂', '🥳', '🎂',
  '🌈', '☀️', '🌙', '⚡', '💧', '🍕', '🎮', '🚀', '💡', '🎯',
];

export const TRANSITION_TYPES: { value: TransitionType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'wipe', label: 'Wipe' },
];

export const EXPORT_PRESETS: Record<string, { width: number; height: number; label: string }> = {
  '720p': { width: 1280, height: 720, label: '720p HD' },
  '1080p': { width: 1920, height: 1080, label: '1080p Full HD' },
  '4K': { width: 3840, height: 2160, label: '4K Ultra HD' },
};
