// ─── Media Types ───
export type MediaType = 'video' | 'image' | 'audio';

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  file: File;
  url: string;
  duration: number; // seconds
  width?: number;
  height?: number;
  thumbnail?: string;
}

// ─── Timeline Clip Types ───
export type ClipType = 'video' | 'audio' | 'text' | 'sticker' | 'overlay';

export interface Effects {
  blur: number;       // 0-20
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  grayscale: number;  // 0-100
  sepia: number;      // 0-100
  vignette: number;   // 0-100
  exposure: number;   // -100 to 100
  sharpness: number;  // 0-100
  temperature: number; // -100 to 100
}

export interface Keyframe {
  time: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface TextConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  shadow: boolean;
  shadowColor: string;
  animation: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'typewriter' | 'bounce' | 'zoom';
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
}

export type TransitionType =
  | 'none'
  | 'fade'
  | 'flash'
  | 'zoom-in'
  | 'zoom-out'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'spin'
  | 'glitch'
  | 'blur'
  | 'cross-dissolve';

export interface Transition {
  type: TransitionType;
  duration: number; // seconds
}

export interface Clip {
  id: string;
  type: ClipType;
  trackIndex: number;
  startTime: number;     // position on timeline in seconds
  duration: number;      // clip duration in seconds
  trimStart: number;     // trim from beginning
  trimEnd: number;       // trim from end
  speed: number;         // 0.25 to 4
  reversed: boolean;
  volume: number;        // 0-1
  fadeIn: number;        // seconds
  fadeOut: number;       // seconds
  effects: Effects;
  keyframes: Keyframe[];
  transition: Transition;

  // Media reference
  mediaId?: string;
  mediaUrl?: string;

  // Text config
  textConfig?: TextConfig;

  // Sticker/overlay
  stickerUrl?: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;

  // Chroma key
  chromaKey: {
    enabled: boolean;
    color: string;
    tolerance: number;
  };

  // AI bg removal
  bgRemoval: boolean;

  // Filter preset
  activeFilter: FilterType;
  filterIntensity: number; // 0-100
}

// ─── Track ───
export interface Track {
  id: string;
  type: ClipType;
  name: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

// ─── Project ───
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  tracks: Track[];
  clips: Clip[];
  mediaLibrary: MediaFile[];
  resolution: '720p' | '1080p' | '4K';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  fps: number;
  thumbnail?: string;
}

// ─── Filter Presets ───
export type FilterType =
  | 'original'
  | 'bright'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'cinematic'
  | 'vintage'
  | 'bw'
  | 'sepia'
  | 'dramatic'
  | 'fade'
  | 'sunset';

export interface FilterPreset {
  id: FilterType;
  name: string;
  cssFilters: {
    brightness: number;   // multiplier, 1 = no change
    contrast: number;     // multiplier
    saturate: number;     // multiplier
    grayscale: number;    // 0-1
    sepia: number;        // 0-1
    hueRotate: number;    // degrees
  };
  thumbnailGradient: string; // for preview swatch
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    cssFilters: { brightness: 1, contrast: 1, saturate: 1, grayscale: 0, sepia: 0, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'bright',
    name: 'Bright',
    cssFilters: { brightness: 1.25, contrast: 1.05, saturate: 1.1, grayscale: 0, sepia: 0, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  {
    id: 'vivid',
    name: 'Vivid',
    cssFilters: { brightness: 1.05, contrast: 1.2, saturate: 1.6, grayscale: 0, sepia: 0, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'warm',
    name: 'Warm',
    cssFilters: { brightness: 1.05, contrast: 1.05, saturate: 1.2, grayscale: 0, sepia: 0.25, hueRotate: -5 },
    thumbnailGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    id: 'cool',
    name: 'Cool',
    cssFilters: { brightness: 1.05, contrast: 1.05, saturate: 0.9, grayscale: 0, sepia: 0, hueRotate: 20 },
    thumbnailGradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    cssFilters: { brightness: 0.95, contrast: 1.15, saturate: 0.85, grayscale: 0, sepia: 0.12, hueRotate: -3 },
    thumbnailGradient: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    cssFilters: { brightness: 1.1, contrast: 0.9, saturate: 0.8, grayscale: 0, sepia: 0.45, hueRotate: -8 },
    thumbnailGradient: 'linear-gradient(135deg, #d4a574 0%, #8b6914 100%)',
  },
  {
    id: 'bw',
    name: 'B&W',
    cssFilters: { brightness: 1.05, contrast: 1.2, saturate: 1, grayscale: 1, sepia: 0, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    cssFilters: { brightness: 1.05, contrast: 1.05, saturate: 1, grayscale: 0, sepia: 0.8, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #c9a96e 0%, #6b4226 100%)',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    cssFilters: { brightness: 0.88, contrast: 1.4, saturate: 0.7, grayscale: 0, sepia: 0, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  {
    id: 'fade',
    name: 'Fade',
    cssFilters: { brightness: 1.2, contrast: 0.8, saturate: 0.7, grayscale: 0, sepia: 0.1, hueRotate: 0 },
    thumbnailGradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    cssFilters: { brightness: 1.05, contrast: 1.1, saturate: 1.4, grayscale: 0, sepia: 0.25, hueRotate: -12 },
    thumbnailGradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  },
];

// ─── Editor State ───
export type EditorView = 'home' | 'editor';
export type ToolType = 'select' | 'trim' | 'split' | 'text' | 'sticker' | 'audio' | 'effects' | 'transitions' | 'crop';
export type BottomPanel = 'none' | 'tools' | 'effects' | 'text' | 'audio' | 'stickers' | 'transitions' | 'adjustments' | 'filters' | 'speed' | 'crop' | 'chroma' | 'keyframe' | 'trim';

export interface EditorState {
  view: EditorView;
  project: Project | null;
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  activeTool: ToolType;
  bottomPanel: BottomPanel;
  showExportModal: boolean;
  history: Project[];
  historyIndex: number;
}

// ─── Default Effects ───
export const defaultEffects: Effects = {
  blur: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  grayscale: 0,
  sepia: 0,
  vignette: 0,
  exposure: 0,
  sharpness: 0,
  temperature: 0,
};

export const defaultTextConfig: TextConfig = {
  text: 'Your Text',
  fontFamily: 'Inter',
  fontSize: 32,
  color: '#ffffff',
  backgroundColor: 'transparent',
  shadow: true,
  shadowColor: '#000000',
  animation: 'none',
  align: 'center',
  bold: false,
  italic: false,
};

export const defaultTransition: Transition = {
  type: 'none',
  duration: 0.5,
};

// ─── Stickers ───
export const STICKER_EMOJIS = [
  '❤️', '🔥', '⭐', '✨', '💫', '🎉', '🎊', '💥',
  '😂', '😍', '🥰', '😎', '🤩', '😜', '🤪', '😇',
  '👍', '👏', '🙌', '💪', '🤝', '✌️', '🤟', '👋',
  '🎵', '🎶', '🎸', '🎬', '📸', '🎮', '🏆', '💎',
  '🌈', '☀️', '🌙', '⚡', '💧', '🍕', '🎂', '🌺',
];

export const FONT_FAMILIES = [
  'Inter',
  'Arial',
  'Georgia',
  'Courier New',
  'Times New Roman',
  'Verdana',
  'Impact',
  'Comic Sans MS',
];
