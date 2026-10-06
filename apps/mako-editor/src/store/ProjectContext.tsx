import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Project, Clip, Track, EditorState, BottomPanel, ToolType, Effects, TextConfig } from '../types';
import { defaultEffects, defaultTransition } from '../types';

// ─── Actions ───
type Action =
  | { type: 'SET_VIEW'; view: 'home' | 'editor' }
  | { type: 'LOAD_PROJECT'; project: Project }
  | { type: 'CREATE_PROJECT'; project: Project }
  | { type: 'UPDATE_PROJECT'; updates: Partial<Project> }
  | { type: 'ADD_CLIP'; clip: Clip }
  | { type: 'UPDATE_CLIP'; clipId: string; updates: Partial<Clip> }
  | { type: 'DELETE_CLIP'; clipId: string }
  | { type: 'SELECT_CLIP'; clipId: string | null }
  | { type: 'SPLIT_CLIP'; clipId: string; atTime: number }
  | { type: 'DUPLICATE_CLIP'; clipId: string }
  | { type: 'SET_TIME'; time: number }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_TOOL'; tool: ToolType }
  | { type: 'SET_BOTTOM_PANEL'; panel: BottomPanel }
  | { type: 'SET_EXPORT_MODAL'; show: boolean }
  | { type: 'ADD_TRACK'; track: Track }
  | { type: 'TOGGLE_TRACK_MUTE'; trackId: string }
  | { type: 'TOGGLE_TRACK_LOCK'; trackId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY' };

function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    duration: 30,
    tracks: [
      { id: crypto.randomUUID(), type: 'video', name: 'Video', muted: false, locked: false, visible: true },
      { id: crypto.randomUUID(), type: 'overlay', name: 'Overlay', muted: false, locked: false, visible: true },
      { id: crypto.randomUUID(), type: 'text', name: 'Text', muted: false, locked: false, visible: true },
      { id: crypto.randomUUID(), type: 'audio', name: 'Audio', muted: false, locked: false, visible: true },
    ],
    clips: [],
    mediaLibrary: [],
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 30,
  };
}

const initialState: EditorState = {
  view: 'home',
  project: null,
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  activeTool: 'select',
  bottomPanel: 'none',
  showExportModal: false,
  history: [],
  historyIndex: -1,
};

function pushHistory(state: EditorState): EditorState {
  if (!state.project) return state;
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state.project)));
  // Keep max 50 states
  if (newHistory.length > 50) newHistory.shift();
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };

    case 'LOAD_PROJECT':
      return {
        ...state,
        view: 'editor',
        project: action.project,
        selectedClipId: null,
        currentTime: 0,
        isPlaying: false,
        history: [JSON.parse(JSON.stringify(action.project))],
        historyIndex: 0,
      };

    case 'CREATE_PROJECT': {
      const project = action.project || createDefaultProject();
      return {
        ...state,
        view: 'editor',
        project,
        selectedClipId: null,
        currentTime: 0,
        isPlaying: false,
        history: [JSON.parse(JSON.stringify(project))],
        historyIndex: 0,
      };
    }

    case 'UPDATE_PROJECT':
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, ...action.updates, updatedAt: Date.now() },
      };

    case 'ADD_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state);
      return {
        ...s,
        project: {
          ...s.project!,
          clips: [...s.project!.clips, action.clip],
          duration: Math.max(s.project!.duration, action.clip.startTime + action.clip.duration),
          updatedAt: Date.now(),
        },
      };
    }

    case 'UPDATE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state);
      return {
        ...s,
        project: {
          ...s.project!,
          clips: s.project!.clips.map(c =>
            c.id === action.clipId ? { ...c, ...action.updates } : c
          ),
          updatedAt: Date.now(),
        },
        selectedClipId: action.clipId,
      };
    }

    case 'DELETE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state);
      return {
        ...s,
        project: {
          ...s.project!,
          clips: s.project!.clips.filter(c => c.id !== action.clipId),
          updatedAt: Date.now(),
        },
        selectedClipId: state.selectedClipId === action.clipId ? null : state.selectedClipId,
      };
    }

    case 'SELECT_CLIP':
      return { ...state, selectedClipId: action.clipId };

    case 'SPLIT_CLIP': {
      if (!state.project) return state;
      const clip = state.project.clips.find(c => c.id === action.clipId);
      if (!clip) return state;
      const splitPoint = action.atTime - clip.startTime;
      if (splitPoint <= 0.1 || splitPoint >= clip.duration - 0.1) return state;

      const s = pushHistory(state);
      const firstHalf: Clip = {
        ...clip,
        duration: splitPoint,
        trimEnd: clip.trimEnd + (clip.duration - splitPoint),
      };
      const secondHalf: Clip = {
        ...clip,
        id: crypto.randomUUID(),
        startTime: clip.startTime + splitPoint,
        duration: clip.duration - splitPoint,
        trimStart: clip.trimStart + splitPoint,
      };

      return {
        ...s,
        project: {
          ...s.project!,
          clips: s.project!.clips.map(c => c.id === clip.id ? firstHalf : c).concat(secondHalf),
          updatedAt: Date.now(),
        },
      };
    }

    case 'DUPLICATE_CLIP': {
      if (!state.project) return state;
      const orig = state.project.clips.find(c => c.id === action.clipId);
      if (!orig) return state;
      const s = pushHistory(state);
      const dup: Clip = {
        ...orig,
        id: crypto.randomUUID(),
        startTime: orig.startTime + orig.duration,
      };
      return {
        ...s,
        project: {
          ...s.project!,
          clips: [...s.project!.clips, dup],
          duration: Math.max(s.project!.duration, dup.startTime + dup.duration),
          updatedAt: Date.now(),
        },
      };
    }

    case 'SET_TIME':
      return { ...state, currentTime: Math.max(0, action.time) };

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(4, action.zoom)) };

    case 'SET_TOOL':
      return { ...state, activeTool: action.tool };

    case 'SET_BOTTOM_PANEL':
      return { ...state, bottomPanel: action.panel };

    case 'SET_EXPORT_MODAL':
      return { ...state, showExportModal: action.show };

    case 'ADD_TRACK': {
      if (!state.project) return state;
      const s = pushHistory(state);
      return {
        ...s,
        project: {
          ...s.project!,
          tracks: [...s.project!.tracks, action.track],
          updatedAt: Date.now(),
        },
      };
    }

    case 'TOGGLE_TRACK_MUTE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t =>
            t.id === action.trackId ? { ...t, muted: !t.muted } : t
          ),
        },
      };
    }

    case 'TOGGLE_TRACK_LOCK': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t =>
            t.id === action.trackId ? { ...t, locked: !t.locked } : t
          ),
        },
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        project: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        project: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      };
    }

    case 'PUSH_HISTORY':
      return pushHistory(state);

    default:
      return state;
  }
}

