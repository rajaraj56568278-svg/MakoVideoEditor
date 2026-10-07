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

  // Face smoothing/beauty
  faceSmooth: {
    enabled: boolean;
    smoothness: number; // 0-100, default 30
    skinDetail: number; // 0-100, default 50
  };

  // Beauty settings
  beauty: BeautySettings;

  // Portrait settings
  portrait: PortraitSettings;

  // Background removal (enhanced)
  bgRemovalSettings: BgRemovalSettings;
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

// ─── AI HD Enhancement ───
export type AiHdQuality = 'auto' | '720p' | '1080p' | '2K' | '4K';

export interface AiHdSettings {
  enabled: boolean;
  quality: AiHdQuality;
  strength: number; // 0-100, default 50
  detail: number; // 0-100, default 50
  sharpness: number; // 0-100, default 50
  noiseReduction: number; // 0-100, default 30
  showBeforeAfter: boolean;
}

export const defaultAiHdSettings: AiHdSettings = {
  enabled: false,
  quality: 'auto',
  strength: 50,
  detail: 50,
  sharpness: 50,
  noiseReduction: 30,
  showBeforeAfter: false,
};

// ─── Editor State ───
export type EditorView = 'home' | 'editor';
export type ToolType = 'select' | 'trim' | 'split' | 'text' | 'sticker' | 'audio' | 'effects' | 'transitions' | 'crop';
export type BottomPanel = 'none' | 'tools' | 'effects' | 'text' | 'audio' | 'stickers' | 'transitions' | 'adjustments' | 'filters' | 'speed' | 'crop' | 'chroma' | 'keyframe' | 'trim' | 'aihd' | 'facesmooth' | 'beauty' | 'portrait' | 'captions' | 'bgRemove' | 'avatar';

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
  aiHd: AiHdSettings;
  captions: CaptionSettings;
  avatars: AvatarConfig[];
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

// ─── Beauty Settings ───
export interface BeautySettings {
  enabled: boolean;
  skinSmooth: number;    // 0-100
  brightness: number;    // 0-100
  contrast: number;      // 0-100
  sharpness: number;     // 0-100
  skinTone: number;      // 0-100 (warmth)
  faceLight: number;     // 0-100
}

export const defaultBeautySettings: BeautySettings = {
  enabled: false,
  skinSmooth: 0,
  brightness: 50,
  contrast: 50,
  sharpness: 0,
  skinTone: 50,
  faceLight: 0,
};

// ─── Portrait Settings ───
export interface PortraitSettings {
  enabled: boolean;
  faceLight: number;      // 0-100
  smooth: number;         // 0-100
  detail: number;         // 0-100
  bgBlur: number;         // 0-100
  focus: number;          // 0-100 (portrait focus / vignette)
}

export const defaultPortraitSettings: PortraitSettings = {
  enabled: false,
  faceLight: 0,
  smooth: 0,
  detail: 0,
  bgBlur: 0,
  focus: 0,
};

// ─── Background Removal Settings ───
export type BgRemovalMode = 'transparent' | 'blur' | 'image' | 'video' | 'original';

export interface BgRemovalSettings {
  enabled: boolean;
  mode: BgRemovalMode;
  blurAmount: number;     // 0-100, for blur mode
  customImageUrl: string | null;
  customVideoUrl: string | null;
  processing: boolean;
  progress: number;       // 0-100
}

export const defaultBgRemovalSettings: BgRemovalSettings = {
  enabled: false,
  mode: 'transparent',
  blurAmount: 50,
  customImageUrl: null,
  customVideoUrl: null,
  processing: false,
  progress: 0,
};

// ─── Caption Segment ───
export interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  confidence: number; // 0-1
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  animation: 'none' | 'fade' | 'typewriter' | 'bounce' | 'highlight';
  bold: boolean;
}

export const defaultCaptionStyle: CaptionStyle = {
  fontFamily: 'Inter',
  fontSize: 24,
  color: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.6,
  position: 'bottom',
  animation: 'none',
  bold: true,
};

export interface CaptionSettings {
  enabled: boolean;
  segments: CaptionSegment[];
  style: CaptionStyle;
  language: string;
}

export const defaultCaptionSettings: CaptionSettings = {
  enabled: false,
  segments: [],
  style: { ...defaultCaptionStyle },
  language: 'en-US',
};

// ─── Avatar Settings ───
export type AvatarStyle = 'cartoon-boy' | 'cartoon-girl' | 'cat' | 'dog' | 'robot' | 'alien' | 'ninja' | 'pirate' | 'wizard' | 'superhero';

export interface AvatarConfig {
  id: string;
  style: AvatarStyle;
  text: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  startTime: number;
  duration: number;
}

export const AVATAR_STYLES: { value: AvatarStyle; label: string; emoji: string }[] = [
  { value: 'cartoon-boy', label: 'Boy', emoji: '👦' },
  { value: 'cartoon-girl', label: 'Girl', emoji: '👧' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'dog', label: 'Dog', emoji: '🐶' },
  { value: 'robot', label: 'Robot', emoji: '🤖' },
  { value: 'alien', label: 'Alien', emoji: '👽' },
  { value: 'ninja', label: 'Ninja', emoji: '🥷' },
  { value: 'pirate', label: 'Pirate', emoji: '🏴‍☠️' },
  { value: 'wizard', label: 'Wizard', emoji: '🧙' },
  { value: 'superhero', label: 'Hero', emoji: '🦸' },
];

// ─── Caption Languages ───
export const CAPTION_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-BR', label: 'Portuguese' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
];
