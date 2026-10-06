import { create } from 'zustand';
import type { Project } from '../types';

interface HistoryEntry {
  project: Project;
  timestamp: number;
  label: string;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxSize: number;

  pushHistory: (project: Project, label: string) => void;
  undo: () => Project | null;
  redo: () => Project | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxSize: 50,

  pushHistory: (project, label) => {
    set(state => {
      const entry: HistoryEntry = { project: JSON.parse(JSON.stringify(project)), timestamp: Date.now(), label };
      const past = [...state.past, entry];
      if (past.length > state.maxSize) past.shift();
      return { past, future: [] }; // Clear future on new action
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;

    const entry = past[past.length - 1];
    set(state => ({
      past: state.past.slice(0, -1),
      future: [entry, ...state.future],
    }));

    return JSON.parse(JSON.stringify(entry.project));
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const entry = future[0];
    set(state => ({
      future: state.future.slice(1),
      past: [...state.past, entry],
    }));

    return JSON.parse(JSON.stringify(entry.project));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clearHistory: () => set({ past: [], future: [] }),
}));