// ─── Context ───
interface ProjectContextType {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  createNewProject: (name?: string) => void;
  loadProjectFromData: (project: Project) => void;
  addClip: (clip: Partial<Clip> & { type: Clip['type'] }) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  deleteClip: (clipId: string) => void;
  splitClip: (clipId: string) => void;
  selectedClip: Clip | null;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createNewProject = useCallback((name?: string) => {
    const project = createDefaultProject();
    if (name) project.name = name;
    dispatch({ type: 'CREATE_PROJECT', project });
  }, []);

  const loadProjectFromData = useCallback((project: Project) => {
    dispatch({ type: 'LOAD_PROJECT', project });
  }, []);

  const addClip = useCallback((clipData: Partial<Clip> & { type: Clip['type'] }) => {
    const clip: Clip = {
      id: crypto.randomUUID(),
      type: clipData.type,
      trackIndex: clipData.trackIndex ?? 0,
      startTime: clipData.startTime ?? state.currentTime,
      duration: clipData.duration ?? 5,
      trimStart: clipData.trimStart ?? 0,
      trimEnd: clipData.trimEnd ?? 0,
      speed: clipData.speed ?? 1,
      reversed: clipData.reversed ?? false,
      volume: clipData.volume ?? 1,
      fadeIn: clipData.fadeIn ?? 0,
      fadeOut: clipData.fadeOut ?? 0,
      effects: clipData.effects ?? { ...defaultEffects },
      keyframes: clipData.keyframes ?? [],
      transition: clipData.transition ?? { ...defaultTransition },
      mediaId: clipData.mediaId,
      mediaUrl: clipData.mediaUrl,
      textConfig: clipData.textConfig,
      stickerUrl: clipData.stickerUrl,
      position: clipData.position ?? { x: 50, y: 50 },
      scale: clipData.scale ?? 1,
      rotation: clipData.rotation ?? 0,
      opacity: clipData.opacity ?? 1,
      chromaKey: clipData.chromaKey ?? { enabled: false, color: '#00ff00', tolerance: 30 },
      bgRemoval: clipData.bgRemoval ?? false,
    };
    dispatch({ type: 'ADD_CLIP', clip });
  }, [state.currentTime]);

  const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
    dispatch({ type: 'UPDATE_CLIP', clipId, updates });
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    dispatch({ type: 'DELETE_CLIP', clipId });
  }, []);

  const splitClip = useCallback((clipId: string) => {
    dispatch({ type: 'SPLIT_CLIP', clipId, atTime: state.currentTime });
  }, [state.currentTime]);

  const selectedClip = state.project?.clips.find(c => c.id === state.selectedClipId) ?? null;

  return (
    <ProjectContext.Provider value={{
      state,
      dispatch,
      createNewProject,
      loadProjectFromData,
      addClip,
      updateClip,
      deleteClip,
      splitClip,
      selectedClip,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
