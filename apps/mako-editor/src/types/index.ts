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

export interface Transition {
  type: 'none' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'wipe' | 'zoom';
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

// ─── Editor State ───
export type EditorView = 'home' | 'editor';
export type ToolType = 'select' | 'trim' | 'split' | 'text' | 'sticker' | 'audio' | 'effects' | 'transitions' | 'crop';
export type BottomPanel = 'none' | 'tools' | 'effects' | 'text' | 'audio' | 'stickers' | 'transitions' | 'adjustments' | 'filters';

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
